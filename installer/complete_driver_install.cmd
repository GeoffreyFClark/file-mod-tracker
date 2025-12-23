@echo off
:: GatorSec Driver Installation Script
:: This script runs after reboot to complete driver installation

set LOGFILE=%~dp0driver_install.log
set DRIVERDIR=%~dp0drivers

echo ============================================ >> "%LOGFILE%"
echo GatorSec Driver Installation >> "%LOGFILE%"
echo Started at: %date% %time% >> "%LOGFILE%"
echo ============================================ >> "%LOGFILE%"

:: Check if running as admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script requires administrator privileges >> "%LOGFILE%"
    echo Please run as administrator >> "%LOGFILE%"
    exit /b 1
)

:: Remove old driver version if exists
echo Checking for existing driver... >> "%LOGFILE%"
fltmc unload snFilter >> "%LOGFILE%" 2>&1
sc stop snFilter >> "%LOGFILE%" 2>&1
sc delete snFilter >> "%LOGFILE%" 2>&1

:: Install driver using pnputil
echo Installing driver with pnputil... >> "%LOGFILE%"
pnputil -i -a "%DRIVERDIR%\snFilter.inf" >> "%LOGFILE%" 2>&1
if %errorlevel% neq 0 (
    echo WARNING: pnputil returned error code %errorlevel% >> "%LOGFILE%"
)

:: Load the minifilter driver
echo Loading minifilter driver... >> "%LOGFILE%"
fltmc load snFilter >> "%LOGFILE%" 2>&1
if %errorlevel% neq 0 (
    echo WARNING: fltmc load returned error code %errorlevel% >> "%LOGFILE%"
    echo Attempting to start service directly... >> "%LOGFILE%"
    sc start snFilter >> "%LOGFILE%" 2>&1
)

:: Verify driver is loaded
echo Verifying driver status... >> "%LOGFILE%"
fltmc filters | findstr /i snFilter >> "%LOGFILE%" 2>&1
if %errorlevel% equ 0 (
    echo SUCCESS: snFilter driver is loaded and running >> "%LOGFILE%"
) else (
    echo WARNING: Driver may not be loaded correctly >> "%LOGFILE%"
)

:: Remove the scheduled task (self-cleanup)
echo Removing scheduled task... >> "%LOGFILE%"
schtasks /delete /tn "GatorSecDriverInstall" /f >> "%LOGFILE%" 2>&1

echo ============================================ >> "%LOGFILE%"
echo Installation completed at: %date% %time% >> "%LOGFILE%"
echo ============================================ >> "%LOGFILE%"

exit /b 0
