const fs = require('fs');
const Counter = require('../models/counter')

const getValueForNextSequence = async (sequenceName) =>{
    try {
        var sequenceDoc = await Counter.findOneAndUpdate({_id: sequenceName },{$inc:{seq_value:1}}, {new: true, useFindAndModify: false});
        return sequenceDoc.seq_value;
    } catch (error) {
        console.log("Error in getValueForNextSequence for ", sequenceName);
        console.log(error);
        fs.appendFileSync('errorFile.txt', "\n countersController.getValueForNextSequence " + error.message)
    }
}

module.exports = { getValueForNextSequence }
