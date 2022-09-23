const helper_functions = require("../helper_functions");
module.exports = {
  /**
   * Gets the details of the current week as detailed in the database.
   * We know this method is called in the context of further algorithms using the data retrieved. This function
   * therefore also takes on the responsibility to call a callback function when the results are retrieved correctly
   * to make sure dependent calculations do not run otherwise.
   *
   * @param {*} sql The mmsql instance connected to our server.
   * @param {*} res The object to return responses to the request's sender.
   * @param {*} callback The callback function.
   */
  getCurrentWeekDetails: async function (sql, callback) {
    const request = new sql.Request();

    await request.query(
      "Select WeekNumber, WeekStartDate From TimeReference",
      function (err, recordset) {
        if (err) {
          console.log(err);
          return null;
        } else {
          callback(recordset.recordset[0]);
        }
      }
    );
  },

  /**
   * Checks if a week has passed since the last recorded time reference record.
   * If yes, it will call a callback function if not, nothing major happens.
   *
   * @param {*} sql A connected mssql instance.
   * @param {*} callback The callback function.
   */
  checkIfWeekPassed: function (sql, callback) {
    const request = new sql.Request();

    request.query(
      "Select WeekStartDate From TimeReference",
      function (err, recordset) {
        if (err) {
          console.log(err);
          res.status(400).json({ error: err });
          return false;
        } else {
          if (
            helper_functions.isMoreThanAWeekAgo(
              recordset.recordset[0].WeekStartDate
            )
          ) {
            console.log("test");
            callback();
          } else {
            console.log("Week not passed.");
          }
        }
      }
    );
  },

  /**
   * Updates the TimeReference record.
   *
   * @param {*} sql A connected mssql instance.
   * @param {*} lastWeekNumber The week number of the TimeReference record to update.
   * @param {*} newWeekNumber The week number to update to.
   * @param {*} newWeekStartDate The week start date to update to.
   */
  updateTimeReference: function (
    sql,
    lastWeekNumber,
    newWeekNumber,
    newWeekStartDate
  ) {
    const request = new sql.Request();

    request
      .input("lastWeekNumber", sql.Int, lastWeekNumber)
      .input("weekNumber", sql.Int, newWeekNumber)
      .input("weekStartDate", sql.NVarChar, newWeekStartDate)
      .query(
        "UPDATE TimeReference SET WeekStartDate = @weekStartDate, WeekNumber = @weekNumber WHERE WeekNumber = @lastWeekNumber",
        function (err, recordset) {
          if (err) {
            // send email
          } else {
            console.log("Time reference updated");
          }
        }
      );
  },
};
