import {Router} from 'express';
import { ForgotPassword, ResetPassword, Signin, Signout, Signup, VerifyEmail } from '../controllers/auth.controller.js';
import { validateForgotPassword, validateResetPassword, validateSignup, ValidateSignIn } from '../validations/auth.validation.js';
import {arcjetMiddleware} from '../middlewares/arcjet.middleware.js';

const authRouter = Router();

authRouter.post('/sign-up', validateSignup, Signup);
authRouter.post('/sign-in', arcjetMiddleware, ValidateSignIn, Signin);
authRouter.post('/sign-out', Signout);
authRouter.get('/verify-email/:token', VerifyEmail);
authRouter.post('/forgot-password', validateForgotPassword, ForgotPassword);
authRouter.post('/reset-password/:token', validateResetPassword, ResetPassword);


export default authRouter;
