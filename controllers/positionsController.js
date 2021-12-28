const fs = require('fs');
const Position = require('../models/position')


const getPositionsByUserId = async (req,res) => { 
    const userId = res.locals.userId;
    try {
        const positions = await Position.find({userId: userId})  
        res.json(positions)  
    } catch (error) {
        console.log(error)
        fs.appendFileSync('errorFile.txt', "\n positionsController.getPositionsByUserId " + error.message)
        res.status(404).json([{Message: 'Error: ' + error.message}])
    }
}


module.exports = {getPositionsByUserId}
