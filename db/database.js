const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./expense-track.db", (err) => {
  if (err) {
    console.log("Error in connecting to the database", err);
  } else {
    console.log("Successfully connected to the database!!!");
  }
});

module.exports = db;
