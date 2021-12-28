const fs = require('fs');
const { now } = require('mongoose');
const {getValueForNextSequence} = require('./countersController')
const cashBalance = require('../models/cashBalance');
const Position = require('../models/position');
const Transaction = require('../models/transaction');

const getTransactionsByUserId = async (req,res) => {
    const userId = res.locals.userId
    try {
        const transactions = await Transaction.find({userId: userId})    
        if (transactions) {
            res.json(transactions)   
        } else{
            res.json({Message: `No transactions found. `})
        }
    } catch (error) {
        console.log(error)
        fs.appendFileSync('errorFile.txt', "\n transactionsController.getTransactionsByUserId " + error.message)
        res.status(404).json([{Message: 'Error: ' + error.message}])
    }
}


const addNewTrans = async (req, res) => {
    const userId = res.locals.userId
    const newTransId = await getValueForNextSequence("transId");
    const newTrans = new Transaction({
        id: newTransId,
        userId: userId,
        symbol: req.body.symbol,
        action: req.body.action,
        qty: req.body.qty,
        price: req.body.price,
        total: req.body.total,
        dt: Date(now)
    })
    try {
        const savedNewTrans = await newTrans.save()
        if (!savedNewTrans) {
            res.status(400).json({Message: 'Could not save the transaction to the DB.'})
        }

        const updateAmt = (req.body.action=='B' ? -req.body.total : req.body.total)
        const cash = await cashBalance.updateCash(userId,updateAmt);
        if (!cash) {
            res.status(400).json({Message: 'Could not update cash.'})
        }
        const position = await Position.updatePosition(userId, req.body.symbol, req.body.qty, req.body.price, req.body.action)
        if (!position) {
            res.status(400).json({Message: 'Could not update position.'})
        }
        res.status(201).json({tradeMsg: "Trade executed successfully",cashBalance:Number(cash.balance)})  // Send as number
    } catch (error) {
        console.log(error.message)
        fs.appendFileSync('errorFile.txt', "\n transactionsController.addNewTrans " + error.message)
        res.status(404).json({Error: error.message})
    }
}

module.exports = {getTransactionsByUserId, addNewTrans}
