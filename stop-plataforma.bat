@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo Encerrando Plataforma Lubefer (Local)
echo ==========================================

set KILLED=0

call :kill_by_port 8787 "Backend BFF"
call :kill_by_port 5173 "Frontend Dev"

if "%KILLED%"=="0" (
  echo Nenhum processo encontrado nas portas monitoradas.
) else (
  echo Encerramento concluido.
)

exit /b 0

:kill_by_port
set PORT=%~1
set LABEL=%~2
set FOUND=0

for /f "tokens=5" %%P in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING') do (
  set FOUND=1
  echo [%LABEL%] Encerrando PID %%P na porta %PORT%...
  taskkill /PID %%P /F >nul 2>&1
  if !errorlevel! equ 0 (
    echo [%LABEL%] PID %%P encerrado.
    set KILLED=1
  ) else (
    echo [%LABEL%] Falha ao encerrar PID %%P - processo pode ja ter sido finalizado.
  )
)

if "%FOUND%"=="0" (
  echo [%LABEL%] Nenhum processo LISTENING na porta %PORT%.
)

exit /b 0
