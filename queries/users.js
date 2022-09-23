const jwt = require("jsonwebtoken");
var crypto = require("crypto");

require("dotenv").config();

module.exports = {
  /**
   * Allows a user to login. If the credentials used it will send the caller a token valid for a week. If not, it will
   * give a custom error satus of 401.
   * Note: THe passwords are stored hashed in the database so we hash them before checking if they are correct.
   *
   * @param {*} sql The connected mssql instance.
   * @param {*} res The object to send a response to the caller.
   * @param {*} username The inputed username.
   * @param {*} password The inputed password.
   */
  login: function (sql, res, username, password) {
    const request = new sql.Request();
    request
      .input("username", sql.NVarChar, username)
      .query(
        "SELECT Password, ID FROM Users WHERE Username = @username",
        function (err, recordset) {
          if (err) {
            res.status(404).json({ "err loging in": err });
          } else {
            const hasedInputPwd = crypto
              .createHash("sha256")
              .update(password)
              .digest("base64");
            if (recordset.recordset[0].Password === hasedInputPwd) {
              const token = jwt.sign(
                {
                  email: username,
                  userId: recordset.recordset.ID,
                },
                process.env.SKEY, //JWT key
                {
                  expiresIn: "1w",
                }
              );
              res.status(200).json({ token: token });
            } else {
              res.status(401).json({
                message: "Auth failed",
              });
            }
          }
        }
      );
  },
};
