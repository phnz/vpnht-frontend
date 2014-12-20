mongoose = require("mongoose")
txnSchema = new mongoose.Schema(
    customerId: String
    type: String
    amount: String
    data: String
)

module.exports = mongoose.model("Txn", txnSchema)
