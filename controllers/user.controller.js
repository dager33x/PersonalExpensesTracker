import User from "../models/user.model.js";

const CATEGORIES = ["Food", "Transportation", "Entertainment", "Utilities", "Other"];

function normalizeWalletBalance(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeGoals(body = {}) {
  const monthlyTotal = Number(body.monthlyTotal);
  const categoriesInput = body.categories || {};

  const categories = {};
  for (const category of CATEGORIES) {
    const value = Number(categoriesInput[category]);
    if (Number.isFinite(value) && value >= 0) {
      categories[category] = value;
    }
  }

  return {
    monthlyTotal: Number.isFinite(monthlyTotal) && monthlyTotal >= 0 ? monthlyTotal : 0,
    categories,
  };
}

export const getWalletBalance = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("walletBalance");

    return res.status(200).json({
      success: true,
      data: {
        walletBalance: user?.walletBalance ?? 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateWalletBalance = async (req, res, next) => {
  try {
    const walletBalance = normalizeWalletBalance(req.body?.walletBalance);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { walletBalance },
      { new: true, runValidators: true }
    ).select("walletBalance");

    return res.status(200).json({
      success: true,
      message: "Wallet balance updated successfully",
      data: {
        walletBalance: user?.walletBalance ?? walletBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBudgetGoals = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("budgetGoals");

    return res.status(200).json({
      success: true,
      data: user?.budgetGoals || {
        monthlyTotal: 0,
        categories: {},
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateBudgetGoals = async (req, res, next) => {
  try {
    const budgetGoals = normalizeGoals(req.body);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { budgetGoals },
      { new: true, runValidators: true }
    ).select("budgetGoals");

    return res.status(200).json({
      success: true,
      message: "Budget goals updated successfully",
      data: user?.budgetGoals || budgetGoals,
    });
  } catch (error) {
    next(error);
  }
};
