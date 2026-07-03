import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getBudgetGoals, getWalletBalance, updateBudgetGoals, updateWalletBalance } from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.get("/wallet-balance", authMiddleware, getWalletBalance);
userRouter.put("/wallet-balance", authMiddleware, updateWalletBalance);
userRouter.get("/budget-goals", authMiddleware, getBudgetGoals);
userRouter.put("/budget-goals", authMiddleware, updateBudgetGoals);

export default userRouter;
