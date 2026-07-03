import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { coachExpenseAdvice } from "../controllers/ai.controller.js";

const aiRouter = Router();

aiRouter.post("/coach", authMiddleware, coachExpenseAdvice);

export default aiRouter;
