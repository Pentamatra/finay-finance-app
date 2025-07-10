const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const isAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Giriş yapılmadı, token bulunamadı' });
    }
    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'finaysecret123');
    
    req.user = { id: decoded.id };
    const user = await User.findById(decoded.id);
    if (user && user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: 'Admin yetkisi gerekli' });
    }
  } catch (error) {
    console.error('Admin middleware hatası:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Geçersiz token' });
    }
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

router.get('/users', isAdmin, async (req, res) => {
  try {
    console.log('Admin users endpoint çağrıldı');
    const users = await User.find().select('-password');
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const Transaction = require('../models/transactionModel');
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const transactionCount = await Transaction.countDocuments({
      createdAt: { $gte: oneMonthAgo }
    });
    const daysOfWeek = ['Paz', 'Pts', 'Sal', 'Çar', 'Per', 'Cum', 'Cts'];
    const today = new Date();
    const dayLabels = [];
    const activityData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      dayLabels.push(daysOfWeek[date.getDay()]);
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const dailyTransactions = await Transaction.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      activityData.push(dailyTransactions);
    }
    
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(user => user.lastLogin && new Date(user.lastLogin) > oneWeekAgo).length || 0,
      totalBalance: users.reduce((sum, user) => sum + (user.balance || 0), 0),
      transactionsThisMonth: transactionCount,
      chartData: {
        labels: dayLabels,
        values: activityData
      }
    };
    
    console.log('Admin stats hazırlandı:', stats);
    
    res.json({
      users,
      ...stats
    });
  } catch (error) {
    console.error('Admin users endpoint hatası:', error);
    res.status(500).json({ message: 'Kullanıcılar yüklenirken bir hata oluştu' });
  }
});

router.delete('/users/:userId', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Kendi hesabınızı silemezsiniz' });
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    if (userToDelete.isAdmin) {
      return res.status(400).json({ message: 'Admin kullanıcılar silinemez' });
    }

    const Transaction = require('../models/transactionModel');
    const Notification = require('../models/notificationModel');
    
    await Transaction.deleteMany({ user: userId });
    await Notification.deleteMany({ user: userId });

    await User.findByIdAndDelete(userId);
    
    console.log(`Kullanıcı silindi: ${userId}`);
    res.json({ message: 'Kullanıcı başarıyla silindi' });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    res.status(500).json({ message: 'Kullanıcı silinirken bir hata oluştu' });
  }
});

router.put('/users/:userId', isAdmin, async (req, res) => {
  try {
    const { name, email, balance } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { name, email, balance },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Kullanıcı güncellenirken bir hata oluştu' });
  }
});

router.put('/make-admin/:userId', isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isAdmin: true },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    res.json({
      message: 'Kullanıcı admin yapıldı',
      user
    });
  } catch (error) {
    console.error('Admin yapma hatası:', error);
    res.status(500).json({ message: 'Kullanıcı admin yapılırken bir hata oluştu' });
  }
});

router.post('/create-admin', isAdmin, async (req, res) => {
  try {
    const { name, email, password, balance } = req.body;

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
    }

    const newAdmin = new User({
      name,
      email,
      password,
      balance: balance || 0,
      isAdmin: true
    });
    
    await newAdmin.save();
    
    res.status(201).json({
      message: 'Admin kullanıcısı başarıyla oluşturuldu',
      user: {
        _id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        balance: newAdmin.balance,
        isAdmin: newAdmin.isAdmin
      }
    });
  } catch (error) {
    console.error('Admin oluşturma hatası:', error);
    res.status(500).json({ message: 'Admin kullanıcısı oluşturulurken bir hata oluştu' });
  }
});

module.exports = router;