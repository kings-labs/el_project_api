const helperFunctions = require("../helper_functions");

module.exports = {
  /**
   * Creates a new rescheduling request and indicates result and status to the user.
   *
   * A status of 200 is given for successful requests. A status of 400 for unsuccessful ones.
   *
   * @param {*} sql The mssql instance connected to the database currently used by the API.
   * @param {*} res The object to send result to a given query sender.
   * @param {*} classID The ID of the class to create a ReschedulingRequest for.
   * @param {*} reason The reason tutor gives for rescheduling that class.
   * @param {*} newDate The date the class should be rescheduled to.
   */
  createReschedulingRequest: function (sql, res, classID, reason, newDate) {
    const request = new sql.Request();

    const [day, month, year] = newDate.split("/");
    const date = new Date(+year, month - 1, +day);
    const newDay =
      helperFunctions.getWeekDayFromDayNumberWithWeekStartsSaturday(
        date.getDay()
      );
    const newWeek = helperFunctions.getWeekNumberForDate(newDate);
    request
      .input("classId", sql.Int, classID)
      .input("reason", sql.NVarChar, reason)
      .input("newDay", sql.NVarChar, newDay)
      .input("newWeek", sql.NVarChar, newWeek)
      .input("newDate", sql.NVarChar, newDate)
      .query(
        "insert into ReschedulingRequests (ClassID,Reason,NewDay,NewWeek,Date,Status) values (@classId,@reason,@newDay,@newWeek,@newDate,null)",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(400).json({ error: err });
          } else {
            res.status(200).json({ message: "Cancellation request created." });
          }
        }
      );
  },

  /**
   * Checks if there are no currently pending rescheduling requests for the same class.
   * A currently pending rescheduling request is a request that has not yet been either approved or disapproved and therefore that has status null.
   *
   * If the test is successful, the callback function will be called.
   *
   * @param {*} sql The mssql instance connected to the database currently used by the API.
   * @param {*} res The object to send result to a given query sender.
   * @param {*} classID The ID of the class to create a ReschedulingRequest for.
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
