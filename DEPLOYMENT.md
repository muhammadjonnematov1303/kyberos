# 🚀 KYBERS.OS - Render.com Deployment Qo'llanmasi

## 📋 Bosqichma-bosqich yo'riqnoma

### 1️⃣ GitHub'ga yuklash

```bash
# Git repository yaratish (agar yo'q bo'lsa)
git init
git add .
git commit -m "Initial commit - Ready for deployment"

# GitHub'ga push qilish
git remote add origin https://github.com/USERNAME/kybers-os.git
git branch -M main
git push -u origin main
```

### 2️⃣ Render.com'da hisob ochish

1. [render.com](https://render.com) saytiga kiring
2. "Sign Up" tugmasini bosing
3. GitHub akkauntingiz bilan ro'yxatdan o'ting

### 3️⃣ Web Service yaratish

1. Dashboard'da **"New +"** tugmasini bosing
2. **"Web Service"** tanlang
3. GitHub repository'ingizni ulang
4. `kybers-os` repository'ni tanlang

### 4️⃣ Sozlamalar

**Basic Settings:**
- **Name**: `kybers-os` (yoki istalgan nom)
- **Region**: `Oregon (US West)` (yoki yaqin region)
- **Branch**: `main`
- **Root Directory**: bo'sh qoldiring
- **Runtime**: `Node`
- **Build Command**: 
  ```bash
  npm install --prefix backend
  ```
- **Start Command**: 
  ```bash
  npm start --prefix backend
  ```

**Plan:**
- **Free** plan tanlang (0$/month)

### 5️⃣ Environment Variables qo'shish

"Environment" bo'limida quyidagilarni qo'shing:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://neondb_owner:npg_oJsTbc8q4zfU@ep-long-cherry-am6w59mn-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=13032013
```

⚠️ **Muhim**: `DATABASE_URL` va `JWT_SECRET` ni o'z qiymatlaringiz bilan almashtiring!

### 6️⃣ Deploy qilish

1. **"Create Web Service"** tugmasini bosing
2. Render avtomatik deploy qila boshlaydi
3. 2-5 daqiqa kutib turing

### 7️⃣ Frontend sozlash

Frontend static fayllar backend bilan birga serve qilinadi, chunki `server.js` da:

```javascript
app.use(express.static(path.join(__dirname, '..', 'frontend')));
```

Shuning uchun alohida frontend deploy qilish shart emas!

---

## 🌐 Saytingiz tayyor!

Deploy tugagandan keyin:

- **Backend API**: `https://kybers-os.onrender.com/api`
- **Frontend**: `https://kybers-os.onrender.com`
- **Admin Panel**: `https://kybers-os.onrender.com/pages/admin.html`
- **Health Check**: `https://kybers-os.onrender.com/api/health`

---

## 🔧 Frontend API URL'ni yangilash

Frontend'dagi API URL'larni yangilash kerak:

### `frontend/js/auth.js`, `frontend/js/admin.js`, `frontend/js/apps.js`, `frontend/js/main.js`

```javascript
// Eski:
const API_URL = 'http://localhost:5000/api';

// Yangi:
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api'
  : 'https://kybers-os.onrender.com/api';
```

Yoki oddiy:

```javascript
const API_URL = '/api';  // Relative URL ishlatish
```

---

## 📊 Monitoring

Render Dashboard'da:

- **Logs**: Real-time loglarni ko'rish
- **Metrics**: CPU, Memory, Request count
- **Events**: Deploy history
- **Settings**: Environment variables, domains

---

## 🔄 Yangilanishlar

Har safar GitHub'ga push qilganingizda, Render avtomatik deploy qiladi:

```bash
git add .
git commit -m "Update: yangi xususiyat"
git push
```

---

## ⚡ Bepul plan cheklovi

- **750 soat/oy** (yetarli)
- **15 daqiqa inactivity'dan keyin sleep mode**
- **Birinchi request 30-60 soniya oladi** (cold start)

### Cold start muammosini hal qilish:

1. **UptimeRobot** (bepul monitoring):
   - [uptimerobot.com](https://uptimerobot.com)
   - Har 5 daqiqada ping yuboradi
   - Sayt doim active bo'ladi

2. **Cron Job** (Render'da):
   - Render'da "Cron Job" yarating
   - Har 10 daqiqada `/api/health` ga request yuboradi

---

## 🐛 Muammolarni hal qilish

### Deploy muvaffaqiyatsiz bo'lsa:

1. **Logs**ni tekshiring (Render Dashboard)
2. **Build Command** to'g'ri ekanligini tekshiring
3. **Environment Variables** to'liq ekanligini tekshiring

### Database ulanmasa:

1. Neon.tech database active ekanligini tekshiring
2. `DATABASE_URL` to'g'ri ekanligini tekshiring
3. Neon'da IP whitelist'ni tekshiring (Render IP'larini qo'shing)

### Frontend ochilmasa:

1. Backend `/api/health` ishlayotganini tekshiring
2. Frontend fayllar `frontend/` papkasida ekanligini tekshiring
3. `server.js` da static files serve qilinayotganini tekshiring

---

## 🎯 Keyingi qadamlar

1. ✅ Custom domain ulash (agar kerak bo'lsa)
2. ✅ SSL sertifikat (avtomatik)
3. ✅ CDN sozlash (Cloudflare)
4. ✅ Monitoring sozlash (UptimeRobot)
5. ✅ Backup strategiyasi (database)

---

## 📞 Yordam

Agar muammo bo'lsa:
- Render Docs: [render.com/docs](https://render.com/docs)
- Telegram: [@ulken_admin](https://t.me/ulken_admin)

---

**Muvaffaqiyatli deployment! 🎉**
