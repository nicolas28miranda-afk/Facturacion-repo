# Instrucciones de Despliegue en Tomcat Remoto

## Cambios Realizados

### 1. Backend (facturacion-back)
- ✅ Configurado `context-path: /facturacion-backend` en producción
- ✅ Actualizado CORS para permitir el mismo dominio del servidor
- ✅ Configurada ruta de logs por defecto para Linux (`/var/log/facturacion`)

### 2. Frontend (facturacion-cibercom)
- ✅ Actualizado `api.ts` para detectar automáticamente el context-path
- ✅ Configurado `vite.config.ts` con base path `/facturacion-backend/` para producción
- ✅ Las URLs del API ahora usan rutas relativas cuando están en el mismo servidor

### 3. Integración (Opción A)
- ✅ Scripts creados para copiar el build del frontend a `webapp/` del backend

## Pasos para Desplegar

### Paso 1: Compilar el Frontend
```bash
cd facturacion-cibercom
npm install  # Solo la primera vez
npm run build:prod
```

### Paso 2: Copiar Frontend al Backend
**Opción A - Usando npm script (recomendado):**
```bash
npm run build-and-copy
```

**Opción B - Manualmente:**
- **Windows (PowerShell):**
  ```powershell
  .\copy-frontend-to-backend.ps1
  ```

- **Linux/Mac:**
  ```bash
  chmod +x copy-frontend-to-backend.sh
  ./copy-frontend-to-backend.sh
  ```

Esto copiará todos los archivos de `dist/` a `facturacion-back/src/main/webapp/`

### Paso 3: Compilar el Backend
```bash
cd ../facturacion-back/facturacion-back
mvn clean package
```

El archivo WAR se generará en: `target/facturacion-backend-0.0.1-SNAPSHOT.war`

### Paso 4: Renombrar el WAR (Opcional)
Para que el context-path sea `/facturacion-backend`, puedes renombrar el WAR:
```bash
# Windows
ren target\facturacion-backend-0.0.1-SNAPSHOT.war facturacion-backend.war

# Linux/Mac
mv target/facturacion-backend-0.0.1-SNAPSHOT.war target/facturacion-backend.war
```

**Nota:** Si mantienes el nombre original, el context-path será `/facturacion-backend-0.0.1-SNAPSHOT`. Ajusta `application.yml` si es necesario.

### Paso 5: Subir a Tomcat

**⚠️ IMPORTANTE:** Si el archivo WAR es muy grande (>50MB), el Tomcat Manager puede rechazarlo con error "413 Request Entity Too Large". Usa uno de estos métodos alternativos:

#### Método 1: Subir directamente vía SFTP/SCP (Recomendado)
1. Conéctate al servidor usando SFTP/SCP (WinSCP, FileZilla, o línea de comandos)
2. Navega a la carpeta `webapps/` de Tomcat (ej: `/opt/tomcat/webapps/` o `/usr/local/tomcat/webapps/`)
3. Sube el archivo WAR directamente a esa carpeta
4. Tomcat detectará el archivo y lo desplegará automáticamente

**Ejemplo con SCP desde línea de comandos:**
```bash
scp target/facturacion-backend.war usuario@servidor:/ruta/tomcat/webapps/
```

#### Método 2: Usar el deployer de Tomcat vía línea de comandos
Si tienes acceso SSH al servidor:
```bash
# Conectarte al servidor
ssh usuario@servidor

# Navegar a la carpeta de Tomcat
cd /ruta/tomcat/bin

# Desplegar usando el deployer (reemplaza con tus valores)
./catalina.sh deploy -path /facturacion-backend -war /ruta/completa/al/archivo.war
```

#### Método 3: Aumentar límite en Nginx (Si tienes acceso)
Si Nginx está limitando el tamaño, edita la configuración de Nginx:
```nginx
# En /etc/nginx/nginx.conf o en el archivo de configuración del sitio
client_max_body_size 100M;  # Aumenta según el tamaño de tu WAR
```
Luego reinicia Nginx:
```bash
sudo systemctl restart nginx
```

