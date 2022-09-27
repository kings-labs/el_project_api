const helperFunctions = require("../helper_functions");
const timeReferenceQueries = require("../queries/time_reference_queries");

module.exports = {
  /**
   * Creates a new rescheduling request and indicates result and status to the user.
   * It calls another function in that file as some calculations to properly create a rescheduling request
   * depend on proper retrieval of time reference data and must therefore be able to be presented as a callback.
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
    timeReferenceQueries.getCurrentWeekDetails(
      sql,
      (lastRecordedWeekObject) => {
        createAReschedulingRequestWithOriginalDate(
          sql,
          res,
          classID,
          reason,
          newDate,
          lastRecordedWeekObject
        );
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
              res.status(406).json({
                error: "A request is currently opened for the same class.",
              });
            }
          }
        }
      );
  },
};

/**
 * This function actually handles the calculations and requests needed to create a rescheduling request.
 * It was created as a separate function to enable a callback construct.
 *
 * @param {*} sql The mssql instance connected to the database currently used by the API.
 * @param {*} res The object to send result to a given query sender.
 * @param {*} classID The ID of the class to create a ReschedulingRequest for.
 * @param {*} reason The reason tutor gives for rescheduling that class.
 * @param {*} newDate The date the class should be rescheduled to.
 * @param {*} lastRecordedWeek The object containing data about a pre-recorded week.
 */
function createAReschedulingRequestWithOriginalDate(
  sql,
  res,
  classID,
  reason,
  newDate,
  lastRecordedWeek
) {
  const request = new sql.Request();
  const newDay = helperFunctions.getWeekDayFromDate(newDate);
  const newWeek = helperFunctions.getWeekNumberForDate(
    newDate,
    lastRecordedWeek.WeekStartDate,
    lastRecordedWeek.WeekNumber
  );
  request
    .input("classId", sql.Int, classID)
    .input("reason", sql.NVarChar, reason)
    .input("newDay", sql.NVarChar, newDay)
    .input("newWeek", sql.Int, newWeek)
    .input("newDate", sql.NVarChar, newDate)
    .query(
      "insert into ReschedulingRequests (ClassID,Reason,NewDay,NewWeek,Date,Status) values (@classId,@reason,@newDay,@newWeek,@newDate,null)",
      function (err, recordset) {
        if (err) {
          console.log(err);
          res.status(400).json({ error: err });
        } else {
          res.status(200).json({ message: "Rescheduling request created." });
        }
      }
    );
}
