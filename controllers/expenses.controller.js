import Expense from "../models/expense.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";


export const createExpense = async (req, res, next) => {
    try{

        const { title, amount, category, description, date } = req.body;

         if (!title || amount == null || !category) {
            return res.status(400).json({ 
                message: "Title, amount, and category are required",
                success: false
             });
        }
    
        const expense = new Expense({ title, 
            amount, 
            category, 
            description, 
            date, 
            userId: req.user._id });

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
        const expenses = await Expense.find({ userId: req.user._id });  
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
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });

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

export const updateExpense = async (req, res, next) => {

    try{
        
    const expense = await Expense.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        req.body,
        { new: true, runValidators: true }
    );

    if(!expense) {

        return res.status(404).json({ 
        message: "Expense not found",
        success: false 

        });
    }

    res.status(200).json({
        success: true,
        data: expense
    });

    }catch(error){
     next(error);
    }

}

export const deleteExpense = async (req, res, next) => {

    try{
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if(!expense) {
        return res.status(404).json({ 
            message: "Expense not found",
            success: false
        });
    }  

    res.status(200).json({
        success: true,
        message: "Expense deleted successfully"
    });

}catch(error){
    next(error);
}

}
