const db = require("../db/database");

module.exports = {
  signUp: async (req, res) => {
    try {
      const { username, email, password } = req.body;

      //#region Create users table if it doesn't exist

      //#region

      //#region Check for existing email
      const result = db.run(`SELECT email FROM users WHERE email = "${email}"`);
      console.log("RESULT", result);
      //#endregion
    } catch (err) {
      console.error("Error in signUp controller", err);
    }
  },
};
