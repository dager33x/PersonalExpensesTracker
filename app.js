import express from "express";
import dotenv from "dotenv";
import ConnectDb from "./database/mongodb.js";
import {PORT} from "./config/env.js";
import authRouter from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import expenseRouter from "./routes/expense.route.js";



dotenv.config();

ConnectDb();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/expenses", expenseRouter);

app.get("/", (req, res) => {

    res.send("Server is running");
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;