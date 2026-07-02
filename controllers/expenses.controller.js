import Expense from "../models/expense.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";


export const createExpense = async (req, res, next) => {
    try{

        const { title, amount, category, description, paymentMethod, expenseDate } = req.body;

         if (!title || amount == null || !category) {
            return res.status(400).json({ message: "Title, amount, and category are required" });
        }
    
        const expense = new Expense({ title, 
            amount, 
            category, 
            description, 
            paymentMethod, 
            expenseDate, 
            userId: req.userId });

    await expense.save();
    res.status(201).json({
    success: true,
    message: "Expense created successfully",
    expense
    
    });
    }catch(error){
        next(error);
  
    }

}

export const getExpenses = async (req, res, next) => {
    try{
        const expenses = await Expense.find({ userId: req.userId });  
        res.status(200).json({
            success: true,
            data: expenses
        });

    }catch(error){
        next(error);
    }
}

export const getExpense = async (req, res, next) => {

    try{
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.userId });

    if(!expense) {
        return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({
        success: true,
        data: expense
     });
    }catch(error){
        next(error);
    }
}