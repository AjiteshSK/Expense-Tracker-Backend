import express from "express";
import isAuth from "../helpers/isAuth.js";
import { z } from "zod";
import expenseController from "../controllers/expense.js";

const expenseRouter = express.Router();

expenseRouter.post("/create", isAuth, async (req, res, next) => {
  try {
    const expenseCreateRequest = z.object({
      name: z.string().min(1),
      price: z.number().gt(0),
      category: z.string().min(1),
      notes: z.string(),
    });

    const { success, issues, error } = expenseCreateRequest.safeParse(req.body);

    if (!success) {
      return res.status(400).json({ message: "Invalid request" });
    }

    await expenseController.create(req, res);
  } catch (error) {
    if (error) {
      console.log("Error /expense/create route", error);
    }
  }
});

expenseRouter.get("/all", isAuth, async (req, res, next) => {
  await expenseController.getAll(req, res);
});

expenseRouter.get("/get-by-id/:expenseId", isAuth, async (req, res, next) => {
  const expenseGetByIdRequest = z.object({ expenseId: z.string().min(5) });

  const { success, issues, error } = expenseGetByIdRequest.safeParse(
    req.params
  );

  if (!success) {
    return res.status(400).json({ message: "Invalid request" });
  }

  await expenseController.getById(req, res);
});

expenseRouter.put("/update/:expenseId", isAuth, async (req, res, next) => {
  const expenseUpdateRequest = z.object({ expenseId: z.string().min(5) });

  const { success, issues, error } = expenseUpdateRequest.safeParse(req.params);

  if (!success) {
    return res.status(400).json({ message: "Invalid request" });
  }

  await expenseController.update(req, res);
});

expenseRouter.delete("/delete/:expenseId", isAuth, async (req, res, next) => {
  await expenseController.delete(req, res);
});

export default expenseRouter;
