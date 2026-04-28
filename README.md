# 🛡️ KYBERS.OS

Premium Cyber Security Platform - Zamonaviy kiberxavfsizlik yechimlari

---

## 🚀 Tezkor Ishga Tushirish

### Windows
```bash
start.bat
```

### Linux/Mac
```bash
chmod +x start.sh
./start.sh
```

### VS Code
1. `Ctrl+Shift+P` bosing
2. "Tasks: Run Task" tanlang
3. "🚀 Start Server" tanlang

Yoki:
- `F5` bosing - Server ishga tushadi

---

## 📦 O'rnatish

### 1. Dependencies
```bash
# Avtomatik
npm run setup

# Yoki qo'lda
cd server
npm install
```

### 2. Environment
`.env` fayli allaqachon sozlangan:
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=5000
```

### 3. Ishga Tushirish
```bash
# Production
npm start

# Development (auto-restart)
npm run dev

# Test connection
npm test
```

---

## 🎯 Xususiyatlar

### Frontend
- ✅ Responsive dizayn
- ✅ Qora-qizil cyber tema
- ✅ Smooth animatsiyalar
- ✅ Glassmorphism effektlar
- ✅ Mobile-friendly

### Backend
- ✅ Express.js API
- ✅ PostgreSQL database
- ✅ JWT authentication
- ✅ File upload
- ✅ Admin panel

### Security
- ✅ Password hashing (bcrypt)
- ✅ JWT tokens
- ✅ Input validation
- ✅ CORS protection
- ✅ Rate limiting

---

## 📁 Struktura

```
kybers-os/
├── css/                 # Styles
│   ├── style.css       # Main styles
│   ├── auth.css        # Auth pages
│   └── admin.css       # Admin panel
├── js/                  # Scripts
│   ├── main.js         # Main logic
│   ├── auth.js         # Authentication
│   ├── admin.js        # Admin panel
│   └── apps.js         # Apps page
├── pages/               # HTML pages
│   ├── login.html
│   ├── register.html
│   ├── admin.html
│   └── apps.html
├── server/              # Backend
│   ├── config/         # Database config
│   ├── models/         # Data models
│   ├── routes/         # API routes
│   ├── middleware/     # Auth middleware
│   └── server.js       # Main server
├── images/              # Assets
├── index.html           # Landing page
├── start.bat            # Windows start script
├── start.sh             # Linux/Mac start script
└── README.md            # This file
```

---

## 🔧 Komandalar

### NPM Scripts
```bash
npm start              # Start server
npm run dev            # Development mode
npm test               # Test connection
npm run setup          # Install + test
npm run install:server # Install server deps
```

### Server Scripts
```bash
cd server
npm start              # Production
npm run dev            # Development
npm run test:connection # Test DB
```

---

## 🌐 Portlar

- **API**: http://localhost:5000
- **Frontend**: index.html (Live Server)
- **Health Check**: http://localhost:5000/api/health

---

## 👤 Admin Panel

**URL**: http://localhost:5000/pages/admin.html

**Default Admin**:
- Email: `perdebaevadilbek586@gmail.com`
- Parol: Ro'yxatdan o'tishda belgilangan

**Imkoniyatlar**:
- Dashboard
- Ilovalar boshqaruvi
- Foydalanuvchilar
- To'lovlar
- Xabarlar

---

## 🔐 API Endpoints

### Auth
```
POST /api/auth/register  # Ro'yxatdan o'tish
POST /api/auth/login     # Kirish
GET  /api/auth/me        # Profil
```

### Apps
```
GET    /api/apps         # Barcha ilovalar
POST   /api/apps         # Yangi ilova (admin)
PUT    /api/apps/:id     # Tahrirlash (admin)
DELETE /api/apps/:id     # O'chirish (admin)
```

### Payments
```
GET  /api/payments       # Barcha to'lovlar
POST /api/payments       # Yangi to'lov
PUT  /api/payments/:id   # Status o'zgartirish (admin)
```

### Messages
```
GET  /api/messages       # Barcha xabarlar
POST /api/messages       # Yangi xabar
PUT  /api/messages/:id   # Status o'zgartirish (admin)
```

---

## 🐛 Muammolarni Hal Qilish

### Server ishlamayapti?
```bash
# Port band bo'lsa
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Dependencies qayta o'rnatish
cd server
rm -rf node_modules
npm install
```

### Database ulanmayapti?
1. `.env` faylini tekshiring
2. Internet ulanishini tekshiring
3. MongoDB Atlas IP whitelist'ni tekshiring
4. `npm test` buyrug'ini bajaring

### Frontend ochilmayapti?
1. Live Server ishlatib oching
2. Yoki `index.html` ni to'g'ridan-to'g'ri oching

---

## 📝 Development

### Code Style
- ES6+ JavaScript
- Async/await
- Clean code principles
- Comments in Uzbek/English

### Git Workflow
```bash
git add .
git commit -m "feat: yangi xususiyat"
git push
```

---

## 🚀 Deployment

### Backend (Heroku/Railway)
```bash
# Set environment variables
DATABASE_URL=...
JWT_SECRET=...
PORT=5000

# Deploy
git push heroku main
```

### Frontend (Netlify/Vercel)
```bash
# Build command: none
# Publish directory: .
```

---

## 📞 Aloqa

- **Email**: perdebaevadilbek586@gmail.com
- **Telegram**: [@ulken_admin](https://t.me/ulken_admin) - Murojaat uchun
- **Telegram Kanal**: [@kybers_os](https://t.me/kybers_os)
- **Instagram**: [@kybers.os](https://instagram.com/kybers.os)
- **YouTube**: [@kyber_os](https://youtube.com/@kyber_os)

---

## 📄 License

MIT License - Free to use

---

## 🎉 Credits

**Developed by**: KYBERS.OS Team  
**Year**: 2026  
**Location**: Nukus, Uzbekistan

---

**Muvaffaqiyatli ishga tushirish! 🚀**
