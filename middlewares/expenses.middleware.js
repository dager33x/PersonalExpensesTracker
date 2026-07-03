import Expense from "../models/expense.model.js";

export const expenseMiddleware = async (req, res, next) => {
  try {
    const expenseId = req.params.id;

    if (!expenseId) {
      return res.status(400).json({ 
        message: "Expense id is required",
        required: true,
    
    });
    }

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ 
        message: "Expense not found",
        success: false
      });
    }

    if (expense.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ 
        message: "You do not own this expense",
        success: false
      });
    }

    req.expense = expense;
    next();
  } catch (error) {
    next(error);
  }
};

export default expenseMiddleware;