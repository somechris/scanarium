#!/bin/bash

# rm ~/ssh-cp-192.168.0.105-22-christian  && ssh -Y 192.168.0.105 echo
# rsync --archive --delete ~/sources/quelltextlich/scanarium/ 192.168.0.105:~/scanarium && ssh -Y 192.168.0.105 ~/scanarium/run.sh


cd "$(dirname "$0")"

export DISPLAY=:0

echo "display: $DISPLAY"

python3 backend/scan.py

#./show-source.py
#./run-demo-server.sh

#ls -l images/2020-09-10__14-43-51.jpg

#DISPLAY=:0 display images/2020-09-10__14-43-51-scanned.jpg

#Masking über: inkscape --export-id=Mask --export-id-only --export-area-page --export-background=black --export-png=ui/SimpleRocket.png SimpleRocket.svg
#Zum Einrichten: DISPLAY=:0  mplayer tv:// -tv driver=v4l2:width=768:height=576:device=/dev/video4:outfmt=mjpeg
