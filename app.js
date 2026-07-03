import express from "express";
import dotenv from "dotenv";
import ConnectDb from "./database/mongodb.js";
import {PORT} from "./config/env.js";
import authRouter from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import expenseRouter from "./routes/expense.route.js";
import aiRouter from "./routes/ai.route.js";
import userRouter from "./routes/user.route.js";
import cors from "cors";
import path from "path";
import pageAuthMiddleware from "./middlewares/pageAuth.middleware.js";


dotenv.config();

ConnectDb();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
})); 
app.use(express.static(path.join(process.cwd(), "views", "login")));
app.use("/signup", express.static(path.join(process.cwd(), "views", "signup")));
app.use("/dashboard", express.static(path.join(process.cwd(), "views", "dashboard")));

app.use("/api/auth", authRouter);
app.use("/api/expenses", expenseRouter);
app.use("/api/ai", aiRouter);
app.use("/api/user", userRouter);

app.get("/", (req, res) => {
    if (req.cookies?.token) {
        return res.redirect("/dashboard");
    }

    res.redirect("/login");
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(process.cwd(), "views","login","login.html"));
});

app.get("/signup", (req, res) => {
    res.sendFile(path.join(process.cwd(), "views","signup","sign-up.html"));
});

app.get("/dashboard", pageAuthMiddleware, (req, res) => {
    res.sendFile(path.join(process.cwd(), "views", "dashboard", "dashboard.html"));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
