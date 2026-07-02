import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { JWT_EXPIRE_IN, JWT_SECRET } from "../config/env.js";

export const Signup = async (req, res, next) => { 

    const session = await mongoose.startSession();
    await session.startTransaction();

    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email }).session(session);

        if (existingUser) {
           const error = new Error('User already exists');
           error.statusCode = 400;
            throw error;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name: name,
            email: email,
            password: hashedPassword
        });

        await newUser.save({ session });

        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: JWT_EXPIRE_IN });

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            maxAge: 24 * 60 * 60 * 1000
        });

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


export const Signin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if(!user) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRE_IN });

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(200).json({ 
            success: true,
            message: "User signed in successfully", token });

    }catch(error){
        next(error);
    }

}

export const Signout = async (req, res, next) => {
    try {
        
        
        res.clearCookie('token');
        res.status(200).json({
            success: true,
            message: "User signed out successfully"
        });

    }catch(error){
        next(error);
    }       
        };
