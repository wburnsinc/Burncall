import Anthropic from "@anthropic-ai/sdk";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, leadsTable, conversationsTable, appointmentsTable, businessesTable, aiUsageLogTable, type Business } from "@workspace/db";
import { logger } from "./logger";
import { sendSms, sendEmail, notifyBusinessOfEscalation } from "./notifications";
import { dispatchEvent } from "./webhookDispatcher";

async function logAiUsage(businessId: number, usage: { input_tokens: number; output_tokens: number }) {
  try {
    await db.insert(aiUsageLogTable).values({ businessId, inputTokens: usage.input_tokens, outputTokens: usage.output_tokens });
  } catch (err) {
    logger.error({ err }, "Failed to record AI usage log");
  }
}

/**
 * BurnCall AI Receptionist
 * ------------------------
 * This is the core "AI answers every lead in under 60 seconds" feature.
 * It uses real Anthropic tool use: the model can call qualify_lead,
 * check_availability, book_appointment, and escalate_to_human, and each
 * tool call actually reads/writes the database and can trigger real
 * email/SMS notifications.
 *
 * Requires ANTHROPIC_API_KEY. Throws a clear error if it's missing so the
 * failure is obvious rather than silently mocked.
 */

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. The AI receptionist cannot run without it — add it to your environment/Replit secrets.",
    );
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

const TOOLS: Anthropic.Tool[] = [
  {
    name: "qualify_lead",
    description:
      "Record/update structured qualification info extracted from the conversation so far (service needed, urgency, zip code, estimated value). Call this whenever you learn new qualifying details, even partial.",
    input_schema: {
      type: "object",
      properties: {
        service: { type: "string", description: "The service the customer needs, e.g. 'AC repair', 'water heater install'" },
        urgency: { type: "string", enum: ["low", "medium", "high", "emergency"] },
        zipCode: { type: "string" },
        estimatedValue: { type: "number", description: "Rough estimated job value in USD, if inferable" },
        score: { type: "number", description: "Lead quality score 0-100 based on fit, urgency, and buying intent" },
      },
      required: [],
    },
  },
  {
    name: "check_availability",
    description: "Check open appointment slots for the business on a given date (YYYY-MM-DD). Returns a list of free time windows.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date to check, format YYYY-MM-DD" },
      },
      required: ["date"],
    },
  },
  {
    name: "book_appointment",
    description: "Book a confirmed appointment for the customer. Only call this after the customer has explicitly agreed to a specific date/time.",
    input_schema: {
      type: "object",
      properties: {
        customerName: { type: "string" },
        customerPhone: { type: "string" },
        customerEmail: { type: "string" },
        service: { type: "string" },
        scheduledAt: { type: "string", description: "ISO 8601 datetime for the appointment" },
        address: { type: "string" },
      },
      required: ["customerName", "service", "scheduledAt"],
    },
  },
  {
    name: "escalate_to_human",
    description:
      "Hand the conversation off to a human team member. Use this for emergencies, angry/upset customers, complex pricing negotiations, or anything outside your knowledge (policies, FAQs, services) provided to you.",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Short reason for the human handoff" },
      },
      required: ["reason"],
    },
  },
];

