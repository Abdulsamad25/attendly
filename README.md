# Attendly - HR Attendance Management System

An enterprise-grade HR attendance management system built with modern web technologies. Track employee attendance, manage leave requests, calculate deductions, and maintain comprehensive audit trails - all in one intuitive platform.

![Status](https://img.shields.io/badge/status-active-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Node](https://img.shields.io/badge/node-v16+-green) ![React](https://img.shields.io/badge/react-18+-blue)

---

## 🚀 Features

### Admin Dashboard
- **Real-time Overview**: View daily attendance, pending approvals, and system alerts
- **Staff Management**: Add, activate, deactivate employees with role-based access
- **Attendance Tracking**: Monitor check-in/out times, late arrivals, and absences
- **Leave Management**: Queue and approve employee leave requests with policy enforcement
- **Leave Calendar**: Visual calendar view of approved leaves and public holidays
- **Payroll Deductions**: Calculate and report salary deductions based on absences
- **Global Settings**: Configure shift times, grace periods, leave types, and public holidays
- **Audit Logs**: Complete history of all system actions and changes

### Staff Portal
- **My Attendance**: View personal attendance records with filtering and export options
- **Leave Requests**: Submit leave requests with type selection and advance notice requirements
- **My Leaves**: Track approved, pending, and rejected leave requests
- **My Deductions**: View salary deduction breakdowns and appeals
- **Profile Settings**: Update personal information and password
- **Notifications**: Real-time alerts for leave approvals, rejections, and system updates

### Security
- **JWT Authentication**: Secure token-based authentication with access & refresh tokens
- **Session Management**: Automatic logout after 60 minutes of inactivity
- **Role-Based Access**: Separate interfaces for admin and staff roles
- **Token Expiry**: Automatic token validation and refresh on every request
- **Secure Storage**: Credentials stored in sessionStorage, cleared on logout

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Job Scheduling**: node-cron
- **Validation**: express-validator
- **CORS**: Express CORS middleware
- **Environment**: dotenv

### Frontend
- **Library**: React 18 with Hooks
- **Build Tool**: Vite (fast module bundler)
- **Styling**: Tailwind CSS with Material Design 3
- **Icons**: Lucide React
- **HTTP Client**: Axios with custom interceptors
- **Routing**: React Router v6 with Guards pattern
- **State Management**: React Hooks + TanStack React Query
- **Validation**: Zod schemas
- **Development**: ESLint configuration

---

## 📦 Installation

### Prerequisites
- Node.js v16 or higher
- npm or yarn package manager
- MongoDB instance (local or cloud)

### Clone Repository
```bash
git clone https://github.com/Abdulsamad25/attendly.git
cd attendly
```

### Backend Setup
```bash
cd attendly-backend

# Install dependencies
npm install

# Create .env file with configuration
cp .env.example .env

# Start server
npm start
# Server runs on http://localhost:5000
```

### Frontend Setup
```bash
cd attendly-frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
# App runs on http://localhost:5173
```

---

## 🔧 Environment Variables

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/attendly

# JWT
JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📁 Project Structure

```
attendly/
├── attendly-backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/           # Request handlers
│   │   ├── authController.js
│   │   ├── attendanceController.js
│   │   ├── leaveController.js
│   │   ├── adminController.js
│   │   └── ...
│   ├── models/               # Mongoose schemas
│   │   ├── User.js
│   │   ├── Attendance.js
│   │   ├── Leave.js
│   │   └── ...
│   ├── routes/               # API endpoints
│   ├── middleware/           # Auth, validation middleware
│   ├── jobs/                 # Cron jobs (attendance processing)
│   ├── utils/                # JWT, email, helpers
│   ├── server.js             # Express app setup
│   └── package.json
│
├── attendly-frontend/
│   ├── src/
│   │   ├── api/              # API client functions
│   │   ├── components/       # Reusable React components
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   ├── lib/              # AuthContext, helpers
│   │   ├── pages/            # Page components
│   │   │   ├── admin/
│   │   │   ├── staff/
│   │   │   └── auth/
│   │   ├── routes/           # Route guards
│   │   ├── App.jsx           # Main app component
│   │   ├── main.jsx          # React entry point
│   │   └── index.css         # Global styles
│   ├── public/               # Static assets
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚴 Running the Application

### Development Mode

**Terminal 1 - Backend**:
```bash
cd attendly-backend
npm start
```

**Terminal 2 - Frontend**:
```bash
cd attendly-frontend
npm run dev
```

Then open your browser to `http://localhost:5173`

### Production Build

**Backend**:
```bash
cd attendly-backend
npm start  # Ensure NODE_ENV=production in .env
```

**Frontend**:
```bash
cd attendly-frontend
npm run build    # Creates optimized dist folder
npm run preview  # Preview production build locally
```

---

## 🔑 Key Endpoints

### Authentication
- `POST /api/auth/register` - Register new staff
- `POST /api/auth/admin/register` - Register new admin
- `POST /api/auth/login` - Staff login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Admin Routes
- `GET /api/admin/settings` - Get global settings
- `PUT /api/admin/settings` - Update settings
- `GET /api/admin/leave-types` - Get all leave types
- `PATCH /api/admin/leave-types/:id` - Update leave type
- `GET /api/admin/staff` - List all staff
- `GET /api/admin/attendance` - Attendance overview
- `GET /api/admin/leaves` - Leave management queue

### Staff Routes
- `GET /api/attendance/today` - Today's attendance
- `GET /api/attendance/all` - Attendance history
- `POST /api/leaves` - Submit leave request
- `GET /api/leaves/my` - My leave requests
- `GET /api/deductions/my` - My deductions
- `GET /api/profile` - User profile

---

## 🔐 Security Features

### Session Management
- **Inactivity Timeout**: Auto-logout after 60 minutes of inactivity
- **Token Expiry**: Access tokens expire in 15 minutes, refresh tokens in 7 days
- **Token Validation**: Every API request checks token validity
- **Secure Storage**: Credentials stored in sessionStorage, cleared on logout
- **Cross-Tab Support**: Storage events for multi-tab session handling

### Authentication
- **JWT Tokens**: Stateless authentication with secure token signing
- **Password Hashing**: Bcrypt hashing for password storage
- **Refresh Token Rotation**: New tokens issued on each refresh
- **CORS Protection**: Configurable origin restrictions

### Data Protection
- **Input Validation**: All inputs validated server-side
- **Role-Based Access**: Admin and staff role separation
- **Audit Logging**: All actions logged for compliance
- **SQL Injection Protection**: Parameterized queries via Mongoose

---

## 📊 Database Models

### User
- Personal information, email, phone
- Role (admin/staff)
- Company association
- Account status (active/pending/inactive)

### Company
- Company details
- Employee count
- Configuration settings

### Attendance
- Check-in/out timestamps
- Status (present/late/absent)
- Notes and remarks
- Date-based indexing

### Leave
- Leave type selection
- Start and end dates
- Status (pending/approved/rejected)
- Approval workflow

### LeaveType
- Name and description
- Annual cap (days)
- Advance notice requirement
- Active status

### PublicHoliday
- Date and country code
- Automatic calendar sync

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Admin access to all dashboards
- [ ] Staff attendance check-in/out
- [ ] Leave request submission and approval
- [ ] Session timeout after 60 minutes inactivity
- [ ] Token refresh on API requests
- [ ] Logout clears all session data
- [ ] Backend restart doesn't bypass authentication

### Test Credentials
```
Admin:
Email: admin@attendly.local
Password: [set during registration]

Staff:
Email: staff@attendly.local
Password: [set during registration]
```

---

## 📝 API Documentation

Full API documentation available at:
- Postman Collection: `/postman-collection.json` (if available)
- Swagger/OpenAPI: Enable in backend config
- Manual docs: See backend routes folder

### Example Request
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@attendly.local",
    "password": "password123"
  }'

