@echo off
setlocal

set ROOT=%~dp0
cd /d "%ROOT%"

echo ==========================================
echo  Iniciando Plataforma Lubefer
echo ==========================================

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Execute install-plataforma.bat novamente.
  pause
  exit /b 1
)

if not exist "server\.env" (
  echo [AVISO] server\.env nao encontrado.
  copy "server\.env.example" "server\.env" >nul
  echo Configure server\.env com as credenciais SMTP e inicie novamente.
  pause
  exit /b 1
)

if not exist "server\dist\index.js" (
  echo [AVISO] Build nao encontrada. Execute install-plataforma.bat primeiro.
  pause
  exit /b 1
)

echo Iniciando servidor...
cscript //nologo "%ROOT%start-backend-hidden.vbs" "%ROOT%server"
if errorlevel 1 goto :fail

timeout /t 2 >nul
start "" "http://localhost:8787"

echo Plataforma iniciada com sucesso!
exit /b 0

:fail
echo [ERRO] Falha ao iniciar a plataforma.
pause
exit /b 1
