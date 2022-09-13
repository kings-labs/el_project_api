/**
 * This file holds the code of all queries related to the courseRequests table.
 * 
 * @version 13/09/2022
 */

module.exports = {

    /**
     * Retrieves all the new course requests (status = 0)
     * 
     * @param {*} sql The mssql instance connected to the database currently used by the API.
     * @param {*} res The object to send result to a given query sender.
     */
    getNewCourseRequests: function (sql, res) {

        const request = new sql.Request();

        request
            .query('select * from CourseRequests where status = 0', function (err, recordset) {
                if (err) {
                    console.log(err);
                    res.status(400).json({
                        error: err
                    });
                } else {
                    res.status(200).json({"result":recordset.recordset});
                }
            });
    },

    /**
     * Updates the status of the new course requests to pending (= 1).
     * 
     * @param {*} sql The mssql instance connected to the database currently used by the API.
     */
    updateCourseRequests: function (sql) {

        const request = new sql.Request();

        request
            .query('update CourseRequests set status = 1 where status = 0', function (err) {
                if (err) {
                    console.log(err);
                    res.status(400).json({
                        error: err
                    });
                } else {
                    res.status(200).json({"message":"New course request(s) have been updated."});
                }
            });
    }

}