import sqlite3 from "sqlite3";
import { open } from "sqlite";

const db = await open({
  filename: "./expense-track.db",
  driver: sqlite3.Database,
});

export default db;
// module.exports = (async () => {
//   const db = await open({
//     filename: "./expense-track.db",
//     driver: sqlite3.Database,
//   });

//   return db;
// })();
// const db = open({
//   filename: "./expense-track.db",
//   driver: sqlite3.Database,
// });

// export async function openDb() {}
// let db;

// (async () => {
//   db = await open({
//     filename: "./expense-track.db",
//     driver: sqlite3.Database,
//   });

//   module.exports = db;
// })();

// const db = new sqlite3.Database("./expense-track.db", (err) => {
//   if (err) {
//     console.log("Error in connecting to the database", err);
//   } else {
//     console.log("Successfully connected to the database!!!");

//     //#region Initialize Databases
//     db.run(
//       "CREATE TABLE IF NOT EXISTS Users (id INTEGER PRIMARY KEY, username VARCHAR(255), email VARCHAR(255), password VARCHAR(255))",
//       [],
//       (err) => {
//         if (err) {
//           console.log("Error while creating users table", err);
//         } else {
//           db.run(
//             "CREATE TABLE IF NOT EXISTS Expenses (id INTEGER PRIMARY KEY, name VARCHAR(255) NOT NULL, category VARCHAR(255) NOT NULL, value INTEGER NOT NULL, incurred_by INTEGER NOT NULL, notes VARCHAR(250), FOREIGN KEY (incurred_by) REFERENCES Users (id))",
//             [],
//             (err) => {
//               if (err) {
//                 console.log("Error while creating expenses table", err);
//               }
//             }
//           );
//         }
//       }
//     );
//     //#endregion
//   }
// });

// module.exports = db;
