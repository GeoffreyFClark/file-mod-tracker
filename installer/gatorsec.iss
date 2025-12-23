; GatorSec File Integrity Monitoring - Inno Setup Script
; This script creates an installer that:
; 1. Installs the GatorSec application
; 2. Installs the minifilter driver certificate and driver
; 3. Enables test signing mode (requires reboot)
; 4. Sets up post-reboot driver loading

#define MyAppName "GatorSec"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "GatorSec"
#define MyAppURL "https://github.com/GeoffreyFClark/file-mod-tracker"
#define MyAppExeName "GatorSec.exe"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=..\LICENSE
OutputDir=..\dist
OutputBaseFilename=GatorSec_Setup_{#MyAppVersion}
SetupIconFile=..\src-tauri\icons\icon.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
CloseApplications=force
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Messages]
FinishedLabel=Setup has finished installing [name] on your computer.%n%n[b]IMPORTANT:[/b] A system restart is required to complete the driver installation. The application will not function correctly until you restart.%n%nClick Finish to exit Setup.

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Main application
Source: "..\src-tauri\target\release\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

; Driver files
Source: "..\src-tauri\drivers\snFilter.sys"; DestDir: "{app}\drivers"; Flags: ignoreversion
Source: "..\src-tauri\drivers\snFilter.inf"; DestDir: "{app}\drivers"; Flags: ignoreversion
Source: "..\src-tauri\drivers\snFilter.cer"; DestDir: "{app}\drivers"; Flags: ignoreversion
Source: "..\src-tauri\drivers\snfilter.cat"; DestDir: "{app}\drivers"; Flags: ignoreversion

; Post-install scripts
Source: "post_install.cmd"; DestDir: "{app}"; Flags: ignoreversion deleteafterinstall
Source: "complete_driver_install.cmd"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
; Enable test signing - requires reboot
Filename: "bcdedit.exe"; Parameters: "-set TESTSIGNING ON"; Flags: runhidden waituntilterminated; StatusMsg: "Enabling test signing mode..."

; Install certificate
Filename: "certutil.exe"; Parameters: "-addstore -enterprise ""Root"" ""{app}\drivers\snFilter.cer"""; Flags: runhidden waituntilterminated; StatusMsg: "Installing driver certificate..."

; Schedule driver installation for after reboot
Filename: "schtasks.exe"; Parameters: "/create /tn ""GatorSecDriverInstall"" /tr ""\\""{app}\complete_driver_install.cmd\\"""" /sc ONLOGON /RL HIGHEST /RU ""{username}"" /IT /F"; Flags: runhidden waituntilterminated; StatusMsg: "Scheduling driver installation..."

[UninstallRun]
; Stop and remove the driver
Filename: "fltmc.exe"; Parameters: "unload snFilter"; Flags: runhidden; RunOnceId: "UnloadDriver"
Filename: "sc.exe"; Parameters: "stop snFilter"; Flags: runhidden; RunOnceId: "StopDriver"
Filename: "sc.exe"; Parameters: "delete snFilter"; Flags: runhidden; RunOnceId: "DeleteDriver"
Filename: "pnputil.exe"; Parameters: "/delete-driver ""{app}\drivers\snFilter.inf"" /uninstall"; Flags: runhidden; RunOnceId: "RemoveDriver"

; Remove scheduled task if it exists
Filename: "schtasks.exe"; Parameters: "/delete /tn ""GatorSecDriverInstall"" /f"; Flags: runhidden; RunOnceId: "RemoveTask"

[Code]
function NeedRestart(): Boolean;
begin
  Result := True;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Notify user about reboot requirement
    MsgBox('GatorSec has been installed successfully.' + #13#10 + #13#10 +
           'IMPORTANT: A system restart is required to complete the driver installation.' + #13#10 + #13#10 +
           'After restarting, the driver will be installed automatically and GatorSec will be ready to use.',
           mbInformation, MB_OK);
  end;
end;

function InitializeUninstall(): Boolean;
begin
  Result := True;
  // Warn user about uninstall
  if MsgBox('This will uninstall GatorSec and remove the minifilter driver.' + #13#10 + #13#10 +
            'Do you want to continue?', mbConfirmation, MB_YESNO) = IDNO then
    Result := False;
end;
