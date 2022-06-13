//#region LibrariesImport
const app = require("express")();
const bodyParser = require("body-parser");
//#endregion

//#region RoutersImport
const userRouter = require("./routes/user");
//#endregion

//#region Pre-processing Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
//#endregion

//#region Routes
app.use((req, res, next) => {
  console.log("REQ BODY", req.body);
  next();
});
app.use("/user", userRouter);
//#endregion

module.exports = app;
