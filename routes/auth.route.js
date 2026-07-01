import {Router} from 'express';
import {Signup} from '../controllers/auth.controller.js';
const authRouter = Router();

authRouter.post('/sign-up', Signup);
authRouter.post('/sign-in', (req, res) => {
    res.send('Sign In route');
});

export default authRouter;