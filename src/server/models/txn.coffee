mongoose = require("mongoose")
txnSchema = new mongoose.Schema(
    customerId: String
    plan: String
    status: String
    billingType: String
    data: String
)

module.exports = mongoose.model("Txn", txnSchema)
