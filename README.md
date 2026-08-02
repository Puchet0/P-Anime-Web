<p align="center">
  <a href="README.md">🇬🇧 English</a> •
  <a href="README_ES.md">🇪🇸 Español</a>
</p>

---

# P-Anime-Web 🎬

Personal web app for watching anime — no complications, streaming in Latin Spanish.

<p align="center">
  <img width="3617" height="1817" alt="P-Anime Web Screenshot 1" src="https://github.com/user-attachments/assets/fbcee76a-b4d0-4872-b2b1-f3564702cfba" />
</p>
<p align="center">
  <img width="3500" height="1590" alt="P-Anime Web Screenshot 2" src="https://github.com/user-attachments/assets/1649fe3c-6ca6-4a19-9c77-a6865b470bdd" />
</p>

## ⚠️ Disclaimer

This project is for **educational and personal use only**. It is not a commercial service, generates no revenue, and has no profit intent.

## About

P-Anime-Web is a web client that consumes the open-source API by [FxxMorgan/anime1v-api], scraping content from AnimeAV1.com.

### Liability

- ❌ This server **does NOT store** any video files
- ❌ This project **does NOT own** any copyrighted content
- ❌ All content is streamed **directly** from external sources
- ❌ The user is responsible for how they use the service

### Features
- 🎬 No registration required
- 🚫 No ads
- 🖥️ Ready for personal self-hosting
- 🔓 Open source

---

**Credits:** API scraper built by [FxxMorgan]

## 🚀 Deploy

### 🌐 Coolify Cloud
[![Deploy to Coolify](https://cdn.coollabs.io/coolify/button.svg)](https://app.coolify.io/deploy?repo=https://github.com/Puchet0/P-Anime-Web&branch=main)

### 🖥️ Coolify Self-Hosted

Copy this link into your Coolify instance:

`https://YOUR-COOLIFY.com/deploy?repo=https://github.com/Puchet0/P-Anime-Web&branch=main`

If you have **Coolify Cloud** (coolify.io): click the button above.

If you have **Coolify local/self-hosted**: go to your panel → New Resource → Git Repository → fill in:
- Repository: `https://github.com/Puchet0/P-Anime-Web`
- Branch: `main`

### ⚙️ Required Environment Variables

Configure these in Coolify:

**Frontend (Build-time):**
```bash
VITE_API_URL=/api/v1
VITE_API_KEY=your-api-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Backend (Runtime):**
```bash
NODE_ENV=production
PORT=3001
API_KEYS=your-api-key
DISABLE_AUTH=false
DISABLE_RATE_LIMIT=false
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PUBLIC_BASE_URL=https://your-domain.com
```

See `.env.example` for all available options.

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Deployment:** Docker multi-stage build + Coolify
- **Proxy:** nginx (reverse proxy + static files)
- **Process Manager:** supervisord (nginx + node in one container)

## 📁 Project Structure

```
├── concepts/premium-streaming-app/   # Frontend (React + Vite)
├── api-backend/                      # Backend (Express.js)
├── Dockerfile.multi                  # Multi-stage Docker build
├── docker-compose.yaml               # Docker Compose config
├── supervisord.conf                  # Process manager config
└── .env.example                      # Environment variables template
```

## 📝 License

This project is for educational purposes only. Use responsibly.
