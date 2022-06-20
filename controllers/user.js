import db from "../db/database.js";
import bcrypt from "bcrypt";
import UUID from "uuid-int";
import { v4 as uuidv4 } from "uuid";
import jsonwebtoken from "jsonwebtoken";
import token from "../helpers/token.js";

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

      if (!user) {
        return res.status(400).json({ message: "Incorrect email or password" });
      }

      const passwordsMatch = await bcrypt.compare(password, user.password);

      if (!passwordsMatch) {
        return res.status(400).json({ message: "Incorrect email or password" });
      }

      const { accessToken, refreshToken } = token.generateTokenPair(
        email,
        user.id
      );

      const tokenId = uuidv4();
      let date = new Date();
      date = date.toISOString();

      const createToken = await db.run(
        "INSERT or IGNORE INTO refresh_tokens (id, token, created_at, user) VALUES (?, ?, ?, ?)",
        [tokenId, refreshToken, date, user.id]
      );

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

      const refreshTokenInStorage = await db.get(
        "SELECT * FROM refresh_tokens WHERE token=?",
        [refreshToken]
      );

      if (!refreshTokenInStorage) {
        //signout
        const usedRefreshedToken = await db.get(
          "SELECT * FROM used_refresh_tokens WHERE token=?",
          [refreshToken]
        );

        if (usedRefreshedToken) {
          //Invalidate current refresh token (by deleting it?)

          return res.status(403).json({ message: "Nice try Mr. Hacker" });
        }

        return res.status(403).json({ message: "Invalid token" });
      }

      const isVerified = jsonwebtoken.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      if (!isVerified) {
        res.status(403).json({ message: "Invalid token" });
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        token.generateTokenPair(isVerified.email, isVerified.user_id);

      //Add to used_refresh_tokens and delete from refresh_tokens

      const tokenRotatedSuccessfully = await token.rotateToken(
        refreshTokenInStorage,
        newRefreshToken,
        isVerified
      );

      if (tokenRotatedSuccessfully) {
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
  signOut: async (req, res) => {
    const { id } = req.user;

    const deleteRefreshToken = await db.run(
      "DELETE FROM refresh_tokens WHERE user = ?",
      [id]
    );

    if (deleteRefreshToken.changes == 1) {
      return res.status(200).json({ message: "Signed out successfully" });
    }
  },
};

export default userController;