# Get attendance (requires Bearer token)
curl -X GET http://localhost:5000/api/attendance/today \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

### Code Style
- Follow existing code patterns
- Use meaningful variable names
- Add comments for complex logic
- Test before submitting PR

---

## 🐛 Known Issues & Roadmap

### Current
- ✅ Multi-timezone support planned
- ✅ Mobile app (React Native) in planning
- ✅ Advanced reporting and analytics
- ✅ Biometric attendance integration
- ✅ WhatsApp/SMS notifications

### Future Enhancements
- [ ] Video interview scheduling
- [ ] Employee performance tracking
- [ ] Salary slip generation
- [ ] Bank integration for direct deposit
- [ ] Mobile app for attendance
- [ ] Blockchain audit trail

---

## 📧 Support & Contact

- **Issues**: GitHub Issues
- **Email**: support@attendly.local
- **Documentation**: See `/docs` folder
- **Discord**: [Community Server](link-if-available)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Tailwind CSS](https://tailwindcss.com) for styling framework
- [Lucide Icons](https://lucide.dev) for beautiful icons
- [Express.js](https://expressjs.com) community
- [React](https://react.dev) documentation and examples

---

## 📊 Project Stats

- **Frontend Files**: 50+ components and pages
- **Backend Routes**: 40+ API endpoints
- **Database Collections**: 8 MongoDB models
- **Total Lines of Code**: 15,000+
- **Test Coverage**: In progress

---

**Last Updated**: May 11, 2026  
**Version**: 1.0.0  
**Maintainer**: [Abdulsamad25](https://github.com/Abdulsamad25)
