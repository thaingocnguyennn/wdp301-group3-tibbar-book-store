import mongoose from 'mongoose';

const coinTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['CHECKIN', 'ORDER_DISCOUNT', 'ADMIN_ADJUST'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  balanceAfter: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
coinTransactionSchema.index({ userId: 1, createdAt: -1 });
coinTransactionSchema.index({ type: 1 });

const CoinTransaction = mongoose.model('CoinTransaction', coinTransactionSchema);

export default CoinTransaction;
