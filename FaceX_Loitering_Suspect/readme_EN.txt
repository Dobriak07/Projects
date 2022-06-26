1. Copy folder "node_modules" to "C:\Program Files (x86)\ISS\SecurOS\node.js"
2. In SecurOS create NodeJS Script
3. Copy all from "main_v2.js" to the SecurOS script
4. IP and port calculated from "Computer" and "FaceX Server" objects. DNS computer name can be sometime a problem, to resolve it - put a valid IP address in "Computer" object settings.

Other variables:
 "SUSPECT_LIST" - name of the list, where persons will be added for watch
 "SCAMMERS_LIST" - name of the list, where confirmed suspects will be moved from suspects list ater reaching "detectionCount" parameter
 "matchThreshold" - for face mask detection lower values higly recommended. Default "0.5"
 "monitoringTime" - how long person will be in suspects list until removed if "detectionCount" not reached
 "watchdog" - how often start function to check the time of last suspect detection. Do not set too low value. Default "10 seconds"
 "detectionCount" - how much suspect must be detected until moved to "SCAMMERS_LIST"

Default log path - "C:\ProgramData\ISS\logs\modules\Suspect". 
Log level, file size and log rotation can be changed in "Logger section"