import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import leadsRouter from "./leads";
import dashboardRouter from "./dashboard";
import appointmentsRouter from "./appointments";
import automationsRouter from "./automations";
import inboxRouter from "./inbox";
import stripeRouter from "./stripe";
import aiRouter from "./ai";
import twilioRouter from "./twilio";
import businessRouter from "./business";
import teamRouter from "./team";
import integrationsRouter from "./integrations";
import webhooksRouter from "./webhooks";
import publicRouter from "./public";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicRouter);
router.use(authRouter);
router.use(leadsRouter);
router.use(dashboardRouter);
router.use(appointmentsRouter);
router.use(automationsRouter);
router.use(inboxRouter);
router.use(stripeRouter);
router.use(aiRouter);
router.use(twilioRouter);
router.use(businessRouter);
router.use(teamRouter);
router.use(integrationsRouter);
router.use(webhooksRouter);
router.use(adminRouter);

export default router;
