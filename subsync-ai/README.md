# SubSync AI 🚀
### AI-Powered Subscription Management Platform — Full MERN Stack

> Track, manage, and optimize all your recurring subscriptions with AI.
> Built with React, Node.js, Express, MongoDB + OpenAI.

---

## 📁 Project Structure

```
subsync-ai/
├── server/                      # Node.js + Express backend
│   ├── src/
│   │   ├── models/              # Mongoose schemas (User, Subscription, Notification)
│   │   ├── controllers/         # Business logic (auth, subs, AI, analytics...)
│   │   ├── routes/              # Express route definitions
│   │   ├── middleware/          # JWT auth, rate limiting
│   │   └── utils/              # Cron jobs, email helpers
│   ├── .env.example
│   └── package.json
├── client/                      # React frontend
│   ├── src/
│   │   ├── pages/              # Landing, Login, Signup, Dashboard pages
│   │   ├── context/            # AuthContext (global state)
│   │   └── utils/              # Axios API service layer
│   ├── public/
│   └── package.json
├── render.yaml                  # Render.com deployment config
├── vercel.json                  # Vercel deployment config
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local) OR free MongoDB Atlas cluster
- Git

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/subsync-ai.git
cd subsync-ai

# Install root deps
npm install

# Install server deps
cd server && npm install && cd ..

# Install client deps
cd client && npm install && cd ..
```

### 2. Configure Environment
```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secrets

# Client (optional for local)
cp client/.env.example client/.env
```

**Minimum required in `server/.env`:**
```env
MONGODB_URI=mongodb://localhost:27017/subsync-ai
JWT_SECRET=any-long-random-string-32-chars-min
JWT_REFRESH_SECRET=another-long-random-string
```

### 3. Start Development Servers
```bash
# From root — starts both backend (port 5000) and frontend (port 3000)
npm run dev

# Or separately:
npm run server    # Backend only
npm run client    # Frontend only
```

Open: http://localhost:3000

---

## 🗄️ Database Setup

### Option A: MongoDB Atlas (Free Cloud — Recommended)
1. Go to https://cloud.mongodb.com → Create free account
2. Create a **Free Shared Cluster** (M0 tier — free forever)
3. Add a database user: Security → Database Access
4. Whitelist IP: Security → Network Access → Add `0.0.0.0/0` (all IPs)
5. Click **Connect** → **Drivers** → Copy connection string
6. Paste into `server/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/subsync-ai
   ```

### Option B: Local MongoDB
```bash
# macOS
brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community

# Ubuntu
sudo apt install mongodb && sudo systemctl start mongodb
```

---

## 🌐 FREE DEPLOYMENT GUIDE

### Architecture for Free Hosting:
```
Frontend  → Vercel (free)        → subsync-ai.vercel.app
Backend   → Render.com (free)    → subsync-ai-api.onrender.com
Database  → MongoDB Atlas (free) → cloud cluster
```

---

## 🚀 Step 1: Deploy Backend to Render.com

**Render Free Tier:** 750 hours/month, spins down after 15 min idle (wakes up in ~30s on next request)

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: SubSync AI MERN app"
   git remote add origin https://github.com/yourusername/subsync-ai.git
   git push -u origin main
   ```

2. **Create Render account:** https://render.com → Sign up with GitHub

3. **New Web Service:**
   - Dashboard → **New** → **Web Service**
   - Connect your GitHub repo
   - Settings:
     | Field | Value |
     |-------|-------|
     | Name | `subsync-ai-api` |
     | Root Directory | `server` |
     | Environment | `Node` |
     | Build Command | `npm install` |
     | Start Command | `npm start` |
     | Plan | `Free` |

4. **Environment Variables** (Add in Render dashboard):
   ```
   NODE_ENV          = production
   PORT              = 10000
   MONGODB_URI       = mongodb+srv://... (from Atlas)
   JWT_SECRET        = (generate random 64 chars: openssl rand -hex 32)
   JWT_REFRESH_SECRET= (generate another random string)
   JWT_EXPIRE        = 7d
   JWT_REFRESH_EXPIRE= 30d
   CLIENT_URL        = https://subsync-ai.vercel.app
   ```

5. Click **Create Web Service** → Wait 3-5 min for build

6. Test: `https://subsync-ai-api.onrender.com/api/health`  
   Should return: `{"success":true,"message":"SubSync AI API is running 🚀"}`

---

## ▲ Step 2: Deploy Frontend to Vercel

**Vercel Free Tier:** Unlimited deployments, 100GB bandwidth/month, custom domains

1. **Create Vercel account:** https://vercel.com → Sign up with GitHub

2. **Import Project:**
   - Dashboard → **Add New** → **Project**
   - Import your GitHub repo
   - Settings:
     | Field | Value |
     |-------|-------|
     | Framework Preset | `Create React App` |
     | Root Directory | `client` |
     | Build Command | `npm run build` |
     | Output Directory | `build` |

3. **Environment Variables** (in Vercel dashboard):
   ```
   REACT_APP_API_URL = https://subsync-ai-api.onrender.com/api
   ```

