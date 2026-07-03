import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import expenseMiddleware from "../middlewares/expenses.middleware.js";
import { createExpense, deleteExpense, getExpense, getExpenses, updateExpense } from "../controllers/expenses.controller.js";
import validateExpense from "../validations/expense.validation.js";


const expenseRouter = Router();

expenseRouter.post("/create", 
    authMiddleware, 
    validateExpense,
    createExpense);

expenseRouter.get("/list", 
    authMiddleware, 
    getExpenses);

expenseRouter.get("/:id", 
    authMiddleware, 
    expenseMiddleware, 
    getExpense);

expenseRouter.put("/:id",
    authMiddleware,
    expenseMiddleware,
    validateExpense,
    updateExpense);

expenseRouter.delete("/:id",
    authMiddleware,
    expenseMiddleware,
    deleteExpense);



export default expenseRouter;
