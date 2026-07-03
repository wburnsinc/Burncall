import { eq, and, lte, inArray } from "drizzle-orm";
import {
  db,
  automationsTable,
  automationRunsTable,
  leadsTable,
  appointmentsTable,
  businessesTable,
  type Automation,
} from "@workspace/db";
import { sendEmail, sendSms } from "./notifications";
import { logger } from "./logger";

/**
 * Automation trigger execution.
 *
 * Automations previously could be created and toggled on/off but nothing
 * ever ran them — this is what actually fires them. It's a simple in-process
 * poller (setInterval), not a real job queue: it only works while this Node
 * process stays running continuously (true on Railway/Replit's always-on
 * dynos, NOT on serverless/edge deployments where the process sleeps).
 *
 * Two trigger patterns are supported, matched against automations.triggerEvent:
 *   - `no_reply_<N>hr`         — leads stuck in new/contacted for N+ hours
 *   - `appointment_reminder_<N>hr` — scheduled appointments starting within N hours
 *
 * Every send is deduplicated via automation_runs so the same lead/appointment
 * never gets double-messaged by the same automation.
 */

const NO_REPLY_RE = /^no_reply_(\d+)hr$/;
const APPT_REMINDER_RE = /^appointment_reminder_(\d+)hr$/;

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

async function alreadyRan(automationId: number, targetType: string, targetId: number): Promise<boolean> {
  const existing = await db.query.automationRunsTable.findFirst({
    where: and(eq(automationRunsTable.automationId, automationId), eq(automationRunsTable.targetType, targetType), eq(automationRunsTable.targetId, targetId)),
  });
  return Boolean(existing);
}

async function recordRun(automationId: number, targetType: string, targetId: number) {
  await db.insert(automationRunsTable).values({ automationId, targetType, targetId });
}

async function bumpStats(automation: Automation, field: "sent" | "failed") {
  const stats = automation.stats ?? { triggered: 0, sent: 0, failed: 0, opened: 0 };
  stats.triggered += 1;
  stats[field] += 1;
  await db.update(automationsTable).set({ stats, lastRunAt: new Date(), updatedAt: new Date() }).where(eq(automationsTable.id, automation.id));
}

async function deliver(automation: Automation, message: string, phone: string | null, email: string | null) {
  let ok = false;
  if ((automation.channel === "sms" || automation.channel === "both") && phone) {
    const r = await sendSms({ to: phone, body: message });
    ok = ok || r.sent;
  }
  if ((automation.channel === "email" || automation.channel === "both") && email) {
    const r = await sendEmail({ to: email, subject: automation.name, text: message });
    ok = ok || r.sent;
  }
  await bumpStats(automation, ok ? "sent" : "failed");
}

async function runNoReplyFollowUp(automation: Automation, hours: number) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const candidates = await db
    .select()
    .from(leadsTable)
    .where(and(eq(leadsTable.businessId, automation.businessId), inArray(leadsTable.status, ["new", "contacted"]), lte(leadsTable.createdAt, cutoff)));

  const business = await db.query.businessesTable.findFirst({ where: eq(businessesTable.id, automation.businessId) });

  for (const lead of candidates) {
    if (await alreadyRan(automation.id, "lead", lead.id)) continue;
    const message = fillTemplate(automation.templateBody || `Hi {{customer_name}}, just following up on your ${lead.service || "request"} — still interested?`, {
      customer_name: lead.name,
      business_name: business?.name || "",
      service: lead.service || "",
    });
    await deliver(automation, message, lead.phone, lead.email);
    await recordRun(automation.id, "lead", lead.id);
  }
}

async function runAppointmentReminder(automation: Automation, hours: number) {
  const windowEnd = new Date(Date.now() + hours * 60 * 60 * 1000);
  const candidates = await db
    .select()
    .from(appointmentsTable)
    .where(and(eq(appointmentsTable.businessId, automation.businessId), eq(appointmentsTable.status, "scheduled"), lte(appointmentsTable.scheduledAt, windowEnd)));

  const business = await db.query.businessesTable.findFirst({ where: eq(businessesTable.id, automation.businessId) });

  for (const appt of candidates) {
    if (new Date(appt.scheduledAt).getTime() < Date.now()) continue; // already passed, don't remind
    if (await alreadyRan(automation.id, "appointment", appt.id)) continue;
    const message = fillTemplate(automation.templateBody || `Reminder: your {{service}} appointment with {{business_name}} is coming up on {{time}}.`, {
      customer_name: appt.customerName,
      business_name: business?.name || "",
      service: appt.service,
      time: new Date(appt.scheduledAt).toLocaleString(),
    });
    await deliver(automation, message, appt.customerPhone, appt.customerEmail);
    await recordRun(automation.id, "appointment", appt.id);
  }
}

export async function processAutomations(): Promise<void> {
  const enabled = await db.select().from(automationsTable).where(eq(automationsTable.enabled, true));

  for (const automation of enabled) {
    try {
      const noReplyMatch = automation.triggerEvent.match(NO_REPLY_RE);
      const reminderMatch = automation.triggerEvent.match(APPT_REMINDER_RE);

      if (noReplyMatch) {
        await runNoReplyFollowUp(automation, Number(noReplyMatch[1]));
      } else if (reminderMatch) {
        await runAppointmentReminder(automation, Number(reminderMatch[1]));
      }
      // Other trigger types (e.g. instant_response, missed_call, review_request)
      // are handled inline at the moment the event happens, not by this poller.
    } catch (err) {
      logger.error({ err, automationId: automation.id }, "Automation run failed");
    }
  }
}

let intervalHandle: NodeJS.Timeout | null = null;

export function startAutomationScheduler(): void {
  const intervalMs = Number(process.env.AUTOMATION_POLL_INTERVAL_MS) || 5 * 60 * 1000; // default: every 5 minutes
  if (intervalHandle) return;
  intervalHandle = setInterval(() => {
    processAutomations().catch((err) => logger.error({ err }, "processAutomations crashed"));
  }, intervalMs);
  logger.info({ intervalMs }, "Automation scheduler started");
}
