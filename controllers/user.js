import db from "../db/database.js";

const userController = {
  signUp: async (req, res) => {
    try {
      const { username, email, password } = req.body;

      //#region Check for existing email
      const result = db.get(
        `SELECT email FROM users WHERE email = "${email}"`,
        [],
        (err, rows) => {
          if (err) {
            console.log("Error in db.GET", err);
          }
          if (rows) {
            console.log("ROWS", rows);
          }
        }
      );
      console.log("RESULT", result);
      //#endregion
    } catch (err) {
      console.error("Error in signUp controller", err);
    }
  },
};

export default userController;
