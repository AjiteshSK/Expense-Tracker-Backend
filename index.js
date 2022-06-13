const app = require("./app");
const db = require("./db/database");

app.listen(8080, () => {
  console.log("Server listening on port 8080");
});
