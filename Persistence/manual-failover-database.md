1- Change the published route itself
Go to:
Cloudflare Zero Trust → Networks → Tunnels → motich-web-server → Published application routes
Click api.motich.com to open its configuration.
Look for the following fields:
Field Expected value
Subdomain api
Domain motich.com
Path Empty or \*
Service type HTTP
Service URL localhost:5005

Change Service URL localhost:5003 to Service URL localhost:5005

2- Change the reverse proxy port on the Apache
go to "C:\wamp64\bin\apache\apache2.4.62.1\conf\extra" on MOTHVFIL01
open httpd-ssl.conf then look for ServerName api.motich.com virtual host reverse proxy
change both http://127.0.0.1:5003/ to http://127.0.0.1:5005/
restart apache
