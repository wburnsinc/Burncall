import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, asc } from "drizzle-orm";
import { db, appointmentsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { dispatchEvent } from "../lib/webhookDispatcher";

const router: IRouter = Router();
router.use(requireAuth);

// GET /api/appointments
router.get("/appointments", async (req: Request, res: Response) => {
  const { status, date } = req.query as Record<string, string>;
  const businessId = req.auth!.businessId;

  const conditions = [eq(appointmentsTable.businessId, businessId)];
  if (status && status !== "all") conditions.push(eq(appointmentsTable.status, status));

  let appts = await db.select().from(appointmentsTable).where(and(...conditions)).orderBy(asc(appointmentsTable.scheduledAt));

  if (date) {
    const d = new Date(date);
    appts = appts.filter((a) => new Date(a.scheduledAt).toDateString() === d.toDateString());
  }

  res.json({ appointments: appts, total: appts.length });
});

// GET /api/appointments/:id
router.get("/appointments/:id", async (req: Request, res: Response) => {
  const appt = await db.query.appointmentsTable.findFirst({ where: eq(appointmentsTable.id, Number(req.params.id)) });
  if (!appt || appt.businessId !== req.auth!.businessId) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.json(appt);
});

// PATCH /api/appointments/:id
router.patch("/appointments/:id", async (req: Request, res: Response) => {
  const appt = await db.query.appointmentsTable.findFirst({ where: eq(appointmentsTable.id, Number(req.params.id)) });
  if (!appt || appt.businessId !== req.auth!.businessId) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  const { businessId: _ignore, id: _ignoreId, ...safeUpdates } = req.body ?? {};
  if (safeUpdates.scheduledAt) safeUpdates.scheduledAt = new Date(safeUpdates.scheduledAt);
  const [updated] = await db
    .update(appointmentsTable)
    .set({ ...safeUpdates, updatedAt: new Date() })
    .where(eq(appointmentsTable.id, appt.id))
    .returning();
  res.json(updated);
});

// POST /api/appointments
// Manual booking from the dashboard. AI-driven bookings go through the
// book_appointment tool in lib/receptionist.ts instead.
router.post("/appointments", async (req: Request, res: Response) => {
  const { customerName, customerPhone, customerEmail, service, scheduledAt, duration, estimatedValue, notes, assignedTech, address, leadId } = req.body ?? {};
  if (!customerName || !service || !scheduledAt) {
    res.status(400).json({ error: "customerName, service, and scheduledAt are required" });
    return;
  }
  const [appt] = await db
    .insert(appointmentsTable)
    .values({
      businessId: req.auth!.businessId,
      leadId: leadId ?? null,
      customerName,
      customerPhone: customerPhone || null,
      customerEmail: customerEmail || null,
      service,
      scheduledAt: new Date(scheduledAt),
      duration: duration ?? 60,
      estimatedValue: estimatedValue ?? null,
      notes: notes || null,
      assignedTech: assignedTech || null,
      address: address || null,
      status: "scheduled",
    })
    .returning();
  dispatchEvent(req.auth!.businessId, "appointment.confirmed", { appointmentId: appt.id, leadId: appt.leadId, service: appt.service, scheduledAt: appt.scheduledAt }).catch(() => {});
  res.status(201).json(appt);
});

export default router;
