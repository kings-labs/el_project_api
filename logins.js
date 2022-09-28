require("dotenv").config();

const dbConfig = {
  user: process.env.DBUSERNAME,
  password: process.env.DBPASSWORD,
  server: process.env.DBIP,
  database: process.env.DBNAME,
  port: 1433,
  trustServerCertificate: true,
  encrypt: false,
};

module.exports = dbConfig;
