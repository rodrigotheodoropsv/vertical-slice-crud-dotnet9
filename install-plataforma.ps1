param(
  [switch]$SkipNodeInstall
)

$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
  Write-Host "[SETUP] $Message" -ForegroundColor Cyan
}

function Assert-Command([string]$Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-NodeMajorVersion {
  if (-not (Assert-Command 'node')) { return $null }
  $v = (& node -v).Trim()
  if ($v.StartsWith('v')) { $v = $v.Substring(1) }
  $major = $v.Split('.')[0]
  return [int]$major
}

function Ensure-Node {
  if ($SkipNodeInstall) {
    Write-Step 'Instalacao automatica do Node ignorada por parametro.'
    return
  }

  $major = Get-NodeMajorVersion
  if ($major -ge 20) {
    Write-Step "Node.js encontrado (v$major)."
    return
  }

  if (-not (Assert-Command 'winget')) {
    throw 'Node.js 20+ nao encontrado e winget indisponivel. Instale Node LTS manualmente: https://nodejs.org'
  }

  Write-Step 'Instalando Node.js LTS via winget...'
  & winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements

  # Atualiza PATH da sessao atual com PATH de maquina + usuario
  $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
  $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
  $env:Path = "$machinePath;$userPath"

  $major = Get-NodeMajorVersion
  if ($major -lt 20) {
    throw 'Falha ao detectar Node.js 20+ apos instalacao. Feche e abra o terminal e execute novamente.'
  }
  Write-Step "Node.js instalado com sucesso (v$major)."
}

function Run-Npm([string]$WorkingDir, [string[]]$Args) {
  Push-Location $WorkingDir
  try {
    & npm @Args
    if ($LASTEXITCODE -ne 0) {
      throw "Comando npm falhou em $WorkingDir: npm $($Args -join ' ')"
    }
  }
  finally {
    Pop-Location
  }
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = Join-Path $root 'frontend'
$server = Join-Path $root 'server'

Write-Step 'Validando Node.js...'
Ensure-Node

Write-Step 'Instalando dependencias do frontend...'
Run-Npm $frontend @('install')

Write-Step 'Instalando dependencias do backend...'
Run-Npm $server @('install')

Write-Step 'Gerando build do frontend...'
Run-Npm $frontend @('run', 'build')

Write-Step 'Gerando build do backend...'
Run-Npm $server @('run', 'build')

$envPath = Join-Path $server '.env'
$envExamplePath = Join-Path $server '.env.example'
if (-not (Test-Path $envPath) -and (Test-Path $envExamplePath)) {
  Write-Step 'Criando server/.env a partir de .env.example...'
  Copy-Item $envExamplePath $envPath
}

Write-Host ''
Write-Host 'Instalacao concluida com sucesso.' -ForegroundColor Green
Write-Host 'Proximo passo: configure server/.env (SMTP) e rode start-plataforma.bat.' -ForegroundColor Green
