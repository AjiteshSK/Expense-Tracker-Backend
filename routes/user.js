const userRouter = require("express").Router();
const userController = require("../controllers/user");

const { z, ZodString } = require("zod");

userRouter.post("/signup", async (req, res, next) => {
  try {
    const signUpRequest = z.object({
      username: z.string().min(5),
      email: z.string().email(),
      password: z.string().min(8),
    });

    const { success, issues } = signUpRequest.safeParse(req.body);

    if (!success) {
      return res
        .status(403)
        .json({ message: "Please use a valid email or username" });
    }

    await userController.signUp(req, res);
  } catch (err) {
    console.log("Error in signUp route", err);
  }
});

module.exports = userRouter;
