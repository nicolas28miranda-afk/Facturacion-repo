# Solución: Error 413 Request Entity Too Large

## Problema
Al intentar subir el archivo WAR a través del Tomcat Manager, recibes el error:
```
413 Request Entity Too Large
```

Esto ocurre porque el archivo WAR es demasiado grande para ser subido a través de la interfaz web (generalmente hay un límite de 50MB en Nginx o Tomcat Manager).

## Solución Recomendada: Subir vía SFTP/SCP

### Paso 1: Obtener credenciales de acceso
Necesitas:
- Dirección IP o hostname del servidor
- Usuario y contraseña (o clave SSH)
- Ruta donde está instalado Tomcat (comúnmente `/opt/tomcat` o `/usr/local/tomcat`)

### Paso 2: Conectarte al servidor

**Opción A - Usando WinSCP (Windows):**
1. Descarga e instala WinSCP: https://winscp.net/
2. Abre WinSCP y crea una nueva conexión:
   - Protocolo: SFTP
   - Host: `redcibercom.cloud` (o la IP del servidor)
   - Usuario: (tu usuario)
   - Contraseña: (tu contraseña)
3. Conéctate al servidor

**Opción B - Usando FileZilla (Multiplataforma):**
1. Descarga FileZilla: https://filezilla-project.org/
2. Archivo → Gestor de sitios → Nuevo sitio
3. Configura:
   - Protocolo: SFTP
   - Host: `redcibercom.cloud`
   - Usuario y contraseña
4. Conéctate

**Opción C - Línea de comandos (Linux/Mac/Git Bash):**
```bash
scp target/facturacion-backend.war usuario@redcibercom.cloud:/ruta/tomcat/webapps/
```

### Paso 3: Localizar la carpeta webapps
Una vez conectado, navega a la carpeta `webapps` de Tomcat. Las ubicaciones comunes son:
- `/opt/tomcat/webapps/`
- `/usr/local/tomcat/webapps/`
- `/var/lib/tomcat9/webapps/` (Ubuntu/Debian)
- `C:\Program Files\Apache Software Foundation\Tomcat X.X\webapps\` (Windows)

### Paso 4: Subir el archivo WAR
1. **Elimina la versión anterior** (si existe):
   - Elimina la carpeta `facturacion-backend/` o `facturacion-backend-0.0.1-SNAPSHOT/`
   - Elimina el WAR anterior si existe

2. **Sube el nuevo WAR:**
   - Arrastra el archivo `facturacion-backend.war` desde tu máquina local
   - Suéltalo en la carpeta `webapps/` del servidor

3. **Tomcat detectará automáticamente** el nuevo archivo y comenzará a desplegarlo

### Paso 5: Verificar el despliegue
1. **Revisa los logs de Tomcat:**
   ```bash
   tail -f /ruta/tomcat/logs/catalina.out
   ```
   
2. **O accede al Tomcat Manager:**
   - Ve a: `http://redcibercom.cloud/manager/html`
   - Busca tu aplicación en la lista
   - Debe aparecer como "Running"

3. **Accede a la aplicación:**
   - URL: `http://redcibercom.cloud/facturacion-backend/`

## Alternativa: Usar SSH y comandos

Si tienes acceso SSH completo:

```bash
# 1. Conectarte al servidor
ssh usuario@redcibercom.cloud

# 2. Navegar a webapps
cd /ruta/tomcat/webapps

# 3. Eliminar versión anterior (si existe)
rm -rf facturacion-backend/
rm -f facturacion-backend*.war

# 4. Desde tu máquina local, subir el WAR
# (En otra terminal, desde tu máquina local)
scp target/facturacion-backend.war usuario@redcibercom.cloud:/ruta/tomcat/webapps/

# 5. Verificar logs
tail -f /ruta/tomcat/logs/catalina.out
```

## Notas Importantes

- **No subas el WAR mientras la aplicación está corriendo**: Primero detén la aplicación desde el Tomcat Manager o elimina la carpeta desplegada
- **El despliegue puede tardar varios minutos** si el WAR es grande
- **Verifica los permisos**: El usuario de Tomcat debe tener permisos de lectura en el WAR
- **Si el despliegue falla**: Revisa los logs en `logs/catalina.out` para ver el error específico

## Si no tienes acceso SFTP/SSH

Si no tienes acceso directo al servidor, contacta al administrador del servidor para que:
1. Aumente el límite en Nginx (`client_max_body_size` en la configuración)
2. O suba el WAR manualmente por ti
