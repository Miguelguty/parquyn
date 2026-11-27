#!/usr/bin/env bash
# Despliega "Mi calendario" (sitio estático React + Vite) en el devserver con Docker.
# Ejecutar como root dentro del devserver:  bash deploy-calendario.sh
# Es re-ejecutable: si ya existe, hace git pull, vuelve a construir y publica.
#
# No hace falta tener Node en el servidor: el sitio se construye dentro de un contenedor de Node.
#
# Dos formas de publicarlo:
#  1) Por defecto: un contenedor nginx en el puerto PORT (como Parquyn):  http://IP:8089/
#  2) Si ya tienes una carpeta "legacy" que la web sirve, copia el sitio ahí (no levanta nginx):
#       LEGACY_DIR=/ruta/de/legacy bash deploy-calendario.sh
#     y queda en  <LEGACY_DIR>/calendario/index.html
#
# Variables opcionales: BRANCH, PORT, APP_DIR, REPO_URL, NODE_IMAGE, LEGACY_DIR.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Miguelguty/parquyn.git}"
BRANCH="${BRANCH:-ccr-f550b3df-dqncno}"
APP_DIR="${APP_DIR:-/opt/calendario}"
PORT="${PORT:-8089}"
LEGACY_DIR="${LEGACY_DIR:-}"
NODE_IMAGE="${NODE_IMAGE:-node:22-slim}"

command -v docker >/dev/null || { echo "ERROR: docker no está instalado"; exit 1; }
command -v git >/dev/null || { apt-get update -y && apt-get install -y git; }
if [ -z "$LEGACY_DIR" ]; then
  docker compose version >/dev/null 2>&1 || { echo "ERROR: falta el plugin 'docker compose'"; exit 1; }
fi
case "$APP_DIR" in /*) ;; *) echo "ERROR: APP_DIR debe ser una ruta absoluta"; exit 1 ;; esac

mkdir -p "$APP_DIR"
cd "$APP_DIR"

# 1) Código
if [ -d src/.git ]; then
  echo ">> Actualizando código (rama $BRANCH)..."
  git -C src fetch origin "$BRANCH"
  git -C src checkout "$BRANCH"
  git -C src pull --ff-only origin "$BRANCH"
else
  # Puerto libre solo en la primera instalación (y solo si se usa nginx)
  if [ -z "$LEGACY_DIR" ] && ss -ltn | awk '{print $4}' | grep -q ":${PORT}\$"; then
    echo "ERROR: el puerto ${PORT} ya está en uso. Usa otro: PORT=8090 bash deploy-calendario.sh"
    exit 1
  fi
  echo ">> Clonando repo (rama $BRANCH)..."
  git clone -b "$BRANCH" "$REPO_URL" src
fi

# 2) Construir el sitio dentro de un contenedor de Node (npm ci usa el package-lock.json)
echo ">> Construyendo el sitio..."
docker run --rm -v "$APP_DIR/src/calendario:/app" -w /app "$NODE_IMAGE" sh -c "npm ci && npm run build"
[ -f src/calendario/dist/index.html ] || { echo "ERROR: la construcción no generó dist/index.html"; exit 1; }

# 3) Publicar
IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [ -n "$LEGACY_DIR" ]; then
  [ -d "$LEGACY_DIR" ] || { echo "ERROR: no existe LEGACY_DIR=$LEGACY_DIR"; exit 1; }
  DEST="$LEGACY_DIR/calendario"
  mkdir -p "$DEST"
  rm -rf "$DEST/assets"   # solo los archivos con nombre cambiante de este sitio
  cp -r src/calendario/dist/. "$DEST/"
  echo
  echo "Listo. Copiado a: $DEST"
  ls -1 "$DEST"
  echo "Ábrelo en: .../legacy/calendario/index.html"
else
  cat > docker-compose.yml <<EOF
services:
  web:
    image: nginx:alpine
    container_name: calendario-web
    restart: unless-stopped
    ports:
      - "${PORT}:80"
    volumes:
      - ./src/calendario/dist:/usr/share/nginx/html:ro
EOF
  docker compose up -d
  echo
  echo "Listo. Prueba: curl -sI http://127.0.0.1:${PORT}/ | head -1"
  echo "Desde la LAN/Tailscale: http://${IP:-IP-DEL-DEVSERVER}:${PORT}/"
fi
echo
echo "Aviso: lo que cargues en la app se guarda en el navegador de cada dispositivo y de cada dirección web."
