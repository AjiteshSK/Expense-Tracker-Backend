import db from "../db/database.js";
import { v4 as uuidv4 } from "uuid";

const expenseController = {
  create: async (req, res) => {
    try {
      const { name, category, notes, price } = req.body;
      const { id } = req.user;

      const expenseId = uuidv4();
      const createdExpense = await db.run(
        "INSERT INTO Expenses (id, name, category, incurred_by, price) VALUES (?, ?, ?, ?, ?)",
        [expenseId, name, category, id, price]
      );

      console.log("createdExpense", createdExpense);

      if (createdExpense.changes == 1) {
        const expense = await db.get("SELECT * FROM Expenses WHERE id=?", [
          expenseId,
        ]);
        const { category, id, name, notes } = expense;
        const responseExpense = { category, id, name, notes };
        return res.status(201).json(responseExpense);
      } else {
        return res.status(500).json({ message: "Could not create expense" });
      }
    } catch (error) {
      console.log("Error in expense create controller", error);
    }
  },
  getAll: async (req, res) => {
    try {
      const { id } = req.user;

      const expenses = await db.all(
        "SELECT * FROM Expenses WHERE incurred_by=?",
        [id]
      );
      console.log("EXPENSES", expenses);
      if (!expenses) {
        return res.status(500).json({ message: "Unable to fetch expenses" });
      }

      return res.status(200).json(expenses);
    } catch (error) {
      if (error) {
        console.log("Error in expense getAll controller", error);
      }
    }
  },
  getById: async (req, res) => {
    try {
      const { expenseId } = req.params;

      const expense = await db.get("SELECT * FROM Expenses WHERE id=?", [
        expenseId,
      ]);

      if (!expense) {
        return res.status(500).json({ message: "Unable to fetch expense" });
      }

      return res.status(200).json(expense);
    } catch (error) {
      if (error) {
        console.log("Error in expense getById controller", error);
      }
    }
  },
  update: async (req, res) => {
    try {
      const { expenseId } = req.params;
      console.log("REQBODY", req.body);
      let expenseToUpdate = await db.get("SELECT * FROM Expenses WHERE id=?", [
        expenseId,
      ]);

      if (!expenseToUpdate) {
        return res.status(500).json({ message: "Could not update expense" });
      }

      for (const value in req.body) {
        expenseToUpdate[`${value}`] = req.body[`${value}`];
      }

      const { name, category, notes, price, id } = expenseToUpdate;

      const updatedExpense = await db.run(
        "UPDATE Expenses SET name = $name, category = $category, notes = $notes, price = $price WHERE id = $id",
        {
          $name: name,
          $category: category,
          $notes: notes,
          $price: price,
          $id: id,
        }
      );

      if (updatedExpense.changes == 1) {
        const expense = await db.get("SELECT * FROM Expenses WHERE id = ?", [
          expenseId,
        ]);

        return res.status(200).json(expense);
      } else {
        return res.status(500).json({ message: "Unable to update expense" });
      }
    } catch (error) {
      if (error) {
        console.log("Error in expense update controller", error);
      }
    }
  },
  delete: async (req, res) => {
    const { expenseId } = req.params;

    const deletedExpense = await db.run("DELETE FROM Expenses WHERE id=?", [
      expenseId,
    ]);
    console.log("deletedExpense", deletedExpense);
    if (deletedExpense.changes == 1) {
      return res.status(200).json({ message: "Expense deleted successfully" });
    } else {
      return res.status(500).json({ message: "Unable to delete expense" });
    }
  },
};

export default expenseController;
