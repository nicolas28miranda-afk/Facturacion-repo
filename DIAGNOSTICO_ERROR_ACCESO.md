# Diagnóstico: No se puede acceder al sitio

## Posibles Causas

### 1. El WAR no se desplegó correctamente
**Síntoma:** Error 404 o "No se puede acceder a este sitio"

**Verificar:**
- Accede al Tomcat Manager: `http://72.62.128.98:8080/manager/html`
- Busca `facturacion-backend` en la lista de aplicaciones
- Verifica el estado:
  - ✅ **Running** = Está funcionando (pero puede haber otro problema)
  - ❌ **Failed** = Falló al desplegar (revisa logs)
  - ❌ **Stopped** = Está detenida (iníciala desde el manager)

### 2. La aplicación falló al iniciar
**Síntoma:** Error 500 o página en blanco

**Causas comunes:**
- Error de conexión a la base de datos Oracle
- Error de configuración en `application.yml`
- Falta alguna dependencia o certificado
- Error de permisos

**Verificar:**
- Revisa los logs de Tomcat: `logs/catalina.out`
- Busca errores como:
  - "Failed to initialize"
  - "Connection refused" (base de datos)
  - "ClassNotFoundException"
  - "Caused by:"

### 3. El context-path no coincide
**Síntoma:** Error 404 específico

**Verificar:**
- Intenta acceder directamente al API: `http://72.62.128.98:8080/facturacion-backend/api/`
- Si funciona el API pero no el frontend, el problema es con los archivos estáticos
- Si no funciona nada, el context-path puede estar mal

### 4. Problema de firewall o red
**Síntoma:** "No se puede acceder a este sitio" o timeout

**Verificar:**
- ¿Puedes acceder al Tomcat Manager? (`http://72.62.128.98:8080/manager/html`)
- Si no puedes acceder al manager, el problema es de red/firewall
- Si puedes acceder al manager pero no a la app, el problema es de la aplicación

### 5. El frontend no se incluyó en el WAR
**Síntoma:** La página carga pero está en blanco o muestra solo el API

**Verificar:**
- Verifica que el WAR incluya los archivos del frontend
- Debería tener más de 100MB si incluye todo
- Revisa dentro del WAR (o en `webapps/facturacion-backend/`) que existan archivos como `index.html`

## Pasos de Diagnóstico

### Paso 1: Verificar Tomcat Manager
1. Accede a: `http://72.62.128.98:8080/manager/html`
2. Busca `facturacion-backend` en la lista
3. Anota el estado (Running, Failed, Stopped)

### Paso 2: Revisar Logs
Si tienes acceso SSH al servidor:
```bash
# Ver los últimos logs
tail -n 100 /ruta/tomcat/logs/catalina.out

# O buscar errores específicos
grep -i error /ruta/tomcat/logs/catalina.out | tail -20
```

Si no tienes SSH, descarga el archivo `catalina.out` desde el servidor.

### Paso 3: Verificar el Despliegue
En el servidor, verifica:
```bash
# Ver si existe la carpeta desplegada
ls -la /ruta/tomcat/webapps/facturacion-backend/

# Ver si hay archivos del frontend
ls -la /ruta/tomcat/webapps/facturacion-backend/index.html
```

### Paso 4: Probar el API directamente
Intenta acceder a un endpoint del API:
- `http://72.62.128.98:8080/facturacion-backend/api/`
- Si responde (aunque sea un error 401/403), la aplicación está corriendo
- Si da 404, el context-path está mal

## Errores Comunes y Soluciones

### Error: "Connection refused" o "ORA-12541"
**Causa:** No puede conectar a Oracle
**Solución:** 
- Verifica que Oracle esté accesible desde el servidor
- Verifica la IP y puerto en `application.yml` (debe ser `174.136.25.157:1521`)
- Verifica firewall entre servidores

### Error: "Context path does not exist"
**Causa:** El context-path no coincide
**Solución:**
- Verifica que el WAR se llame exactamente `facturacion-backend.war`
- Elimina cualquier carpeta anterior desplegada

### Error: "Failed to start application"
**Causa:** Error al iniciar Spring Boot
**Solución:**
- Revisa los logs completos para ver el error específico
- Verifica que todas las dependencias estén incluidas en el WAR

### Error: Página en blanco o solo texto
**Causa:** El frontend no se incluyó o no se sirve correctamente
**Solución:**
- Verifica que copiaste el frontend a `src/main/webapp/` antes de compilar
- Recompila el WAR con el frontend incluido

## Información Necesaria para Diagnosticar

Para ayudarte mejor, necesito saber:

1. **¿Qué error exacto ves?**
   - "No se puede acceder a este sitio"
   - Error 404
   - Error 500
   - Página en blanco
   - Otro (describe)

2. **¿Puedes acceder al Tomcat Manager?**
   - Sí / No

3. **¿Qué estado muestra la aplicación en el Tomcat Manager?**
   - Running
   - Failed
   - Stopped
   - No aparece

4. **¿Puedes ver los logs de Tomcat?**
   - Si sí, ¿qué errores aparecen?

5. **¿El WAR incluye el frontend?**
   - ¿Tiene más de 100MB?
   - ¿Copiaste el frontend antes de compilar?
