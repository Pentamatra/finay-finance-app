const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finaydb')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

console.log('Route handlers yükleniyor...');
app.use('/api/users', userRoutes);
console.log('userRoutes yüklendi.');
app.use('/api/transactions', transactionRoutes);
console.log('transactionRoutes yüklendi.');
app.use('/api/notifications', notificationRoutes);
console.log('notificationRoutes yüklendi.');

app.get('/api/test', (req, res) => {
  console.log('Test endpoint çağrıldı');
  res.json({ message: 'API test endpoint çalışıyor' });
});
app.use('/api/admin', adminRoutes);


app.get('/', (req, res) => {
  res.send('Finay API is running');
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Bir hata oluştu',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});


const PORT = process.env.PORT || 5001; 
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
