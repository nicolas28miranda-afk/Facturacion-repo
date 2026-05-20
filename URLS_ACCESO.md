# URLs de Acceso a la Aplicación

## Configuración Actual

- **Servidor:** `72.62.128.98:8080`
- **Context-path configurado:** `/facturacion-backend`
- **Nombre del WAR generado:** `facturacion-backend-0.0.1-SNAPSHOT.war`

## ⚠️ IMPORTANTE: Problema de Desajuste

Hay un **desajuste** entre el nombre del WAR y el context-path configurado:

- Si subes el WAR con el nombre `facturacion-backend-0.0.1-SNAPSHOT.war`, Tomcat lo desplegará automáticamente con el context-path: `/facturacion-backend-0.0.1-SNAPSHOT`
- Pero tu `application.yml` está configurado para usar: `/facturacion-backend`

Esto causará que la aplicación no funcione correctamente.

## Soluciones y URLs de Acceso

### Opción 1: Renombrar el WAR (Recomendado)

**Acción:** Renombra el WAR a `facturacion-backend.war` antes de subirlo.

**URLs de acceso:**
- **Frontend (aplicación completa):** `http://72.62.128.98:8080/facturacion-backend/`
- **API directamente:** `http://72.62.128.98:8080/facturacion-backend/api/...`

**Ventajas:**
- ✅ Coincide con la configuración de `application.yml`
- ✅ URL más limpia y fácil de recordar
- ✅ El frontend ya está configurado para este path

### Opción 2: Mantener el nombre original del WAR

**Acción:** Deja el WAR como `facturacion-backend-0.0.1-SNAPSHOT.war`

**URLs de acceso:**
- **Frontend (aplicación completa):** `http://72.62.128.98:8080/facturacion-backend-0.0.1-SNAPSHOT/`
- **API directamente:** `http://72.62.128.98:8080/facturacion-backend-0.0.1-SNAPSHOT/api/...`

**Desventajas:**
- ❌ URL muy larga y difícil de recordar
- ❌ No coincide con la configuración de `application.yml` (necesitarías actualizar el context-path)
- ❌ El frontend está configurado para `/facturacion-backend`, no funcionará correctamente

### Opción 3: Configurar context-path en Tomcat (Avanzado)

**Acción:** Configurar el context-path manualmente en Tomcat usando un archivo `context.xml`

**URLs de acceso:**
- Dependerá de cómo lo configures, pero podrías usar: `http://72.62.128.98:8080/facturacion-backend/`

**Requisitos:**
- Acceso a la configuración de Tomcat
- Crear archivo `META-INF/context.xml` en el WAR o configurar en `conf/Catalina/localhost/`

## Recomendación: Opción 1

**Pasos:**
1. Compila el backend: `mvn clean package`
2. Renombra el WAR: `facturacion-backend-0.0.1-SNAPSHOT.war` → `facturacion-backend.war`
3. Sube el WAR renombrado al servidor
4. Accede a: `http://72.62.128.98:8080/facturacion-backend/`

## URLs Alternativas de Acceso

### Si hay un dominio configurado

Si el servidor tiene un dominio apuntando a la IP (ej: `facturacion.cibercom.com`), podrías acceder con:

- `http://facturacion.cibercom.com:8080/facturacion-backend/`
- O si hay un proxy reverso (Nginx/Apache) en el puerto 80: `http://facturacion.cibercom.com/facturacion-backend/`

### Si hay un proxy reverso (Nginx/Apache)

Si hay un servidor web (Nginx/Apache) como proxy delante de Tomcat, la URL podría ser:

- `http://72.62.128.98/facturacion-backend/` (sin el puerto 8080)
- O con dominio: `http://dominio.com/facturacion-backend/`

### Acceso directo al API

Independientemente del context-path, siempre puedes acceder directamente al API:

- `http://72.62.128.98:8080/[context-path]/api/...`

Ejemplos:
- Si context-path es `/facturacion-backend`: `http://72.62.128.98:8080/facturacion-backend/api/usuarios`
- Si context-path es `/facturacion-backend-0.0.1-SNAPSHOT`: `http://72.62.128.98:8080/facturacion-backend-0.0.1-SNAPSHOT/api/usuarios`

## Verificar el Context-Path Real

Para verificar qué context-path está usando realmente tu aplicación:

1. **Revisa el Tomcat Manager:**
   - Accede a: `http://72.62.128.98:8080/manager/html`
   - Busca tu aplicación en la lista
   - El "Path" que aparece es el context-path real

2. **Revisa los logs de Tomcat:**
   - Busca en `logs/catalina.out` mensajes como: "Deploying web application archive" o "Context path"

3. **Prueba accediendo:**
   - Intenta: `http://72.62.128.98:8080/facturacion-backend/`
   - Si no funciona, prueba: `http://72.62.128.98:8080/facturacion-backend-0.0.1-SNAPSHOT/`

## Resumen de URLs Probables

Basado en tu configuración actual, estas son las URLs más probables:

| Escenario | URL de Acceso |
|-----------|---------------|
| **WAR renombrado a `facturacion-backend.war`** | `http://72.62.128.98:8080/facturacion-backend/` |
| **WAR con nombre original** | `http://72.62.128.98:8080/facturacion-backend-0.0.1-SNAPSHOT/` |
| **Con dominio (si existe)** | `http://[dominio]:8080/facturacion-backend/` |
| **Con proxy reverso (puerto 80)** | `http://72.62.128.98/facturacion-backend/` |

## Nota Final

**La mejor práctica es renombrar el WAR a `facturacion-backend.war`** para que todo coincida con tu configuración y el frontend funcione correctamente.
