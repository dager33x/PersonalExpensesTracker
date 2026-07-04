import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendMail } from "../utils/mailer.js";
import { buildResetPasswordEmail, buildVerificationEmail } from "../utils/emailTemplates.js";
import { generateToken, hashToken } from "../utils/tokens.js";
import User from "../models/user.model.js";
import { APP_URL, FRONTEND_URL, JWT_EXPIRE_IN, JWT_SECRET, PORT } from "../config/env.js";

function getAppBaseUrl(req) {
    const requestBaseUrl = req?.protocol && req?.get("host")
        ? `${req.protocol}://${req.get("host")}`
        : null;

    return APP_URL || requestBaseUrl || FRONTEND_URL || `http://localhost:${PORT || 5500}`;
}

async function clearResetTokens(user) {
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
}

export const Signup = async (req, res, next) => { 
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { name, email, password, sex } = req.body;
        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedSex = String(sex || "").trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail }).session(session);

        if (existingUser) {
           const error = new Error('User already exists');
           error.statusCode = 400;
            throw error;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const verificationToken = generateToken();
        const verificationTokenHash = hashToken(verificationToken);
        const verificationUrl = `${getAppBaseUrl(req)}/api/auth/verify-email/${verificationToken}`;

        const newUser = new User({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            sex: normalizedSex,
            emailVerified: false,
            emailVerificationToken: verificationTokenHash,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        await newUser.save({ session });

        await sendMail({
            to: newUser.email,
            subject: "Verify your Personal Expense Tracker account",
            ...buildVerificationEmail({
                name: newUser.name,
                verificationUrl,
            }),
        });

        await session.commitTransaction();

        res.status(201).json({ 
            success: true,
            message: "Account created. Check your email to verify your account.",
        });
    } catch(error){
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
}

export const Signin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email).trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before signing in."
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
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
            message: "User signed in successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        next(error);
    }
};

export const VerifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        const verificationTokenHash = hashToken(token);

        const user = await User.findOne({
            emailVerificationToken: verificationTokenHash,
            emailVerificationExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.redirect("/login?verified=0");
        }

        user.emailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();

        return res.redirect("/login?verified=1");
    } catch (error) {
        next(error);
    }
};

export const ForgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If that email exists, a reset link has been sent.",
            });
        }

        const resetToken = generateToken();
        const resetTokenHash = hashToken(resetToken);
        user.passwordResetToken = resetTokenHash;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        const resetUrl = `${getAppBaseUrl(req)}/reset-password?token=${resetToken}`;

        try {
            await sendMail({
                to: user.email,
                subject: "Reset your Personal Expense Tracker password",
                ...buildResetPasswordEmail({
                    name: user.name,
                    resetUrl,
                }),
            });
        } catch (mailError) {
            await clearResetTokens(user);
            throw mailError;
        }

        return res.status(200).json({
            success: true,
            message: "If that email exists, a reset link has been sent.",
        });
    } catch (error) {
        next(error);
    }
};

export const ResetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const passwordResetToken = hashToken(token);

        const user = await User.findOne({
            passwordResetToken,
            passwordResetExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Reset token is invalid or has expired.",
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully. You can now sign in.",
        });
    } catch (error) {
        next(error);
    }
};

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

        
