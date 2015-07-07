
To star TURN server :

sudo turnserver -syslog -a -L 172.31.1.209 -X 54.92.2.154 -E 172.31.1.209 -f --min-port=32355 --max-port=65535 --user=ROVision_Broadcasting:1q3w2e4 -r realm --log-file=stdout -v &


To start application :

sudo node app &