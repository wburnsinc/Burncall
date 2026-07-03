import { logger } from "./logger";

/**
 * Notification layer for email + SMS.
 *
 * Real SDK calls are used whenever the relevant API key is present in the
 * environment. If a key is missing, we log the message instead of throwing —
 * this lets the whole app run locally/demo without every integration
 * configured, while still doing REAL sends the moment keys are added.
 */

let resendClient: import("resend").Resend | null = null;
async function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    const { Resend } = await import("resend");
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

let twilioClient: ReturnType<typeof import("twilio")> | null = null;
async function getTwilio() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  if (!twilioClient) {
    const twilioModule = await import("twilio");
    twilioClient = twilioModule.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

export interface SendEmailArgs {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(args: SendEmailArgs): Promise<{ sent: boolean; provider: string }> {
  const resend = await getResend();
  if (!resend) {
    logger.warn({ to: args.to, subject: args.subject }, "RESEND_API_KEY not set — email not sent (logged only)");
    return { sent: false, provider: "none" };
  }

  const from = process.env.NOTIFY_FROM_EMAIL || "BurnCall <notifications@resend.dev>";
  try {
    await resend.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
    });
    return { sent: true, provider: "resend" };
  } catch (err) {
    logger.error({ err, to: args.to }, "Resend email send failed");
    return { sent: false, provider: "resend" };
  }
}

export interface SendSmsArgs {
  to: string;
  body: string;
}

export async function sendSms(args: SendSmsArgs): Promise<{ sent: boolean; provider: string }> {
  const twilio = await getTwilio();
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (!twilio || !fromNumber) {
    logger.warn({ to: args.to }, "TWILIO_* env vars not set — SMS not sent (logged only)");
    return { sent: false, provider: "none" };
  }

  try {
    await twilio.messages.create({ to: args.to, from: fromNumber, body: args.body });
    return { sent: true, provider: "twilio" };
  } catch (err) {
    logger.error({ err, to: args.to }, "Twilio SMS send failed");
    return { sent: false, provider: "twilio" };
  }
}

/** Notifies the business owner/team that a lead needs human attention (escalation). */
export async function notifyBusinessOfEscalation(opts: {
  notifyEmails?: string | null;
  businessName: string;
  leadName: string;
  reason: string;
}) {
  if (!opts.notifyEmails) return;
  const recipients = opts.notifyEmails.split(",").map((e) => e.trim()).filter(Boolean);
  await Promise.all(
    recipients.map((to) =>
      sendEmail({
        to,
        subject: `⚠️ ${opts.businessName}: ${opts.leadName} needs a human`,
        text: `${opts.leadName} needs a human response.\n\nReason: ${opts.reason}\n\nOpen the Inbox to respond.`,
      }),
    ),
  );
}
