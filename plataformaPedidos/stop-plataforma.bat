@echo off
echo ==========================================
echo Encerrando Plataforma Lubefer (Local)
echo ==========================================

:: netstat -ano e filtro por regex no PowerShell — sem modulos externos, sem dependencia de idioma.
:: O padrao "TCP\s+\S+:8787\s+\S+:0\s" so bate em linhas LISTENING (endereco remoto termina em :0).
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$killed = $false;" ^
  "netstat -ano | Select-String 'TCP\s+\S+:8787\s+\S+:0\s' | ForEach-Object {" ^
  "  $p = [int](($_ -split '\s+')[-1]);" ^
  "  Stop-Process -Id $p -Force -ErrorAction SilentlyContinue;" ^
  "  Write-Host '[Backend BFF] PID' $p 'encerrado.';" ^
  "  $killed = $true;" ^
  "};" ^
  "if (-not $killed) { Write-Host 'Nenhum processo encontrado na porta 8787.' }"

exit /b 0
