#!/usr/bin/env bash

# Usage:
# ./reset_config.sh

# Cambia la configuración del application.properties para poder resetear la base de datos y que genere de cero las tablas que necesite

cat ".reset_config.txt" > "./backend/src/main/resources/application.properties"