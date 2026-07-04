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

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("name email sex avatarUrl");

    return res.status(200).json({
      success: true,
      data: {
        name: user?.name || "Profile",
        email: user?.email || "",
        sex: user?.sex || "",
        avatarUrl: user?.avatarUrl || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfileAvatar = async (req, res, next) => {
  try {
    const avatarUrl = String(req.body?.avatarUrl || "").trim();

    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        message: "Avatar URL is required.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl },
      { new: true, runValidators: true }
    ).select("name email sex avatarUrl");

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully.",
      data: {
        name: user?.name || "Profile",
        email: user?.email || "",
        sex: user?.sex || "",
        avatarUrl: user?.avatarUrl || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resetProfileAvatar = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl: null },
      { new: true, runValidators: true }
    ).select("name email sex avatarUrl");

    return res.status(200).json({
      success: true,
      message: "Profile photo reset to default.",
      data: {
        name: user?.name || "Profile",
        email: user?.email || "",
        sex: user?.sex || "",
        avatarUrl: user?.avatarUrl || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfileUploadConfig = async (req, res, next) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "";
    const folder = process.env.CLOUDINARY_FOLDER || "personal-expense-tracker";

    return res.status(200).json({
      success: true,
      data: {
        cloudName,
        uploadPreset,
        folder,
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
