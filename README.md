# Finay - Personal Finance Management App

A comprehensive personal finance management application built with React Native and Node.js, designed to help users track their income, expenses, and financial goals with an intuitive and modern interface.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure registration and login system with JWT tokens
- **Transaction Management**: Add, edit, delete, and categorize financial transactions
- **Real-time Balance Tracking**: Automatic balance updates based on income and expenses
- **Financial Analytics**: Comprehensive charts and statistics for spending patterns
- **Multi-category Support**: Organized transaction categories (Food, Bills, Transportation, etc.)
- **Dark/Light Theme**: Customizable theme system with multiple color schemes
- **Admin Panel**: Administrative interface for user management

### Advanced Features
- **Portfolio Management**: Track investments and assets
- **Market Analysis**: Real-time financial market data
- **Reports & Analytics**: Detailed financial reports and insights
- **Notifications**: Price alerts and financial reminders
- **Multi-platform Support**: iOS, Android, and Web compatibility

## 🛠️ Technology Stack

### Frontend
- **React Native** (0.76.9) - Cross-platform mobile development
- **Expo** (^52.0.46) - Development platform and tools
- **React Navigation** (^6.5.7) - Navigation library
- **Expo Linear Gradient** - Gradient UI components
- **React Native Chart Kit** - Data visualization
- **AsyncStorage** - Local data persistence
- **Moment.js** - Date manipulation

### Backend
- **Node.js** - Server runtime
- **Express.js** (^4.18.2) - Web framework
- **MongoDB** (^7.0.3) - Database
- **Mongoose** - MongoDB object modeling
- **JWT** (^9.0.0) - Authentication tokens
- **bcryptjs** (^2.4.3) - Password hashing
- **CORS** (^2.8.5) - Cross-origin resource sharing

### Development Tools
- **TypeScript** (^5.3.3) - Type safety
- **Nodemon** (^3.1.10) - Development server
- **Concurrently** (^8.0.1) - Run multiple commands

## 📱 Screenshots

The app features a modern, gradient-based design with:
- Animated home screen with financial overview
- Interactive transaction charts
- Category-based transaction organization
- Dark/light theme support
- Smooth animations and transitions

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or cloud)
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd finaymp
   ```

2. **Install dependencies**
   ```bash
   # Install client dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   cd ..
   ```

3. **Environment Setup**
   Create a `.env` file in the server directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/finaydb
   JWT_SECRET=your_jwt_secret_here
   PORT=5001
   NODE_ENV=development
   ```

4. **Start the development servers**
   ```bash
   # Start both client and server concurrently
   npm run dev
   
   # Or start them separately:
   # Terminal 1 - Start server
   npm run server
   
   # Terminal 2 - Start client
   npm start
   ```

5. **Run on specific platforms**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   
   # Web
   npm run web
   ```

## 📁 Project Structure

```
finaymp/
├── App.js                          # Main app component
├── app.json                        # Expo configuration
├── package.json                    # Dependencies and scripts
├── components/                     # Reusable components
│   └── TransactionChart.js         # Chart component
├── contexts/                       # React contexts
│   ├── AuthContext.js              # Authentication context
│   └── ThemeContext.js             # Theme management
├── screens/                        # App screens
│   ├── HomeScreen.js               # Main dashboard
│   ├── LoginScreen.js              # User login
│   ├── RegisterScreen.js           # User registration
│   ├── AddTransactionScreen.js     # Add new transaction
│   ├── EditTransactionScreen.js    # Edit transaction
│   ├── PortfolioScreen.js          # Portfolio management
│   ├── ReportsScreen.js            # Financial reports
│   ├── StatsScreen.js              # Statistics and analytics
│   ├── AlertsScreen.js             # Price alerts
│   ├── NotificationsScreen.js      # Notifications
│   ├── SettingsScreen.js           # App settings
│   ├── AdminScreen.js              # Admin panel
│   ├── StocksScreen.js             # Stock market
│   ├── CryptoScreen.js             # Cryptocurrency
│   ├── FundsScreen.js              # Mutual funds
│   └── ForexScreen.js              # Foreign exchange
├── server/                         # Backend server
│   ├── server.js                   # Main server file
│   ├── middleware/
│   │   └── auth.js                 # Authentication middleware
│   ├── models/                     # Database models
│   │   ├── userModel.js            # User schema
│   │   ├── transactionModel.js     # Transaction schema
│   │   └── notificationModel.js    # Notification schema
│   └── routes/                     # API routes
│       ├── userRoutes.js           # User endpoints
│       ├── transactionRoutes.js    # Transaction endpoints
│       ├── adminRoutes.js          # Admin endpoints
│       └── notificationRoutes.js   # Notification endpoints
└── assets/                         # Static assets
    ├── apple-icon.png
    ├── facebook-icon.png
    └── google-icon.png
```

## 🔧 API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update user profile
- `PATCH /api/users/preferences` - Update user preferences

### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - Get transactions (with filters)
- `GET /api/transactions/:id` - Get specific transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/stats/summary` - Get financial statistics

### Admin
- `POST /api/admin/create-admin` - Create admin user
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats` - Get system statistics

## 🎨 Theming

The app supports multiple themes and dark/light modes:
- **Default Theme**: Blue gradient (#4E7AF9 to #8C69FF)
- **Green Theme**: Green gradient (#2ED573 to #7BED9F)
- **Orange Theme**: Orange gradient (#FF9F43 to #FDCB6E)
- **Purple Theme**: Purple gradient (#9C27B0 to #BA68C8)

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  balance: Number,
  isAdmin: Boolean,
  preferences: {
    language: String,
    currency: String,
    darkMode: Boolean,
    notifications: Boolean,
    security: String
  },
  premiumStatus: String,
  profilePicture: String,
  lastLogin: Date,
  createdAt: Date
}
```

### Transaction Model
```javascript
{
  user: ObjectId (ref: User),
  type: String (income/expense/transfer),
  amount: Number,
  category: String,
  description: String,
  date: Date,
  paymentMethod: String,
  status: String,
  currency: String,
  tags: [String],
  location: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for secure cross-origin requests
- **User Authorization**: Role-based access control

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB instance
2. Configure environment variables
3. Deploy to platforms like Heroku, DigitalOcean, or AWS

### Mobile App Deployment
1. Build for production:
   ```bash
   expo build:android
   expo build:ios
   ```
2. Submit to app stores (Google Play Store, Apple App Store)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- React Native community for excellent documentation
- Expo team for the amazing development platform
- MongoDB team for the robust database solution
- All open-source contributors who made this project possible

## 📞 Support

For support, email support@finayapp.com or create an issue in the repository.

---

**Finay** - Take control of your finances, one transaction at a time! 💰
