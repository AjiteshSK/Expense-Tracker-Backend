import db from "../db/database.js";
import jwt from "jsonwebtoken";

/* 
    - Check incoming request for access-token
        - if(noAccessToken) return
    - Verify accessToken
        - if(notVerified) return
    - next()

*/

const isAuth = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers["authorization"];
    const accessToken =
      authorizationHeader && authorizationHeader.split(" ")[1];
    console.log("accessToken in iaAuth", accessToken);
    if (!accessToken) {
      return res
        .status(400)
        .json({ message: "Authorization token not detected" });
    }

    jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET,
      async (err, user) => {
        if (err) {
          console.log("jwt verify error", err);
          return res.status(403).json({ message: "Couldn't verify token" });
        }
        console.log("USER", user);
        const userData = await db.get("SELECT * FROM Users WHERE id=?", [
          user.user_id,
        ]);
        console.log("USER_DATE", userData);
        req.user = userData;
        next();
      }
    );
  } catch (error) {
    console.log("Error in helper/isAuth", error);
  }
};

export default isAuth;
