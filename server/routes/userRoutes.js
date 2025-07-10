const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'finaysecret123', {
    expiresIn: '30d'
  });
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
    }

    const user = await User.create({
      name,
      email,
      password
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Geçersiz kullanıcı bilgileri' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt received for email:', email);
    const user = await User.findOne({ email });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (user && (await user.matchPassword(password))) {
      console.log('Password match successful');
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        isAdmin: user.isAdmin,
        token: generateToken(user._id)
      });
    } else {
      console.log('Login failed: Invalid credentials');
      res.status(401).json({ message: 'E-posta adresi veya şifre hatalı' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Giriş yapılmadı, token bulunamadı' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'finaysecret123');
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (user) {

      res.json({
        id: user._id,
        firstName: user.firstName || user.name.split(' ')[0] || '',
        lastName: user.lastName || user.name.split(' ').slice(1).join(' ') || '',
        email: user.email,
        balance: user.balance,
        isAdmin: user.isAdmin,
        profilePicture: user.profilePicture,
        preferences: user.preferences || {
          language: 'Türkçe',
          currency: 'TRY',
          notifications: true,
          darkMode: false,
          security: 'Şifre koruması'
        },
        premiumStatus: user.premiumStatus || 'Standart sürüm'
      });
    } else {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({ message: 'Geçersiz token' });
  }
});

router.patch('/preferences', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Giriş yapılmadı, token bulunamadı' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'finaysecret123');

    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    if (!user.preferences) {
      user.preferences = {};
    }

    const allowedPreferences = ['language', 'currency', 'darkMode', 'notifications', 'security'];
    
    let updated = false;
    
    for (const [key, value] of Object.entries(req.body)) {
      if (allowedPreferences.includes(key)) {
        user.preferences[key] = value;
        updated = true;
      }
    }
    
    if (updated) {

      await user.save();
      res.json({ 
        message: 'Tercihler başarıyla güncellendi',
        preferences: user.preferences 
      });
    } else {
      res.status(400).json({ message: 'Güncellenecek tercih bulunamadı' });
    }
    
  } catch (error) {
    console.error('Preferences update error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Geçersiz token' });
    }
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.post('/create-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
    }

    const user = await User.create({
      name,
      email,
      password,
      isAdmin: true 
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        isAdmin: user.isAdmin,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Geçersiz kullanıcı bilgileri' });
    }
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.get('/stats', async (req, res) => {
  console.log('/api/users/stats endpoint çağrıldı');
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Giriş yapılmadı, token bulunamadı' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'finaysecret123');

    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    
    const currentMonth = new Date().getMonth();
    const labels = [];
    const chartValues = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      labels.push(months[monthIndex]);
      chartValues.push(Math.floor(Math.random() * 3000) + 2000);
    }

    const categories = [
      { name: 'Yiyecek', amount: 1200, color: '#4E7AF9' },
      { name: 'Konaklama', amount: 1500, color: '#2ED573' },
      { name: 'Ulaşım', amount: 1000, color: '#FDCB6E' },
      { name: 'Eğlence', amount: 800, color: '#FF4757' },
      { name: 'Faturalar', amount: 500, color: '#8C69FF' },
    ];
    const income = 8500;
    const expense = 5000;
    const savings = income - expense;

    res.json({
      income,
      expense,
      savings,
      chartData: {
        labels,
        values: chartValues
      },
      categories
    });
    
  } catch (error) {
    console.error('Stats fetch error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Geçersiz token' });
    }
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.patch('/profile', async (req, res) => {
  try {

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Giriş yapılmadı, token bulunamadı' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'finaysecret123');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    const { firstName, lastName, email } = req.body;
    let updated = false;
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
      }
      user.email = email;
      updated = true;
    }
    if (firstName) {
      user.firstName = firstName;
      updated = true;
    }
    
    if (lastName) {
      user.lastName = lastName;
      updated = true;
    }
    if (firstName || lastName) {
      const newFirstName = firstName || user.firstName || '';
      const newLastName = lastName || user.lastName || '';
      user.name = `${newFirstName} ${newLastName}`.trim();
    }
    
    if (updated) {
      await user.save();
      res.json({ 
        message: 'Profil başarıyla güncellendi',
        user: {
          id: user._id,
          firstName: user.firstName || user.name.split(' ')[0] || '',
          lastName: user.lastName || user.name.split(' ').slice(1).join(' ') || '',
          email: user.email,
          profilePicture: user.profilePicture
        }
      });
    } else {
      res.status(400).json({ message: 'Güncellenecek bilgi bulunamadı' });
    }
    
  } catch (error) {
    console.error('Profile update error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Geçersiz token' });
    }
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
