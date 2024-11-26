@echo off
set LOGFILE=%~dp0\install.log
set DRIVERDIR=%~dp0

echo Turn on test-signing >> "%LOGFILE%"
bcdedit -set TESTSIGNING ON >> "%LOGFILE%" 2>&1

echo Setting up Part 2 to run after restart >> "%LOGFILE%"
schtasks /create /tn DriverInstallPart2 /tr "\"%DRIVERDIR%\installpart2.cmd\"" /sc ONLOGON /RL HIGHEST /RU "%USERNAME%" /IT >> "%LOGFILE%" 2>&1