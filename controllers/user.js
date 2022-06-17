import db from "../db/database.js";
import bcrypt from "bcrypt";
import UUID from "uuid-int";
import { v4 as uuidv4 } from "uuid";
import jsonwebtoken from "jsonwebtoken";

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
        return res
          .status(201)
          .json({ id: id, message: "Signed up successfully" });
      } else {
        return res
          .status(500)
          .json({ message: "Could not update our databases" });
      }
    } catch (err) {
      console.error("Error in signUp controller", err);
    }
  },
  signIn: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await db.get("SELECT * FROM Users WHERE email = ?", email);

      console.log("USER", user);

      if (!user) {
        return res.status(400).json({ message: "Incorrect email or password" });
      }

      const passwordsMatch = await bcrypt.compare(password, user.password);

      if (!passwordsMatch) {
        return res.status(400).json({ message: "Incorrect email or password" });
      }

      const accessToken = jsonwebtoken.sign(
        {
          email: email,
          user_id: user.id,
          iat: Math.floor(Date.now() / 1000) - 30,
        },
        process.env.ACCESS_TOKEN_SECRET.toString(),
        { expiresIn: "15m" }
      );

      const refreshToken = jsonwebtoken.sign(
        {
          email: email,
          user_id: user.id,
          iat: Math.floor(Date.now() / 1000) - 30,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "2h" }
      );

      const tokenId = uuidv4();
      console.log("tokenID", tokenId);
      let date = new Date();
      date = date.toISOString();

      const createToken = await db.run(
        "INSERT or IGNORE INTO Refresh_Tokens (id, token, Created_at, user) VALUES (?, ?, ?, ?)",
        [tokenId, refreshToken, date, user.id]
      );

      console.log("CreateToken", createToken);

      if (createToken.changes == 1) {
        res.cookie("refresh-token", refreshToken.toString(), {
          httpOnly: true,
          //expires
        });

        return res.status(200).json({
          access_token: accessToken,
          message: "Signed in successfully",
        });
      } else {
        return res.status(500).json({ message: "Database error" });
      }
    } catch (error) {
      if (error) {
        console.log("Error in signIn controller", error);
      }
    }
  },
  generateNewToken: async (req, res) => {
    try {
      const refreshToken = req.cookies["refresh-token"];
      console.log("TOKEN TO BE DELETED", refreshToken);
      const refreshTokenInStorage = await db.get(
        "SELECT * FROM Refresh_Tokens WHERE token=?",
        [refreshToken]
      );

      if (!refreshTokenInStorage) {
        //signout
        res.status(403).json({ message: "Invalid token" });
      }

      //Check for expired token. Create new table for expired tokens

      const isVerified = jsonwebtoken.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      if (!isVerified) {
        res.status(403).json({ message: "Invalid token" });
      }

      const newAccessToken = jsonwebtoken.sign(
        {
          email: isVerified.email,
          user_id: isVerified.user_id,
        },
        process.env.ACCESS_TOKEN_SECRET.toString(),
        { expiresIn: "15m" }
      );

      const newRefreshToken = jsonwebtoken.sign(
        {
          email: isVerified.email,
          user_id: isVerified.user_id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "2h" }
      );

      console.log("TOKEN TO BE ADDED", newRefreshToken);
      await db.run("DELETE FROM Refresh_Tokens WHERE token = ?", [
        refreshToken,
      ]);

      const tokenId = uuidv4();

      let date = new Date();
      date = date.toISOString();

      const createToken = await db.run(
        //The whole thing should be a utility function
        "INSERT INTO Refresh_Tokens (id, token, Created_at, user) VALUES (?, ?, ?, ?)",
        [tokenId, newRefreshToken, date, isVerified.user_id]
      );

      if (createToken.changes == 1) {
        res.cookie("refresh-token", newRefreshToken.toString(), {
          httpOnly: true,
          //expires
        });

        return res.status(200).json({
          access_token: newAccessToken,
          message: "Signed in successfully",
        });
      }
    } catch (error) {
      if (error) {
        console.log("Error in generateNewToken controller", error);
      }
    }
  },
};

export default userController;
