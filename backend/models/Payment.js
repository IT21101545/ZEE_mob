const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order:         { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  amount:        { type: Number, required: true },
  method:        { type: String, enum: ['CreditCard', 'DebitCard', 'Cash', 'BankTransfer'], required: true },
  status:        { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Pending' },
  transactionId: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
