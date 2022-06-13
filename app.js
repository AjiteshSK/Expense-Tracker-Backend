//#region LibrariesImport
import express from "express";
import bodyParser from "body-parser";
//#endregion

//#region RoutersImport
import userRouter from "./routes/user.js";
//#endregion

//#region Pre-processing Middlewares
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
//#endregion

//#region Routes
app.use((req, res, next) => {
  console.log("REQ BODY", req.body);
  next();
});
app.use("/user", userRouter);
//#endregion

export default app;
