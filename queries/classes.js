/**
 * This file holds the code of all queries related to the Classes table.
 * 
 * @version 11/09/2022
 */

module.exports = {
    /**
     * Gets the number of classes with a given ID and act on it using a callback function. It will also
     * notify the request sender of any error. 
     * 
     * A status of 200 is given for successful requests. A status of 400 for unsuccessful ones.
     * 
     * @param {*} sql The mssql instance connected to the database currently used by the API.
     * @param {*} res The object to send result to a given query sender.
     * @param {*} classID The ID to check the number of classes for. 
     * @param {*} callback The callback function to be called on the result of the query.
     */
    getNumberOfClassesWithId: function(sql,res,classID, callback) {
        console.log("checking the nb of classes")
        const request = new sql.Request();
        request
        .input('classId', sql.Int, classID)
        .query("SELECT * FROM Classes WHERE ID = @classId", function(err, recordset) {
            if (err) {
                console.log(err);
                res.status(400).json({error:err});
                return null;
            } else {
                console.log(recordset.rowsAffected[0]);
                callback(recordset.rowsAffected[0]);
            }
        });
    }
}