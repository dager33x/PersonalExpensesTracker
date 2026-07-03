import {Router} from 'express';
import {Signin, Signout, Signup} from '../controllers/auth.controller.js';
import {validateSignup, ValidateSignIn } from '../validations/auth.validation.js';
import {arcjetMiddleware} from '../middlewares/arcjet.middleware.js';

const authRouter = Router();

authRouter.post('/sign-up', validateSignup, Signup);
authRouter.post('/sign-in', arcjetMiddleware, ValidateSignIn, Signin);
authRouter.post('/sign-out', Signout);

export default authRouter;
