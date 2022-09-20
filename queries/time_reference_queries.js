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

  checkIfWeekPassed: async function (sql) {
    const request = new sql.Request();

    await request.query(
      "Select WeekStartDate From TimeReference",
      function (err, recordset) {
        if (err) {
          console.log(err);
          res.status(400).json({ error: err });
          return false;
        } else {
          console.log(recordset.recordset[0].WeekStartDate);
          return helper_functions.isLessMoreAWeekAgo(
            recordset.recordset[0].WeekStartDate
          );
        }
      }
    );
  },
};
