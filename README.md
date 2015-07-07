
To star TURN server :

sudo turnserver -syslog -a -L 'Amazon EC2 private IPs' -X 'Amazon EC2 public IPs' -E 'Amazon EC2 private IPs' -f --min-port=32355 --max-port=65535 --user=ROVision_Broadcasting:1q3w2e4 -r realm --log-file=stdout -v &


see : http://blog.knoldus.com/2013/10/24/configure-turn-server-for-webrtc-on-amazon-ec2/

To start application :

sudo node app &