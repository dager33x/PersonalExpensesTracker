import {Router} from 'express';
import {Signin, Signout, Signup} from '../controllers/auth.controller.js';
const authRouter = Router();

authRouter.post('/sign-up', Signup);
authRouter.post('/sign-in', Signin);
authRouter.post('/sign-out', Signout);

export default authRouter;
