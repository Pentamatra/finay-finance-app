const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: [true, 'İşlem tipi zorunludur'],
    enum: ['income', 'expense', 'transfer']
  },
  amount: {
    type: Number,
    required: [true, 'İşlem tutarı zorunludur'],
    min: [0, 'İşlem tutarı negatif olamaz']
  },
  category: {
    type: String,
    required: [true, 'Kategori zorunludur'],
    enum: ['Yiyecek', 'Konaklama', 'Ulaşım', 'Eğlence', 'Faturalar', 'Alışveriş', 'Sağlık', 'Eğitim', 'Yatırım', 'Maaş', 'Diğer']
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Nakit', 'Kredi Kartı', 'Banka Kartı', 'Havale/EFT', 'Diğer'],
    default: 'Diğer'
  },
  status: {
    type: String,
    enum: ['Tamamlandı', 'Beklemede', 'İptal Edildi'],
    default: 'Tamamlandı'
  },
  currency: {
    type: String,
    default: 'TRY'
  },
  tags: [{
    type: String,
    trim: true
  }],
  location: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});


transactionSchema.pre('save', async function(next) {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(this.user);
    
    if (!user) {
      return next(new Error('Kullanıcı bulunamadı'));
    }
    
    
    if (this.isNew) {
      if (this.type === 'income') {
        user.balance += this.amount;
      } else if (this.type === 'expense') {
        user.balance -= this.amount;
      }
    } 
    
    else if (this.isModified('amount') || this.isModified('type')) {
      
      const Transaction = mongoose.model('Transaction');
      const oldTransaction = await Transaction.findById(this._id);
      
      
      if (oldTransaction) {
        if (oldTransaction.type === 'income') {
          user.balance -= oldTransaction.amount;
        } else if (oldTransaction.type === 'expense') {
          user.balance += oldTransaction.amount;
        }
      }
      
      
      if (this.type === 'income') {
        user.balance += this.amount;
      } else if (this.type === 'expense') {
        user.balance -= this.amount;
      }
    }
    
    await user.save();
    next();
  } catch (error) {
    next(error);
  }
});


transactionSchema.pre('remove', async function(next) {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(this.user);
    
    if (!user) {
      return next(new Error('Kullanıcı bulunamadı'));
    }
    
    if (this.type === 'income') {
      user.balance -= this.amount;
    } else if (this.type === 'expense') {
      user.balance += this.amount;
    }
    
    await user.save();
    next();
  } catch (error) {
    next(error);
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
