const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/transactionModel');
const jwt = require('jsonwebtoken');


const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Giriş yapılmadı, token bulunamadı' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'finaysecret123');
    
    
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Geçersiz token' });
    }
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};


router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, amount, category, description, paymentMethod, tags, location } = req.body;
    
    const transaction = await Transaction.create({
      user: req.userId,
      type,
      amount,
      category,
      description,
      paymentMethod,
      tags,
      location
    });
    
    res.status(201).json({
      success: true,
      data: transaction,
      message: 'İşlem başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Transaction create error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});


router.get('/', authMiddleware, async (req, res) => {
  try {
    
    const { startDate, endDate, type, category, minAmount, maxAmount, sortBy, limit = 20, page = 1 } = req.query;
    
    
    const query = { user: req.userId };
    
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    
    if (type) query.type = type;
    
    
    if (category) query.category = category;
    
    
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }
    
    
    const sortOptions = {};
    
    if (sortBy) {
      
      const [field, direction] = sortBy.split('_');
      sortOptions[field] = direction === 'desc' ? -1 : 1;
    } else {
      
      sortOptions.date = -1;
    }
    
    
    const skip = (Number(page) - 1) * Number(limit);
    
    
    const transactions = await Transaction.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));
    
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      success: true,
      count: transactions.length,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: transactions
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});


router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'İşlem bulunamadı'
      });
    }
    
    
    if (transaction.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu işleme erişim izniniz yok'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Transaction fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'İşlem bulunamadı'
      });
    }
    
    
    if (transaction.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi güncelleme izniniz yok'
      });
    }
    
    
    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: transaction,
      message: 'İşlem başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Transaction update error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});


router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'İşlem bulunamadı'
      });
    }
    
    
    if (transaction.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi silme izniniz yok'
      });
    }
    
    await transaction.remove();
    
    res.json({
      success: true,
      message: 'İşlem başarıyla silindi'
    });
  } catch (error) {
    console.error('Transaction delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});


router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    
    const { startDate: startDateParam, endDate: endDateParam, period = 'month' } = req.query;
    
    let startDate;
    let endDate = new Date();
    
    
    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else {
      
      const now = new Date();
      
      if (period === 'week') {
        
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
      } else if (period === 'year') {
        
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
      } else if (period === 'all') {
        
        startDate = new Date(0);
      } else {
        
        return res.status(400).json({
          success: false,
          message: 'Geçersiz period değeri. week, month, year veya all olmalıdır.'
        });
      }
    }
    
    console.log('Stats API - Tarih aralığı:', { startDate, endDate });
    
    
    const incomeTotal = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.userId),
          type: 'income',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    
    const expenseTotal = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.userId),
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    
    const expensesByCategory = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.userId),
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' }
        }
      },
      {
        $sort: { amount: -1 }
      }
    ]);
    
    const timeSeriesData = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.userId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: period === 'week' ? { $dayOfMonth: '$date' } : null,
            type: '$type'
          },
          amount: { $sum: '$amount' }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1
        }
      }
    ]);
    
    const formattedTimeSeries = [];
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    
    timeSeriesData.forEach(item => {
      let label;
      
      if (period === 'week') {
        
        const date = new Date(item._id.year, item._id.month - 1, item._id.day);
        const dayName = new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(date);
        label = `${dayName} ${item._id.day}`;
      } else {
        
        label = months[item._id.month - 1];
      }
      
      formattedTimeSeries.push({
        label,
        type: item._id.type,
        amount: item.amount,
        year: item._id.year,
        month: item._id.month,
        day: item._id.day
      });
    });
    const categoryColors = {
      'Yiyecek': '#4E7AF9',
      'Konaklama': '#2ED573',
      'Ulaşım': '#FDCB6E',
      'Eğlence': '#FF4757',
      'Faturalar': '#8C69FF',
      'Alışveriş': '#FF7043',
      'Sağlık': '#2196F3',
      'Eğitim': '#9C27B0',
      'Yatırım': '#00BCD4',
      'Maaş': '#8BC34A',
      'Diğer': '#607D8B'
    };
    
    
    const formattedCategories = expensesByCategory.map(cat => ({
      name: cat._id,
      amount: cat.amount,
      color: categoryColors[cat._id] || '#607D8B' 
    }));
    
    res.json({
      success: true,
      data: {
        income: incomeTotal.length > 0 ? incomeTotal[0].total : 0,
        expense: expenseTotal.length > 0 ? expenseTotal[0].total : 0,
        savings: (incomeTotal.length > 0 ? incomeTotal[0].total : 0) - 
                 (expenseTotal.length > 0 ? expenseTotal[0].total : 0),
        chartData: {
          
          labels: [...new Set(formattedTimeSeries.map(item => item.label))],
          datasets: {
            income: formattedTimeSeries
              .filter(item => item.type === 'income')
              .map(item => item.amount),
            expense: formattedTimeSeries
              .filter(item => item.type === 'expense')
              .map(item => item.amount)
          }
        },
        categories: formattedCategories
      }
    });
  } catch (error) {
    console.error('Transaction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;
