# PID (Process ID)
To display the PID associating each file change with its originating process, a file system minifilter driver will be utilized.

### To install and run fsfilter-rs:
1. Clone the repository ```git clone https://github.com/SubconsciousCompute/fsfilter-rs```
2. Modify [wchar_t; 12] to [wchar_t; 24] in src/shared_def.rs at lines 110, 179, and 350.
3. Navigate to fsfilter-rs directory ```cd fsfilter-rs``` and run ```cargo build --release```
4. Download https://github.com/SubconsciousCompute/fsfilter-rs/releases/latest/download/snFilter.zip and extract.
5. Install the security certificate ```sfFilter.cer``` and change the default settings to Local Machine + place all certificates in the store: ```Trusted Root Certification Authorities```.
6. Install snFiltern.inf
7. Run ```Bcdedit.exe -set TESTSIGNING ON```
8. Restart computer.
9. Start the minifilter with ```sc start snFilter```. You can verify that it successfully started with the command ```Fltmc.exe``` to display running minifilters and checking if snFilter is listed.
10. Now you can navigate to the fsfilter-rs directory and run ```cargo run --bin minifilter --release```

You can find the driver at C:\Windows\System32\drivers\snFilter.sys
