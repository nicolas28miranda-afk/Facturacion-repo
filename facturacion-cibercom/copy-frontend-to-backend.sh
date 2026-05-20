#!/bin/bash
# Script bash para copiar el build del frontend al backend
# Uso: ./copy-frontend-to-backend.sh

set -e

echo "========================================="
echo "Copiando frontend al backend..."
echo "========================================="

# Rutas
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIST="$SCRIPT_DIR/dist"
BACKEND_WEBAPP="$SCRIPT_DIR/../facturacion-back/facturacion-back/src/main/webapp"

# Verificar que existe el directorio dist
if [ ! -d "$FRONTEND_DIST" ]; then
    echo "ERROR: No se encontró el directorio 'dist'. Ejecuta 'npm run build' primero."
    exit 1
fi

# Verificar que existe el directorio webapp
if [ ! -d "$BACKEND_WEBAPP" ]; then
    echo "Creando directorio webapp..."
    mkdir -p "$BACKEND_WEBAPP"
fi

# Limpiar contenido anterior (excepto WEB-INF)
echo "Limpiando contenido anterior en webapp (excepto WEB-INF)..."
find "$BACKEND_WEBAPP" -mindepth 1 -maxdepth 1 ! -name "WEB-INF" -exec rm -rf {} +

# Copiar archivos del frontend
echo "Copiando archivos de $FRONTEND_DIST a $BACKEND_WEBAPP..."
cp -r "$FRONTEND_DIST"/* "$BACKEND_WEBAPP/"

echo "========================================="
echo "¡Frontend copiado exitosamente!"
echo "========================================="
echo ""
echo "Siguiente paso: Compila el backend con 'mvn clean package' en la carpeta facturacion-back"
