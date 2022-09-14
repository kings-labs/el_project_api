/**
 * This file holds the code of all queries related to the Classes table.
 *
 * @version 11/09/2022
 */

module.exports = {
  /**
   * Checks if a class with a given ID actually exists.
   *
   * If the test is successful, the callback function will be called.
   * If not, a specific status of 412 is returned for the bot to be able to understand the mistake.
   *
   * @param {*} sql The mssql instance connected to the database currently used by the API.
   * @param {*} res The object to send result to a given query sender.
   * @param {*} classID The ID to check the number of classes for.
   * @param {*} callback The callback function to be called if the test is successful.
   */
  checkIfClassExistsWithID: function (sql, res, classID, callback) {
    const request = new sql.Request();
    request
      .input("classId", sql.Int, classID)
      .query(
        "SELECT COUNT(ID) FROM CLASSES WHERE ID=@classId",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(400).json({ error: err });
            return null;
          } else {
            if (Object.values(recordset.recordset[0])[0] === 1) {
              callback();
            } else {
              console.log("Class does not exist or similar issue.");
              res
                .status(412)
                .json({ error: "There is not class with that ID." });
            }
          }
        }
      );
  },
};
