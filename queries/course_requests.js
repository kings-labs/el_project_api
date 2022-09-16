/**
 * This file holds the code of all queries related to the courseRequests table.
 * 
 * @version 13/09/2022
 */

const helperFunctions = require("../helper_functions.js");

module.exports = {

    /**
     * Retrieves all the new course requests and update their status to 1 (= pending) if the retrieval is successful.
     * 
     * @param {*} sql The mssql instance connected to the database currently used by the API.
     * @param {*} res The object to send result to a given query sender.
     */
    getNewCourseRequests: function (sql, res) {

        const request = new sql.Request();

        request
            .query('SELECT Subject, Frequency, Levels.Name AS LevelName, Levels.CostPerHour*CourseRequests.Duration AS Money, Duration, Day, Time FROM CourseRequests JOIN DateOptions ON CourseRequests.ID = DateOptions.CourseRequestID JOIN Levels ON CourseRequests.LevelID = Levels.ID where Status = 0', function (err, recordset) {
                if (err) {
                    console.log(err);
                    res.status(400).json({
                        error: err
                    });
                } else {

                    res.status(200).json({
                        "result": helperFunctions.arrangeResult(recordset.recordset)
                    });

                    updateCourseRequests(sql);
                }
            });
    },

    /**
     * Get the total number of course requests in the database.
     *
     * A status of 200 is given for successful requests. A status of 400 for unsuccessful ones.
     *
     * @param {*} sql The mssql instance connected to the database currently used by the API.
     * @param {*} res The object to send result to a given query sender.
     */
    getNumberOfCourseRequests: function (sql, res) {
        const request = new sql.Request();

        request.query(
            "SELECT COUNT(ID) FROM CourseRequests WHERE Status=0",
            function (err, recordset) {
                if (err) {
                    res.status(400).json({
                        error: err
                    });
                }

                res
                    .status(200)
                    .json({
                        number: Object.values(recordset.recordset[0])[0]
                    });
            }
        );
    },

}

/**
 * Updates the status of the new course requests to pending (= 1).
 * 
 * @param {*} sql The mssql instance connected to the database currently used by the API.
 */
function updateCourseRequests(sql) {

    const request = new sql.Request();

    request
        .query('update CourseRequests set status = 1 where status = 0', function (err) {
            if (err) {
                console.log(err);
                res.status(400).json({
                    error: err
                });
            } else {
                res.status(200).json({
                    "message": "New course request(s) have been updated."
                });
            }
        });
}