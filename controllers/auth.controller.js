import mongoose from "mongoose";
import bycript from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { JWT_EXPIRE, JWT_EXPIRE_IN, JWT_SECRET } from "../config/env.js";

export const Signup = async (req, res) => { 

    const session = await mongoose.startSession();
    await session.startTransaction();

    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email }).session(session);

        if (existingUser) {
           const error = new Error('User already exists');
           error.StatusCode = 400;
            throw errror;
        }

        const salt = await bycript.genSalt(10);
        const hashedPassowrd = await bycript.hash(password, salt);

        const newUser = new User({
            name: username,
            email: email,
            password: hashedPassowrd
        });

        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: JWT_EXPIRE_IN });

        await session.commitTransaction();
        await session.endSession();

        res.status(201).json({ 
            success: true,
            message: "User created successfully", token });

    }catch(error){
        await session.abortTransaction();
        await session.endSession();
        next(error);
    }
}

export default Signup;