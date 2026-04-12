@echo off
setlocal

set ROOT=%~dp0
cd /d "%ROOT%"

echo ==========================================
echo  Build + Reinicializacao da Plataforma
echo ==========================================

:: ── Pré-requisitos ─────────────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Execute install-plataforma.bat primeiro.
  pause
  exit /b 1
)

if not exist "server\.env" (
  echo [ERRO] server\.env nao encontrado. Configure as credenciais SMTP.
  pause
  exit /b 1
)

:: ── Encerra instancia em execucao (se houver) ──────────────────────────────
echo.
echo [1/4] Encerrando instancia anterior...
call "%ROOT%stop-plataforma.bat"
timeout /t 2 >nul

:: ── Build do Frontend (TypeScript + Vite) ──────────────────────────────────
echo.
echo [2/4] Build do Frontend...
cd /d "%ROOT%frontend"
call npm run build
if errorlevel 1 (
  echo [ERRO] Falha no build do frontend.
  pause
  exit /b 1
)
echo [OK] Frontend compilado.

:: ── Build do Servidor BFF (TypeScript) ─────────────────────────────────────
echo.
echo [3/4] Build do Servidor BFF...
cd /d "%ROOT%server"
call npm run build
if errorlevel 1 (
  echo [ERRO] Falha no build do servidor.
  pause
  exit /b 1
)
echo [OK] Servidor compilado.

:: ── Inicializa a plataforma ─────────────────────────────────────────────────
echo.
echo [4/4] Iniciando a plataforma...
cd /d "%ROOT%"
call "%ROOT%start-plataforma.bat"

exit /b 0
