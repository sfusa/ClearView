const mongoose = require('mongoose')

const cashBalanceSchema = new mongoose.Schema({
    userId: {
        type: Number,
        required: true
    },
    balance: {
        type: Number,
        required: true,
    }
},
{collection: 'cash'}, 
{timestamps: true}
)


// static method to return balance
cashBalanceSchema.statics.getBalance = async function(userId){
    const cash = await this.findOne({userId});
    if (cash) {
        return Number(cash.balance).toFixed(2);  // very important to use toFixed(2) here
    }        
    throw Error('Error: Could not find user cash.');
}


// static method to change cash amount after trade or for upgrade
cashBalanceSchema.statics.updateCash = async function(userId, newAmt){
    newAmt = Number(newAmt);
    const cash = await this.findOneAndUpdate({userId},{$inc:{balance: newAmt}}, {new: true, useFindAndModify: false});
    if (cash) {
        console.log('Updated Cash')
        return cash;
    }
    throw Error('Error: Could not update user cash.');
}



module.exports = mongoose.model('cashBalance', cashBalanceSchema)
