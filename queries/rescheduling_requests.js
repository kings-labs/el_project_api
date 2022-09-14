module.exports = {
  createReschedulingRequest: function (sql, res, classID, reason, newDate) {
    const request = new sql.Request();

    const [day, month, year] = newDate.split("/");
    const date = new Date(+year, month - 1, +day);
    const weekday = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const newDay = date.getDay();
    console.log("day: " + weekday[newDay]);
    request
      .input("classId", sql.Int, classID)
      .input("reason", sql.NVarChar, reason);
  },

  /**
   * Checks if there are no currently pending cancellation requests for the same class.
   * A currently pending cancellation request is a request that has not yet been either approved or disapproved and therefore that has status null.
   *
   * If the test is successful, the callback function will be called.
   *
   * @param {*} sql The mssql instance connected to the database currently used by the API.
   * @param {*} res The object to send result to a given query sender.
   * @param {*} classID The ID of the class to create a CancellationRequest for.
   * @param {*} callback The callback function to be called if the test is successful.
   */
  checkIfNoPendingRequestForSameClass: function (sql, res, classID, callback) {
    const request = new sql.Request();
    request
      .input("classId", sql.Int, classID)
      .query(
        "SELECT COUNT(ID) FROM ReschedulingRequests WHERE ClassID=@classId AND Status IS NULL",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(400).json({ error: err });
            return null;
          } else {
            if (Object.values(recordset.recordset[0])[0] === 0) {
              callback();
            } else {
              res.status(400).json({
                error: "A request is currently opened for the same class.",
              });
            }
          }
        }
      );
  },
};
