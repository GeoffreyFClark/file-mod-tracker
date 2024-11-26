@echo off
set LOGFILE=%~dp0\install.log
set DRIVERDIR=%~dp0

echo Starting certificate installation >> "%LOGFILE%"
certutil -addstore -enterprise "Root" "%DRIVERDIR%\snFilter.cer" >> "%LOGFILE%" 2>&1

echo Removing old version if exist >> "%LOGFILE%"
sc stop snFilter >> "%LOGFILE%" 2>&1
sc delete snFilter >> "%LOGFILE%" 2>&1
pnputil -d "%DRIVERDIR%\snFilter.inf" >> "%LOGFILE%" 2>&1

echo Installing new version >> "%LOGFILE%"
pnputil -i -a "%DRIVERDIR%\snFilter.inf" >> "%LOGFILE%" 2>&1

echo Setting up driver auto-load >> "%LOGFILE%"
start /wait /b pnputil -i -a %~dp0\snFilter.inf >> "%~dp0\install.log" 2>&1
start /wait /b sc start snFilter >> "%~dp0\install.log" 2>&1

schtasks /delete /tn DriverInstallPart2 /f >> "%LOGFILE%" 2>&1