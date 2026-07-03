
import { body, validationResult } from "express-validator";

export const validateExpense = [

    body("title").notEmpty()
    .withMessage("Title is required"),

    body("amount").isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number"),

    body("date").isISO8601()
    .withMessage("Invalid date format"),

    body("category").notEmpty()
    .withMessage("Category is required"),

    (req, res, next) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export default validateExpense;
