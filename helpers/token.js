import db from "../db/database.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jsonwebtoken from "jsonwebtoken";

const tokenHelper = {
  generateTokenPair: (email, userId) => {
    const accessToken = jsonwebtoken.sign(
      {
        email: email,
        user_id: userId,
        iat: Math.floor(Date.now() / 1000) - 30,
      },
      process.env.ACCESS_TOKEN_SECRET.toString(),
      { expiresIn: "15m" }
    );

    const refreshToken = jsonwebtoken.sign(
      {
        email: email,
        user_id: userId,
        randomize: Math.random(),
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "2h" }
    );

    return { accessToken, refreshToken };
  },
  rotateToken: async (refreshTokenInStorage, newRefreshToken, isVerified) => {
    try {
      console.log("storageToken", refreshTokenInStorage);
      const usedTokenId = uuidv4();

      let date = new Date();
      date = date.toISOString();

      await db.run(
        "INSERT INTO used_refresh_tokens (id, token, created_at, refresh_token) VALUES(?,?,?,?)",
        [
          usedTokenId,
          refreshTokenInStorage.token,
          date,
          refreshTokenInStorage.id,
        ]
      );

      await db.run("DELETE FROM refresh_tokens WHERE token = ?", [
        refreshTokenInStorage.token,
      ]);

      const tokenId = uuidv4();

      date = new Date();
      date = date.toISOString();

      const createToken = await db.run(
        //The whole thing should be a utility function
        "INSERT INTO refresh_tokens (id, token, Created_at, user) VALUES (?, ?, ?, ?)",
        [tokenId, newRefreshToken, date, isVerified.user_id]
      );

      if (createToken.changes == 1) {
        return true;
      }

      return false;
    } catch (error) {
      if (error) {
        console.log("Error in helpers/token.generateTokenPair", error);
      }
    }
  },
};

export default tokenHelper;
