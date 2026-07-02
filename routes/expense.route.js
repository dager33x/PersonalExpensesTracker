import { Router } from "express";
import authorize from "../middlewares/auth.middleware.js";
import { createExpense, getExpense, getExpenses } from "../controllers/expenses.controller.js";
const expenseRouter = Router();

expenseRouter.post("/create", authorize, createExpense);
expenseRouter.get("/list", authorize, getExpenses);
expenseRouter.get("/:id", authorize, getExpense);



export default expenseRouter;