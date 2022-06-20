//#region LibrariesImport
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
//#endregion

//#region RoutersImport
import userRouter from "./routes/user.js";
import expenseRouter from "./routes/expense.js";
//#endregion

//#region Pre-processing Middlewares
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
//#endregion

//#region Routes
app.use("/user", userRouter);
app.use("/expense", expenseRouter);
//#endregion

export default app;
