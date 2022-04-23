1. Copy folder "node_modules" to "C:\Program Files (x86)\ISS\SecurOS\node.js"
2. In SecurOS create NodeJS Script
3. Copy all from "main_v2.js" to the SecurOS script
4. Correct "IP" constant if FaceX Server presented on different server

Other variables:
 "suspectListName" - name of the list, where persons will be added for watch
 "matchThreshold" - for face mask detection lower values higly recommended
 "monitoringTime" - how long person will be in suspects list, until deleted
 "watchdog" - how often start fucntion to check the time of last suspect detection. Do not set too low values

Default log path - "C:\ProgramData\ISS\logs\modules\Suspect". 
Log level, file size and log rotation can be changed in "Logger section"