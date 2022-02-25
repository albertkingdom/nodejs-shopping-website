var mysql = require("mysql2");

require("dotenv").config();

// mysql2 setting
var db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("db connected!");
});

module.exports = db;
