import db from "../db/database.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

const userController = {
  signUp: async (req, res) => {
    try {
      const { username, email, password } = req.body;

      const existingEmail = await db.get(
        `SELECT email FROM users WHERE email = "${email}"`
      );

      if (existingEmail) {
        return res.json(409).json({ message: "This E-mail is already in use" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const id = 676;

      const ress = await db.run(
        "INSERT INTO Users (id, username, email, password) VALUES (?, ?, ?, ?)",
        [id, username, email, hashedPassword]
      );

      console.log("RESS", ress);
    } catch (err) {
      console.error("Error in signUp controller", err);
    }
  },
};

export default userController;
