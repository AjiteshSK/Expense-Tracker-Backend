import app from "./app.js";
import db from "./db/database.js";

app.listen(8080, async () => {
  const rows = await db.all("SELECT * FROM Users");
  console.log("ROWS", rows);
});