4. Click **Deploy** → Wait ~2 min

5. Your app is live at: `https://subsync-ai.vercel.app` 🎉

---

## 🔁 Step 3: Update CORS on Backend

After getting your Vercel URL, go to Render → Environment → update:
```
CLIENT_URL = https://subsync-ai.vercel.app
```
Click **Manual Deploy** → Deploy Latest Commit

---

## 🆓 Alternative Free Hosting Options

### Backend Alternatives:
| Platform    | Free Tier | Notes |
|-------------|-----------|-------|
| **Railway** | $5 credit/mo | Better cold start, `railway.app` |
| **Fly.io**  | 3 free VMs | CLI-based, Dockerfile needed |
| **Koyeb**   | 1 free service | No spin-down! Always on |
| **Cyclic**  | Free Node.js | No spin-down, AWS-backed |

#### Deploy to Railway (No spin-down on free credit):
```bash
npm install -g @railway/cli
railway login
railway init
railway up
railway variables set MONGODB_URI="..." JWT_SECRET="..."
```

### Frontend Alternatives:
| Platform      | Free Tier | Notes |
|---------------|-----------|-------|
| **Netlify**   | 100GB/mo  | Drag & drop build folder |
| **GitHub Pages** | Unlimited | Static only, needs `gh-pages` package |
| **Cloudflare Pages** | Unlimited | Fastest CDN globally |

#### Deploy to Netlify:
```bash
cd client && npm run build
# Drag the `build/` folder to https://app.netlify.com/drop
```

---

## 🗃️ Free Database Options

| Service | Free Tier | Limit |
|---------|-----------|-------|
| **MongoDB Atlas M0** | Forever free | 512 MB storage |
| **PlanetScale** | 5 GB | MySQL (needs Mongoose adapter) |
| **Supabase** | 500 MB | PostgreSQL |
| **Turso** | 9 GB | SQLite edge DB |

---

## 🔧 Optional: Add OpenAI for Real AI Responses

Without an OpenAI key, SubBot AI uses smart rule-based responses (works great!).  
To enable real GPT responses:

1. Get API key: https://platform.openai.com/api-keys
2. Add to Render env vars:
   ```
   OPENAI_API_KEY = sk-proj-...
   ```
3. The app auto-detects the key and switches to OpenAI GPT-3.5-turbo

---

## 📱 Custom Domain (Free with Vercel)

1. Buy domain: Namecheap (~$8/yr for .com) or get free `.is-a.dev` / `.netlify.app`
2. Vercel Dashboard → Your Project → Settings → Domains → Add domain
3. Add DNS records as instructed by Vercel
4. SSL is automatic and free ✅

---

## 🔐 Production Security Checklist

- [ ] Set strong `JWT_SECRET` (64+ random chars): `openssl rand -hex 32`
- [ ] Use MongoDB Atlas with IP whitelist (not `0.0.0.0/0`)
- [ ] Enable Render's DDoS protection
- [ ] Set `NODE_ENV=production`
- [ ] Configure email (Gmail App Password for Nodemailer)
- [ ] Enable 2FA on all deployment accounts

---

## 📊 Tech Stack Summary

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | React 18, React Router v6, Recharts, Framer Motion | Vercel |
| Backend | Node.js, Express 4, JWT Auth, Rate Limiting | Render |
| Database | MongoDB, Mongoose ODM | MongoDB Atlas |
| AI | OpenAI GPT-3.5 (+ rule-based fallback) | Via API |
| Email | Nodemailer + Gmail SMTP | Free |
| Scheduling | node-cron (renewal checks) | Built-in |
| Security | Helmet, bcryptjs, express-rate-limit, CORS | Built-in |

---

## 🧑‍💻 API Endpoints Reference

```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login user
POST   /api/auth/google            Google OAuth
POST   /api/auth/refresh           Refresh access token
POST   /api/auth/forgot-password   Send reset email
GET    /api/auth/me                Get current user

GET    /api/subscriptions          List all subscriptions
POST   /api/subscriptions          Add subscription
PUT    /api/subscriptions/:id      Update subscription
DELETE /api/subscriptions/:id      Delete subscription
GET    /api/subscriptions/summary  Dashboard summary

GET    /api/analytics/monthly-spend      6-month spend data
GET    /api/analytics/category-breakdown Category pie chart data
GET    /api/analytics/forecast           3-month forecast
GET    /api/analytics/renewal-calendar   Monthly calendar

POST   /api/ai/chat                Chat with SubBot AI
GET    /api/ai/analyze             Run AI analysis
GET    /api/ai/insights            Get AI recommendations

GET    /api/notifications          List notifications
PATCH  /api/notifications/mark-all-read  Mark all read
PATCH  /api/notifications/:id/read Mark one read

GET    /api/billing/current-plan   Get plan + invoices
POST   /api/billing/upgrade        Upgrade plan

PUT    /api/users/profile          Update profile
PUT    /api/users/preferences      Update preferences
```

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

**Built with ❤️ for investors and internship demos. SubSync AI — Made in India 🇮🇳**
