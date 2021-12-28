const fs = require('fs');

const cashBalance = require('../models/cashBalance')

const getCashBalanceByUserId = async (req,res) => {
    const userId = res.locals.userId;
    try {
        let cashAmt = await cashBalance.getBalance(userId)
        res.status(200).json(cashAmt)
    } catch (error) {
        console.log(error)
        fs.appendFileSync('errorFile.txt', "\n cashBalanceController.getCashBalanceByUserId " + error.message)
        res.status(404).json([{Message: 'Error: ' + error.message}])
    }
}

// Update cash when making deposits and withdrawals 
const updateUserCash = async (req,res) => {
    const userId = res.locals.userId
    const cashAction = req.body.cashAction;
    let cashAmtUpdate = Number(req.body.cashAmtUpdate).toFixed(2);
    if (cashAction == "W") cashAmtUpdate = -cashAmtUpdate;
    try {
        let cashUser = await cashBalance.findOneAndUpdate({userId: userId},{$inc:{balance:cashAmtUpdate}}, {new: true, useFindAndModify: false});
        if (!cashUser)  {
            res.status(400).json({Message: 'No cash record found.'})
        }
        res.json(cashUser)
    } catch (error) {
        console.log(error)
        fs.appendFileSync('errorFile.txt', "\n cashBalanceController.updateUserCash " + error.message)
        res.status(404).json([{Message: 'Error: ' + error.message}])
    }
}


module.exports = {getCashBalanceByUserId, updateUserCash}