#### Método 4: Usar Tomcat Manager vía API REST
```bash
curl -T facturacion-backend.war \
  "http://usuario:password@servidor:8080/manager/text/deploy?path=/facturacion-backend&update=true"
```

**Nota:** Después de subir el WAR, Tomcat lo desplegará automáticamente. Puedes monitorear el proceso en los logs de Tomcat.

### Paso 6: Verificar Configuración del Servidor

#### Variables de Entorno (Opcional)
Si necesitas cambiar la ruta de logs, puedes configurar la variable de entorno:
```bash
export LOGS_BASE_DIR=/var/log/facturacion
```

O editar `setenv.sh` (Linux) o `setenv.bat` (Windows) en la carpeta `bin/` de Tomcat:
```bash
export LOGS_BASE_DIR=/var/log/facturacion
```

#### Verificar Java
Asegúrate de que el servidor tenga Java 17 o superior:
```bash
java -version
```

#### Verificar Base de Datos
Confirma que la conexión a Oracle sea accesible desde el servidor:
- Host: `174.136.25.157:1521/XE`
- Usuario: `nick`
- La aplicación intentará conectarse al iniciar

### Paso 7: Acceder a la Aplicación
Una vez desplegado, accede a:
```
http://[IP_SERVIDOR]:8080/facturacion-backend/
```

## Configuración Importante

### Context Path
El context-path está configurado como `/facturacion-backend` en `application.yml` (perfil `prod`).

**Si cambias el nombre del WAR**, actualiza también el `context-path` en:
- `facturacion-back/src/main/resources/application.yml` (línea ~195)
- `facturacion-cibercom/vite.config.ts` (línea ~26)
- `facturacion-cibercom/services/api.ts` (línea ~33)

### CORS
El CORS está configurado para permitir:
- `http://174.136.25.157:8080` (mismo servidor)
- `http://localhost:8080` (desarrollo local)
- `http://localhost:5173` y `http://localhost:5174` (Vite dev server)

Si el frontend se sirve desde otro dominio, agrega la URL en:
- `facturacion-back/src/main/resources/application.yml` (línea ~198)

### Logs
Por defecto, los logs se guardan en `/var/log/facturacion/server.log` (Linux).

Para cambiar la ubicación, configura la variable de entorno `LOGS_BASE_DIR` o edita `application.yml`.

## Solución de Problemas

### Error 413 Request Entity Too Large al subir WAR
Este error ocurre cuando el archivo WAR es demasiado grande para el Tomcat Manager. **Solución:** Usa el Método 1 (SFTP/SCP) descrito en el Paso 5. Es la forma más confiable para archivos grandes.

### El frontend no carga
- Verifica que los archivos estén en `src/main/webapp/` del backend
- Verifica que el build se haya hecho con `npm run build:prod` (no solo `npm run build`)
- Revisa la consola del navegador para errores 404
- Verifica que el WAR incluya los archivos del frontend (debe tener más de 50MB si incluye todo)

### El API no responde
- Verifica que el context-path coincida entre `application.yml` y la URL del frontend
- Revisa los logs de Tomcat en `logs/catalina.out`
- Verifica que CORS esté configurado correctamente
- Asegúrate de que el WAR se haya desplegado correctamente (revisa `webapps/` en el servidor)

### Error de conexión a la base de datos
- Verifica que Oracle esté accesible desde el servidor
- Revisa las credenciales en `application.yml` (perfil `prod`)
- Verifica el firewall y la red

### El WAR no se despliega automáticamente
- Verifica los permisos del archivo WAR en el servidor
- Revisa los logs de Tomcat (`logs/catalina.out`) para ver errores
- Asegúrate de que Tomcat tenga permisos de escritura en `webapps/`
- Si el WAR tiene un nombre anterior, elimínalo primero antes de subir el nuevo

## Notas Adicionales

- El frontend detecta automáticamente si está en localhost o en producción
- Las URLs del API se construyen dinámicamente basándose en la URL actual
- El build de producción usa el base path `/facturacion-backend/` automáticamente
- Los certificados CSD deben estar en `src/main/resources/certificados/` para que se incluyan en el WAR
