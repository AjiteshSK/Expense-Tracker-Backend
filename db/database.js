import sqlite3 from "sqlite3";
import { open } from "sqlite";

const db = await open({
  filename: "./expense-track.db",
  driver: sqlite3.Database,
});

export default db;
