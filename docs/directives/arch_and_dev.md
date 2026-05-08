# 🏗️ Architecture & Development (San Rafael 360)

## 🏗️ Architecture Summary
- **Frontend**: Next.js (App Router) en Vercel.
- **Backend**: Strapi v5 (TypeScript) en Railway.
- **Database**: PostgreSQL (Railway).

## 🛠️ Build & Dev Commands
- **Root Build**: `npm run build:all` (para Railway/Vercel).
- **Backend Dev**: `cd backend && npm run dev`
- **Frontend Dev**: `cd frontend && npm run dev`
- **Setup Config**: `pwsh setup.ps1` (copia .env.example a .env local).

## 🤖 Agent Autonomy & CLI Logs
- **Mandatory Server Logs Access**: Un agente de IA **NUNCA** debe adivinar el motivo de un "Crash" o "502 Bad Gateway".
- **Directiva de Login**: Si el agente no tiene acceso a los logs de Railway, su primer paso OBLIGATORIO debe ser ejecutar comando `railway login` en consola asíncrona.
- **Troubleshooting First**: Siempre visualizar el build log o el deploy log antes de sugerir cambios en código.
- **Directiva Node.js Path (CRÍTICO)**:
  - **En Mac (actual)**: `export PATH="/Users/diego/.nvm/versions/node/v20.20.2/bin:$PATH"`.
- **Zero-Trust Verification (CRÍTICO)**: Railway utiliza Zero Downtime Deployments. **NUNCA** asumas que un push se aplicó solo porque la API responde. El agente DEBE confirmar que el despliegue finalizó de construir vía Railway web o CLI.
