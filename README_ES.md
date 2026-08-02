<p align="center">
  <a href="README.md">🇬🇧 English</a> •
  <a href="README_ES.md">🇪🇸 Español</a>
</p>

---

# P-Anime-Web 🎬

Web personal para ver anime sin complicaciones, streaming en español Latino.

<p align="center">
  <img width="3617" height="1817" alt="P-Anime Web Captura 1" src="https://github.com/user-attachments/assets/fbcee76a-b4d0-4872-b2b1-f3564702cfba" />
</p>
<p align="center">
  <img width="3500" height="1590" alt="P-Anime Web Captura 2" src="https://github.com/user-attachments/assets/1649fe3c-6ca6-4a19-9c77-a6865b470bdd" />
</p>

## ⚠️ Aviso importante

Este proyecto es para **fines educativos y uso personal exclusivamente**. No es un servicio comercial, no genera ingresos ni tiene fines de lucro.

## Acerca del proyecto

P-Anime-Web es un cliente web que consume la API open source de [FxxMorgan/anime1v-api], extrayendo contenido desde AnimeAV1.com.

### Limitación de responsabilidad

- ❌ Este servidor **NO almacena** ningún archivo de video
- ❌ Este proyecto **NO posee** contenido con derechos de autor
- ❌ Todo el contenido se transmite **directamente** desde fuentes externas
- ❌ El usuario es responsable del uso que haga del servicio

### Características
- 🎬 Sin registro obligatorio
- 🚫 Sin publicidad
- 🖥️ Listo para self-hosting personal
- 🔓 Código abierto

---

**Créditos:** API scraper desarrollada por [FxxMorgan]

## 🚀 Deploy

### 🌐 Coolify Cloud
[![Deploy to Coolify](https://cdn.coollabs.io/coolify/button.svg)](https://app.coolify.io/deploy?repo=https://github.com/Puchet0/P-Anime-Web&branch=main)

### 🖥️ Coolify Self-Hosted

Copia este enlace en tu instancia de Coolify:

`https://TU-COOLIFY.com/deploy?repo=https://github.com/Puchet0/P-Anime-Web&branch=main`

Si tienes **Coolify Cloud** (coolify.io): haz click en el botón de arriba.

Si tienes **Coolify local/self-hosted**: ve a tu panel → New Resource → Git Repository → completa:
- Repository: `https://github.com/Puchet0/P-Anime-Web`
- Branch: `main`

### ⚙️ Variables de entorno requeridas

Configura estas en Coolify:

**Frontend (Build-time):**
```bash
VITE_API_URL=/api/v1
VITE_API_KEY=tu-api-key
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

**Backend (Runtime):**
```bash
NODE_ENV=production
PORT=3001
API_KEYS=tu-api-key
DISABLE_AUTH=false
DISABLE_RATE_LIMIT=false
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
PUBLIC_BASE_URL=https://tu-dominio.com
```

Ver `.env.example` para todas las opciones disponibles.

## 🛠️ Tecnologías

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Base de datos:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Deploy:** Docker multi-stage build + Coolify
- **Proxy:** nginx (reverse proxy + archivos estáticos)
- **Procesos:** supervisord (nginx + node en un solo container)

## 📁 Estructura del proyecto

```
├── concepts/premium-streaming-app/   # Frontend (React + Vite)
├── api-backend/                      # Backend (Express.js)
├── Dockerfile.multi                  # Build Docker multi-stage
├── docker-compose.yaml               # Configuración Docker Compose
├── supervisord.conf                  # Configuración del process manager
└── .env.example                      # Plantilla de variables de entorno
```

## 📝 Licencia

Este proyecto es solo para fines educativos. Úsalo de manera responsable.
