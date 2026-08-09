$project = $PSScriptRoot
$log = "$env:TEMP\opencode\crm-dev.log"
$err = "$env:TEMP\opencode\crm-dev.err.log"

# Limpa logs anteriores
Remove-Item $log, $err -Force -ErrorAction SilentlyContinue

# Garante que a pasta exista
New-Item -ItemType Directory -Path (Split-Path $log) -Force | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        INICIANDO CRM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Inicia o Vite
$p = Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList "run","dev" `
    -WorkingDirectory $project `
    -RedirectStandardOutput $log `
    -RedirectStandardError $err `
    -PassThru `
    -WindowStyle Hidden

Write-Host "PID: $($p.Id)" -ForegroundColor DarkGray
Write-Host "Aguardando o Vite iniciar..." -ForegroundColor Yellow
Write-Host ""

$url = $null

# Remove códigos ANSI, que quebram a busca por "localhost:porta"
function Get-CleanText($file) {
    if (Test-Path $file) {
        return (Get-Content $file -Raw -ErrorAction SilentlyContinue) -replace "\x1b\[[0-9;]*m", ""
    }
    return ""
}

# Aguarda até 60 segundos
for ($i = 0; $i -lt 60; $i++) {

    Start-Sleep -Seconds 1

    # Junta saída normal e stderr
    $combined = "$(Get-CleanText $log)`n$(Get-CleanText $err)"

    # Procura qualquer localhost:porta
    if ($combined -match "http://localhost:\d+") {
        $url = $matches[0]
        break
    }

    # Se o processo realmente morreu, encerra a espera
    if ($p.HasExited) {
        Start-Sleep -Milliseconds 500

        $combined = "$(Get-CleanText $log)`n$(Get-CleanText $err)"

        if ($combined -match "http://localhost:\d+") {
            $url = $matches[0]
        }

        break
    }
}

# ========================================
# SUCESSO
# ========================================

if ($url) {

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "       CRM INICIADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "URL: $url" -ForegroundColor Cyan
    Write-Host ""

    # Abre o navegador
    Start-Process $url
}

# ========================================
# FALHA REAL
# ========================================

else {

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "     O CRM NÃO FOI INICIADO" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""

    Write-Host "--- SAÍDA DO VITE ---" -ForegroundColor Yellow

    if (Test-Path $log) {
        Get-Content $log -Raw -ErrorAction SilentlyContinue
    }

    Write-Host ""
    Write-Host "--- STDERR ---" -ForegroundColor Yellow

    if (Test-Path $err) {
        Get-Content $err -Raw -ErrorAction SilentlyContinue
    }

    Write-Host ""
}
