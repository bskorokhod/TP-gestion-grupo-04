# Ingress

This is a simple ingress reverse proxy.

## Main tools used

- [nginx](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

## To run

This should only be run as part of the docker-compose.
It dispatches requests to different servers depending on the request url and
the rules in [nginx.conf](./nginx.conf)
