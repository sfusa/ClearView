const mongoose = require('mongoose')

const positionSchema = new mongoose.Schema({
    userId: {
        type: Number,
        required: true
    },
    symbol: {
        type: String,
        required: true,
        trim: true
    },
    qty: {
        type: Number,
        required: true
    },
    costBasis: {
        type: Number,
        required: true
    }
})

// static method to update position after trade
positionSchema.statics.updatePosition = async function(userId, symbol, changeQty, price, action){
    changeQty = Number(changeQty)
    price=Number(price)
    position = await this.findOne({userId, symbol})
    if (position) {
        if (action=='S') {  // Selling
            if (changeQty==position.qty) {
                const delPos = await position.deleteOne();
                return delPos;
            }
            console.log(changeQty)
            const newQtySell = position.qty - changeQty;
            const newCostBasisSell = Number(-(changeQty/position.qty)*position.costBasis).toFixed(2);
            console.log(newCostBasisSell)
            position = await this.findOneAndUpdate({userId, symbol},{$set:{qty:newQtySell},$inc:{costBasis:newCostBasisSell}}, {new: true, useFindAndModify: false});
        } else {  // Buying
            const newQtyBuy = position.qty + changeQty;
            const newCostBasisBuy = Number(price * changeQty).toFixed(2);
            position = await this.findOneAndUpdate({userId, symbol},{$set:{qty:newQtyBuy},$inc:{costBasis:newCostBasisBuy}}, {new: true, useFindAndModify: false});
        }
        console.log('Updated Position')
        return position;
    }
    else {  // Add new position
        const newCostBasis = price*changeQty;
        console.log(userId, symbol, changeQty, newCostBasis);
        const newPos = new this({userId,symbol, qty:changeQty, costBasis:newCostBasis});
        const result = await newPos.save();
        return result;
    }
}

module.exports = mongoose.model('Position', positionSchema)
