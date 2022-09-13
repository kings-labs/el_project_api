/**
 * This file holds the code of all queries related to the CancellationRequests table.
 * 
 * @version 11/09/2022
 */


module.exports = {
    /**
     * Creates a new cancellation request and indicates result and status to the user.
     * 
     * A status of 200 is given for successful requests. A status of 400 for unsuccessful ones.
     * 
     * @param {*} sql The mssql instance connected to the database currently used by the API.
     * @param {*} res The object to send result to a given query sender.
     * @param {*} classId The ID of the class to create a CancellationRequest for.
     * @param {*} reason The reason of the cancellation to specify in the Cancellation Request
     */
    createCancellationRequest: function(sql,res,classId, reason) {
        const request = new sql.Request();
        request
        .input('classId', sql.Int, classId)
        .input('reason', sql.NVarChar, reason)
        .query("insert into CancellationRequests (ClassID,Reason,Status) values (@classId,@reason,null)", function (err, recordset) {
            if (err) {
                console.log(err);
                res.status(400).json({error:err});
            } else {
                res.status(200).json({message: "Cancellation request created."})
            }
        });
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
        .input('classId', sql.Int, classID)
        .query("SELECT COUNT(ID) FROM CancellationRequests WHERE ClassID=@classId AND Status IS NULL", function (err, recordset) {
            if (err) {
                console.log(err);
                res.status(400).json({error:err});
                return null;
            } else {
                if (Object.values(recordset.recordset[0])[0] === 0) {
                    callback()
                } else {
                    res.status(400).json({error:"A request is currently opened for the same class."});
                }
            }
        });
    }
}
