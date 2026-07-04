import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  getBudgetGoals,
  getProfile,
  getProfileUploadConfig,
  getWalletBalance,
  resetProfileAvatar,
  updateBudgetGoals,
  updateProfileAvatar,
  updateWalletBalance,
} from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.get("/profile", authMiddleware, getProfile);
userRouter.get("/profile/upload-config", authMiddleware, getProfileUploadConfig);
userRouter.put("/profile/avatar", authMiddleware, updateProfileAvatar);
userRouter.delete("/profile/avatar", authMiddleware, resetProfileAvatar);
userRouter.get("/wallet-balance", authMiddleware, getWalletBalance);
userRouter.put("/wallet-balance", authMiddleware, updateWalletBalance);
userRouter.get("/budget-goals", authMiddleware, getBudgetGoals);
userRouter.put("/budget-goals", authMiddleware, updateBudgetGoals);

export default userRouter;
