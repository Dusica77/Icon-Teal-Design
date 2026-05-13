import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import financeRouter from "./finance";
import hrRouter from "./hr";
import inventoryRouter from "./inventory";
import projectsRouter from "./projects";
import analyticsRouter from "./analytics";
import notificationsRouter from "./notifications";
import forecastRouter from "./forecast";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(financeRouter);
router.use(hrRouter);
router.use(inventoryRouter);
router.use(projectsRouter);
router.use(analyticsRouter);
router.use(notificationsRouter);
router.use(forecastRouter);

export default router;
