import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import missionsRouter from "./missions";
import dutyRouter from "./duty";
import loaRouter from "./loa";
import newsRouter from "./news";
import usersRouter from "./users";
import customRolesRouter from "./custom-roles";
import pushTokensRouter from "./push-tokens";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(missionsRouter);
router.use(dutyRouter);
router.use(loaRouter);
router.use(newsRouter);
router.use(usersRouter);
router.use(customRolesRouter);
router.use(pushTokensRouter);

export default router;
