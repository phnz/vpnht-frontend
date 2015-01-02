# Linux OpenVPN

## 1
### Install OpenVPN

Open the terminal and login as root and run the following command:

`apt-get install openvpn`

***

## 2
### Download configuration file

[OpenVPN config](/openvpn/config)

Once you have the config file, move it to `/etc/openvpn/vpnht.ovpn`

***

## 3
### Run OpenVPN

Now run openvpn as root:

`openvpn /etc/openvpn/vpnht.ovpn`

Enter your credentials and you should be connected
