/**
 * Generates a standards-compliant .ics (iCalendar) file for a single
 * appointment. This is a real, self-contained "add to calendar" capability
 * that works with Google Calendar, Apple Calendar, Outlook, etc. via the
 * universal .ics format — it does NOT require OAuth or a live integration
 * with any specific calendar provider (that would be a separate, larger
 * feature — see DEPLOY.md for why that's out of scope here).
 */

function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
}

export function buildAppointmentIcs(opts: {
  uid: string;
  businessName: string;
  service: string;
  customerName: string;
  scheduledAt: Date;
  durationMinutes: number;
  address?: string | null;
}): string {
  const start = opts.scheduledAt;
  const end = new Date(start.getTime() + opts.durationMinutes * 60000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BurnCall//Appointment//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.uid}@burncall`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(`${opts.service} — ${opts.businessName}`)}`,
    `DESCRIPTION:${escapeIcsText(`Appointment with ${opts.businessName} for ${opts.customerName}`)}`,
    opts.address ? `LOCATION:${escapeIcsText(opts.address)}` : null,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}
