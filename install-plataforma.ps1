param(
  [switch]$SkipNodeInstall,
  [string]$InstallPath = 'C:\Plataforma\Pedidos',
  [string]$SystemName  = 'LubeferPedidos'
)

$ErrorActionPreference = 'Stop'

# ─────────────────────── helpers ───────────────────────

function Write-Step([string]$Msg) { Write-Host "[SETUP] $Msg" -ForegroundColor Cyan    }
function Write-Ok  ([string]$Msg) { Write-Host "[OK]    $Msg" -ForegroundColor Green   }
function Write-Warn([string]$Msg) { Write-Host "[AVISO] $Msg" -ForegroundColor Yellow  }

function Assert-Command([string]$Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-NodeMajorVersion {
  if (-not (Assert-Command 'node')) { return 0 }
  $v = (& node -v).Trim() -replace '^v', ''
  return [int]($v.Split('.')[0])
}

function Ensure-Node {
  if ($SkipNodeInstall) { Write-Warn 'Instalacao automatica do Node ignorada.'; return }

  $major = Get-NodeMajorVersion
  if ($major -ge 20) { Write-Ok "Node.js encontrado (v$major)."; return }

  if (-not (Assert-Command 'winget')) {
    throw 'Node.js 20+ nao encontrado e winget indisponivel. Instale Node LTS: https://nodejs.org'
  }

  Write-Step 'Instalando Node.js LTS via winget...'
  & winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements

  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
              [Environment]::GetEnvironmentVariable('Path', 'User')

  $major = Get-NodeMajorVersion
  if ($major -lt 20) {
    throw 'Node.js 20+ nao detectado apos instalacao. Feche o terminal e tente novamente.'
  }
  Write-Ok "Node.js instalado (v$major)."
}

function Run-Npm([string]$WorkingDir, [string[]]$NpmArgs) {
  Push-Location $WorkingDir
  try {
    & npm @NpmArgs
    if ($LASTEXITCODE -ne 0) { throw "npm $($NpmArgs -join ' ') falhou em $WorkingDir" }
  } finally { Pop-Location }
}

function Run-NpmBuild([string]$WorkingDir, [string]$DistCheck) {
  Push-Location $WorkingDir
  try {
    & npm run build
    $code = $LASTEXITCODE
  } finally { Pop-Location }

  if ($code -ne 0) {
    # Verifica se o dist foi gerado apesar do exit code != 0 (falso negativo do npm/vite no Windows)
    if ($DistCheck -and (Test-Path $DistCheck)) {
      Write-Warn "npm run build retornou codigo $code mas o dist foi gerado. Continuando..."
    } else {
      throw "npm run build falhou em $WorkingDir (codigo $code). Verifique o log acima para o erro real."
    }
  }
}

function New-Shortcut([string]$LnkPath, [string]$Target, [string]$WorkDir = '', [string]$Desc = '') {
  $wsh = New-Object -ComObject WScript.Shell
  $sc  = $wsh.CreateShortcut($LnkPath)
  $sc.TargetPath = $Target
  if ($WorkDir) { $sc.WorkingDirectory = $WorkDir }
  if ($Desc)    { $sc.Description      = $Desc    }
  $sc.Save()
}

# ─────────────────────── main ───────────────────────

$source = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ''
Write-Host '==========================================' -ForegroundColor Blue
Write-Host "  Instalador da Plataforma $SystemName"     -ForegroundColor Blue
Write-Host '==========================================' -ForegroundColor Blue
Write-Host ''

# ── 1. Copiar arquivos para o destino ──────────────────
Write-Step "Copiando arquivos para $InstallPath ..."
if ($source -ne $InstallPath) {
  $null = New-Item -ItemType Directory -Force -Path $InstallPath

  # robocopy: codigos 0-7 sao OK (0=nada, 1=copiou, 2=extra, 3-7=combinacoes)
  robocopy $source $InstallPath /E /NFL /NDL /NJH /NJS `
    /XD '.git' 'node_modules' `
    /XF '*.slnx' '.gitignore'

  if ($LASTEXITCODE -ge 8) { throw "Falha ao copiar arquivos (robocopy codigo $LASTEXITCODE)." }
  Write-Ok 'Arquivos copiados.'
} else {
  Write-Ok 'Ja no diretorio de instalacao, copia ignorada.'
}

# ── 2. Node.js ─────────────────────────────────────────
Write-Step 'Validando Node.js...'
Ensure-Node

# ── 3. Dependencias e builds ───────────────────────────
$destFrontend = Join-Path $InstallPath 'frontend'
$destServer   = Join-Path $InstallPath 'server'

Write-Step 'Instalando dependencias do frontend...'
Run-Npm $destFrontend @('install', '--prefer-offline')

Write-Step 'Instalando dependencias do backend...'
Run-Npm $destServer @('install', '--prefer-offline')

Write-Step 'Gerando build do frontend...'
# NODE_OPTIONS amplia o heap do Node para projetos grandes (ExcelJS + react-pdf)
$env:NODE_OPTIONS = '--max-old-space-size=4096'
Run-NpmBuild $destFrontend (Join-Path $destFrontend 'dist\index.html')

Write-Step 'Gerando build do backend...'
Run-NpmBuild $destServer (Join-Path $destServer 'dist\index.js')
$env:NODE_OPTIONS = ''

# ── 4. Pastas de dados (planilhas) ─────────────────────
$catalogoDir = Join-Path $InstallPath 'frontend\public\catalogo'
$clientesDir = Join-Path $InstallPath 'frontend\public\clientes'

foreach ($dir in @($catalogoDir, $clientesDir)) {
  if (-not (Test-Path $dir)) {
    $null = New-Item -ItemType Directory -Force -Path $dir
    Write-Ok "Pasta criada: $dir"
  }
}

# ── 5. Arquivo .env ────────────────────────────────────
$envDest    = Join-Path $InstallPath 'server\.env'
$envExample = Join-Path $InstallPath 'server\.env.example'
if (-not (Test-Path $envDest) -and (Test-Path $envExample)) {
  Copy-Item $envExample $envDest
  Write-Warn 'server\.env criado. Configure as credenciais SMTP antes de iniciar.'
}

# ── 6. Atalhos na Area de Trabalho ─────────────────────
Write-Step 'Criando atalhos na Area de Trabalho...'

$desktop       = [Environment]::GetFolderPath('Desktop')
$desktopFolder = Join-Path $desktop $SystemName
$null = New-Item -ItemType Directory -Force -Path $desktopFolder

# Pasta — Produtos
New-Shortcut `
  -LnkPath (Join-Path $desktopFolder 'Planilha de Produtos.lnk') `
  -Target  $catalogoDir `
  -Desc    'Pasta com planilhas de produtos'

# Pasta — Clientes
New-Shortcut `
  -LnkPath (Join-Path $desktopFolder 'Planilha de Clientes.lnk') `
  -Target  $clientesDir `
  -Desc    'Pasta com planilhas de clientes'

# Iniciar Plataforma
New-Shortcut `
  -LnkPath (Join-Path $desktopFolder 'Iniciar Plataforma.lnk') `
  -Target  (Join-Path $InstallPath 'start-plataforma.bat') `
  -WorkDir $InstallPath `
  -Desc    "Inicia a Plataforma $SystemName"

# Parar Plataforma
New-Shortcut `
  -LnkPath (Join-Path $desktopFolder 'Parar Plataforma.lnk') `
  -Target  (Join-Path $InstallPath 'stop-plataforma.bat') `
  -WorkDir $InstallPath `
  -Desc    "Para a Plataforma $SystemName"

# Abrir no navegador (arquivo .url)
@"
[InternetShortcut]
URL=http://localhost:8787
"@ | Out-File -FilePath (Join-Path $desktopFolder 'Abrir Sistema.url') -Encoding ASCII

Write-Ok "Atalhos criados em: $desktopFolder"

# ── Resumo final ────────────────────────────────────────
Write-Host ''
Write-Host '==========================================' -ForegroundColor Green
Write-Host "  Instalacao concluida!" -ForegroundColor Green
Write-Host "  Pasta do sistema : $InstallPath" -ForegroundColor Green
Write-Host "  Atalhos          : $desktopFolder" -ForegroundColor Green
if (-not (Test-Path $envDest)) {
  Write-Host "  ATENCAO: Configure server\.env (SMTP) antes de iniciar." -ForegroundColor Yellow
}
Write-Host '==========================================' -ForegroundColor Green
Write-Host ''
