import db from "../db/database.js";
import bcrypt from "bcrypt";
import UUID from "uuid-int";
import crypto from "crypto";

const userController = {
  signUp: async (req, res) => {
    try {
      const { username, email, password } = req.body;

      const existingEmail = await db.get(
        `SELECT email FROM users WHERE email = "${email}"`
      );

      if (existingEmail) {
        return res
          .status(409)
          .json({ message: "This E-mail is already in use" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const generator = UUID(230, 10);
      const id = generator.uuid();

      const ress = await db.run(
        "INSERT INTO Users (id, username, email, password) VALUES (?, ?, ?, ?)",
        [id, username, email, hashedPassword]
      );

      if (ress.changes == 1) {
        console.log("RESS", ress);
        return res
          .status(201)
          .json({ id: id, message: "Signed up successfully" });
      }
    } catch (err) {
      console.error("Error in signUp controller", err);
    }
  },
};

export default userController;
