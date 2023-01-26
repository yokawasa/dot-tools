#!/bin/sh


echo "remove all stopped containers"
docker container prune

echo "remove unused volume"
docker volume prune

echo "remove unused images"
docker image prune -a

echo "remove unused network"
docker network prune

# echo remove unsed containers, image, network, volume
# docker system prune --volumes
# 
# https://docs.docker.com/engine/reference/commandline/container_prune/
# https://docs.docker.com/engine/reference/commandline/volume_prune/
# https://docs.docker.com/engine/reference/commandline/image_prune/
# https://docs.docker.com/engine/reference/commandline/network_prune/
# https://docs.docker.com/engine/reference/commandline/system_prune/
