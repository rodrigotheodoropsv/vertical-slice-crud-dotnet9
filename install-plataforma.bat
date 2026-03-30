@echo off
setlocal

set ROOT=%~dp0
cd /d "%ROOT%"

echo ==========================================
echo Instalador da Plataforma Lubefer
echo ==========================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%install-plataforma.ps1"
if errorlevel 1 (
  echo [ERRO] Falha na instalacao.
  pause
  exit /b 1
)

echo Instalacao finalizada.
pause
exit /b 0