function buildSystemPrompt(business: Business): string {
  const services = (business.services ?? []).map((s) => `- ${s.name} (${s.price}): ${s.questions}`).join("\n") || "(none configured yet)";
  const faqs = (business.faqs ?? []).map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n") || "(none configured yet)";
  const policies = (business.policies ?? {}) as { aiInstructions?: string; serviceZips?: string[] };
  const customInstructions = policies.aiInstructions ? `\nAdditional business-specific instructions:\n${policies.aiInstructions}\n` : "";
  const serviceZips = policies.serviceZips?.length ? `Service ZIP codes: ${policies.serviceZips.join(", ")}.` : "";

  return `You are the AI receptionist for ${business.name || "this business"}, a ${business.industry || "home services"} company.
Tone: ${business.replyTone || "professional"}. Service area: ${business.serviceArea || "not specified"}. ${serviceZips}
Emergency service available: ${business.emergencyService ? "yes" : "no"}.

Your job: respond to every inbound customer message within seconds, qualify the lead, answer questions using ONLY the services/FAQs below, and book an appointment when the customer is ready — or escalate to a human when appropriate.

SERVICES:
${services}

FAQS:
${faqs}
${customInstructions}
Rules:
- Be warm, concise, and helpful. Keep replies to 2-4 sentences unless more detail is truly needed.
- Never invent pricing, availability, or policies not listed above — if asked something you don't know, say you'll have a team member confirm, and call escalate_to_human.
- Always call qualify_lead as soon as you learn the service/urgency/zip/value, even if partial.
- For anything that sounds like a true emergency (no heat/AC in extreme temps, gas smell, active leak/flooding, electrical hazard), immediately call escalate_to_human in addition to your customer-facing reply.
- Only call book_appointment after the customer has explicitly agreed to a specific date and time you offered via check_availability.
- Never claim an appointment is booked unless you actually called book_appointment successfully.`;
}

interface ReceptionistMessage {
  role: "customer" | "ai" | "human";
  content: string;
  ts: string;
}

async function runTool(
  name: string,
  input: Record<string, unknown>,
  ctx: { businessId: number; leadId: number; business: Business },
): Promise<unknown> {
  switch (name) {
    case "qualify_lead": {
      const updates: Record<string, unknown> = {};
      if (input.service) updates.service = input.service;
      if (input.urgency) updates.urgency = input.urgency;
      if (input.zipCode) updates.zipCode = input.zipCode;
      if (input.estimatedValue) updates.estimatedValue = input.estimatedValue;
      if (input.score !== undefined) updates.score = input.score;
      if (Object.keys(updates).length > 0) {
        await db.update(leadsTable).set(updates).where(eq(leadsTable.id, ctx.leadId));
      }
      return { ok: true };
    }

    case "check_availability": {
      const date = String(input.date);
      const dayStart = new Date(`${date}T00:00:00`);
      const dayEnd = new Date(`${date}T23:59:59`);
      const existing = await db
        .select({ scheduledAt: appointmentsTable.scheduledAt, duration: appointmentsTable.duration })
        .from(appointmentsTable)
        .where(and(eq(appointmentsTable.businessId, ctx.businessId), gte(appointmentsTable.scheduledAt, dayStart), lte(appointmentsTable.scheduledAt, dayEnd)));

      const busyHours = new Set(existing.map((a) => new Date(a.scheduledAt).getHours()));
      const businessHours = [8, 9, 10, 11, 13, 14, 15, 16, 17];
      const openSlots = businessHours.filter((h) => !busyHours.has(h)).map((h) => `${date}T${String(h).padStart(2, "0")}:00:00`);
      return { date, openSlots };
    }

    case "book_appointment": {
      const [appt] = await db
        .insert(appointmentsTable)
        .values({
          businessId: ctx.businessId,
          leadId: ctx.leadId,
          customerName: String(input.customerName),
          customerPhone: (input.customerPhone as string) || null,
          customerEmail: (input.customerEmail as string) || null,
          service: String(input.service),
          scheduledAt: new Date(String(input.scheduledAt)),
          address: (input.address as string) || null,
          status: "scheduled",
        })
        .returning();

      await db.update(leadsTable).set({ status: "booked", lastContactedAt: new Date() }).where(eq(leadsTable.id, ctx.leadId));

      const appUrl = process.env.PUBLIC_API_URL || process.env.PUBLIC_APP_URL || "";
      const icsLink = appUrl ? `${appUrl}/api/appointments/${appt.id}/ics` : null;

      // Real confirmation notifications (no-op if keys aren't configured)
      if (input.customerPhone) {
        await sendSms({ to: String(input.customerPhone), body: `${ctx.business.name}: You're confirmed for ${appt.service} on ${new Date(appt.scheduledAt).toLocaleString()}.` });
      }
      if (input.customerEmail) {
        await sendEmail({
          to: String(input.customerEmail),
          subject: `Appointment confirmed — ${ctx.business.name}`,
          text: `You're confirmed for ${appt.service} on ${new Date(appt.scheduledAt).toLocaleString()}.${icsLink ? `\n\nAdd to your calendar: ${icsLink}` : ""}`,
        });
      }
      dispatchEvent(ctx.businessId, "appointment.confirmed", { appointmentId: appt.id, leadId: ctx.leadId, service: appt.service, scheduledAt: appt.scheduledAt }).catch(() => {});
      return { ok: true, appointmentId: appt.id };
    }

    case "escalate_to_human": {
      await db.update(conversationsTable).set({ status: "needs_human", aiHandled: false }).where(eq(conversationsTable.leadId, ctx.leadId));
      await notifyBusinessOfEscalation({
        notifyEmails: ctx.business.notifyEmails,
        businessName: ctx.business.name,
        leadName: "A customer",
        reason: String(input.reason || "Needs human attention"),
      });
      return { ok: true };
    }

    default:
      return { error: `Unknown tool ${name}` };
  }
}

