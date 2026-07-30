import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import leadsRouter from "./leads";
import generationRouter from "./generation";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter); // kept for backward compat
router.use(leadsRouter);
router.use(generationRouter);
router.use(storageRouter);

export default router;
