import { body, validationResult } from "express-validator";
import User from "../models/user.model.js";

export const validateSignup = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required.")
        .bail()
        .isLength({ min: 2, max: 50 })
        .withMessage("Name must be between 2 and 50 characters."),

    body("email")
        .trim()
        .normalizeEmail()
        .notEmpty()
        .withMessage("Email is required.")
        .bail()
        .isEmail()
        .withMessage("Please provide a valid email.")
        .bail()
        .custom(async (email) => {
            const user = await User.findOne({ email });

            if (user) {
                throw new Error("Email already exists.");
            }

            return true;
        }),

    body("password")
        .isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        })
        .withMessage(
            "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character."
        ),

    async (req, res, next) => {
        const errors = await validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
                errors: errors.array(),
            });
        }

        next();
    },
];

export const ValidateSignIn  = [

body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required.")
        .bail()
        .isEmail()
        .withMessage("Please provide a valid email."),

    body("password")
        .notEmpty()
        .withMessage("Password is required."),

    async (req, res, next) => {
        const errors = await validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
                errors: errors.array(),
            });
        }

        next();
    },
];

export const validateForgotPassword = [
    body("email")
        .trim()
        .normalizeEmail()
        .notEmpty()
        .withMessage("Email is required.")
        .bail()
        .isEmail()
        .withMessage("Please provide a valid email."),

    async (req, res, next) => {
        const errors = await validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
                errors: errors.array(),
            });
        }

        next();
    },
];

export const validateResetPassword = [
    body("password")
        .isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        })
        .withMessage(
            "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character."
        ),

    body("sex")
        .trim()
        .notEmpty()
        .withMessage("Sex is required.")
        .bail()
        .isIn(["male", "female"])
        .withMessage("Sex must be male or female."),

    async (req, res, next) => {
        const errors = await validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
                errors: errors.array(),
            });
        }

        next();
    },
];