/**
 * Single-turn test call used by the Knowledge Base "Test AI Response" tool.
 * Uses the business's real, live system prompt (services/FAQs/tone/custom
 * instructions) but skips tool use and persistence entirely — nothing is
 * written to leads/conversations/appointments. Lets someone sanity-check
 * how the AI would respond without polluting real data or triggering real
 * notifications.
 */
export async function testReceptionistReply(businessId: number, message: string): Promise<string> {
  const client = getClient();
  const business = await db.query.businessesTable.findFirst({ where: eq(businessesTable.id, businessId) });
  if (!business) throw new Error(`Business ${businessId} not found`);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: buildSystemPrompt(business) + "\n\nThis is a TEST message from the business owner previewing AI behavior, not a real customer — respond normally as if it were a real customer message.",
    messages: [{ role: "user", content: message }],
  });

  const text = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n").trim();
  await logAiUsage(businessId, response.usage);
  return text || "(no response generated)";
}

/**
 * Runs one turn of the AI receptionist: given the full message history plus
 * a new customer message, calls Claude (with tool use looped until it
 * produces a final text reply), persists everything, and returns the reply.
 */
export async function runReceptionistTurn(opts: {
  businessId: number;
  leadId: number;
  history: ReceptionistMessage[];
  customerMessage: string;
}): Promise<{ reply: string; conversationStatus: "open" | "needs_human" }> {
  const client = getClient();

  const business = await db.query.businessesTable.findFirst({ where: eq(businessesTable.id, opts.businessId) });
  if (!business) throw new Error(`Business ${opts.businessId} not found`);

  const system = buildSystemPrompt(business);

  const messages: Anthropic.MessageParam[] = opts.history.map((m) => ({
    role: m.role === "customer" ? "user" : "assistant",
    content: m.content,
  }));
  messages.push({ role: "user", content: opts.customerMessage });

  let escalated = false;
  let finalText = "";

  // Tool-use loop: keep calling Claude until it stops requesting tools.
  for (let turn = 0; turn < 5; turn++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      tools: TOOLS,
      messages,
    });

    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
    finalText = textBlocks.map((b) => b.text).join("\n").trim() || finalText;
    await logAiUsage(opts.businessId, response.usage);

    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
      break;
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const use of toolUses) {
      if (use.name === "escalate_to_human") escalated = true;
      try {
        const result = await runTool(use.name, use.input as Record<string, unknown>, { businessId: opts.businessId, leadId: opts.leadId, business });
        toolResults.push({ type: "tool_result", tool_use_id: use.id, content: JSON.stringify(result) });
      } catch (err) {
        logger.error({ err, tool: use.name }, "receptionist tool call failed");
        toolResults.push({ type: "tool_result", tool_use_id: use.id, content: JSON.stringify({ error: "tool_failed" }), is_error: true });
      }
    }
    messages.push({ role: "user", content: toolResults });
  }

  if (!finalText) {
    finalText = "Thanks for reaching out — a team member will follow up with you shortly.";
    escalated = true;
  }

  return { reply: finalText, conversationStatus: escalated ? "needs_human" : "open" };
}
