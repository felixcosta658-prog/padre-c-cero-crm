@echo off
setlocal
cd /d "%~dp0"
title Fabrica de Cabos - Launcher

echo Verificando se o servidor ja esta rodando...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:8080/' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch { exit 1 }"
if %errorlevel%==0 (
    echo Servidor ja ativo.
) else (
    echo Iniciando servidor de desenvolvimento em segundo plano...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -WorkingDirectory '%~dp0' -WindowStyle Minimized -RedirectStandardOutput '%TEMP%\fabrica-dev.log' -RedirectStandardError '%TEMP%\fabrica-dev-err.log'"
    echo Aguardando o servidor iniciar...
    powershell -NoProfile -Command "$ready=$false; for($i=0;$i -lt 40;$i++){ Start-Sleep 1; try { $r=Invoke-WebRequest -Uri 'http://localhost:8080/' -UseBasicParsing -TimeoutSec 1; if($r.StatusCode -eq 200){$ready=$true;break} } catch {} }; if($ready){exit 0}else{exit 1}"
    if %errorlevel%==0 ( echo Servidor iniciado com sucesso. ) else ( echo Aviso: servidor nao respondeu a tempo. Veja %TEMP%\fabrica-dev-err.log )
)

echo Abrindo o projeto no navegador...
start "" "http://localhost:8080/"
echo Pronto!
