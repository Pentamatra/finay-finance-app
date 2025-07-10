const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/notificationModel');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 }) 
      .limit(50); 
    
    res.json(notifications);
  } catch (error) {
    console.error('Bildirimler alınırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Bildirim bulunamadı' });
    }
    
    notification.isRead = !notification.isRead;
    await notification.save();
    
    res.json(notification);
  } catch (error) {
    console.error('Bildirim güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});
router.patch('/:id/important', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Bildirim bulunamadı' });
    }
    
    notification.isImportant = !notification.isImportant;
    await notification.save();
    
    res.json(notification);
  } catch (error) {
    console.error('Bildirim güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Notification.deleteOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Bildirim bulunamadı' });
    }
    
    res.json({ message: 'Bildirim silindi' });
  } catch (error) {
    console.error('Bildirim silinirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.patch('/mark-all-read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    
    res.json({ message: 'Tüm bildirimler okundu olarak işaretlendi' });
  } catch (error) {
    console.error('Bildirimler güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, message, type, category, isImportant, relatedData } = req.body;
    
    const notification = new Notification({
      userId: req.user.id,
      title,
      message,
      type: type || 'info',
      category: category || 'transaction',
      isImportant: isImportant || false,
      relatedData
    });
    
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Bildirim oluşturulurken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
