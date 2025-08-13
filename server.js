require("dotenv").config();
const app = require("./app");
const mongoose = require("mongoose");

console.log("EMAIL:", process.env.EMAIL);
console.log("EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD);

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
