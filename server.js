require("dotenv").config();
const app = require("./app");
const mongoose = require("mongoose");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB).then(() => {
  console.log(`✅ DB connection successful`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ server running at port ${port}`);
});
