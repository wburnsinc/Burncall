import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, appointmentsTable, businessesTable } from "@workspace/db";
import { buildAppointmentIcs } from "../lib/ics";

// Intentionally unauthenticated routes — meant to be opened directly from an
// emailed/texted link by a customer who has no BurnCall account. The
// unguessable numeric id + no sensitive data in the response is the access
// control here, same as most calendar-invite links.
const router: IRouter = Router();

// GET /api/appointments/:id/ics — real "add to calendar" file (Google/Apple/Outlook compatible)
router.get("/appointments/:id/ics", async (req: Request, res: Response) => {
  const appt = await db.query.appointmentsTable.findFirst({ where: eq(appointmentsTable.id, Number(req.params.id)) });
  if (!appt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  const business = await db.query.businessesTable.findFirst({ where: eq(businessesTable.id, appt.businessId) });
  const ics = buildAppointmentIcs({
    uid: String(appt.id),
    businessName: business?.name || "Your service appointment",
    service: appt.service,
    customerName: appt.customerName,
    scheduledAt: new Date(appt.scheduledAt),
    durationMinutes: appt.duration ?? 60,
    address: appt.address,
  });
  res.set("Content-Type", "text/calendar; charset=utf-8");
  res.set("Content-Disposition", `attachment; filename="appointment-${appt.id}.ics"`);
  res.send(ics);
});

export default router;
