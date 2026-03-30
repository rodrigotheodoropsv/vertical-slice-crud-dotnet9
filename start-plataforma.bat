@echo off
setlocal

set ROOT=%~dp0
cd /d "%ROOT%"

echo ==========================================
echo Iniciando Plataforma Lubefer (Local)
echo ==========================================

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Instale Node 20+.
  pause
  exit /b 1
)

if not exist "server\.env" (
  echo [INFO] Arquivo server\.env nao encontrado.
  copy "server\.env.example" "server\.env" >nul
  echo [ACAO] Edite server\.env com as credenciais da Locaweb e execute novamente.
  pause
  exit /b 1
)

echo [1/4] Instalando dependencias do frontend...
pushd frontend
call npm install
popd
if errorlevel 1 goto :fail

echo [2/4] Instalando dependencias do backend...
pushd server
call npm install
popd
if errorlevel 1 goto :fail

echo [3/4] Gerando build do frontend...
pushd frontend
call npm run build
popd
if errorlevel 1 goto :fail

echo [4/4] Iniciando servidor local...
cscript //nologo "%ROOT%start-backend-hidden.vbs" "%ROOT%server"
if errorlevel 1 goto :fail

timeout /t 2 >nul
start "" "http://localhost:8787"

echo Plataforma iniciada.
exit /b 0

:fail
echo [ERRO] Falha ao iniciar a plataforma.
pause
exit /b 1
