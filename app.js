//#region LibrariesImport
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
//#endregion

//#region RoutersImport
import userRouter from "./routes/user.js";
//#endregion

//#region Pre-processing Middlewares
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
//#endregion

//#region Routes
app.use((req, res, next) => {
  console.log("REQ BODY", req.body);
  console.log("REQ COOKIES", req.cookies);
  next();
});
app.use("/user", userRouter);
//#endregion

export default app;
