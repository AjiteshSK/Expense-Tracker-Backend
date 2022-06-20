import db from "../db/database.js";
import { v4 as uuidv4 } from "uuid";

const expenseController = {
  create: async (req, res) => {
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
  },
};

export default expenseController;
