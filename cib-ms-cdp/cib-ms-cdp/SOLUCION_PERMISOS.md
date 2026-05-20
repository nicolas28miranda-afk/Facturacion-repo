# Solución: Errores de Permisos en el WAR

## 🔍 Problema Identificado

Los logs muestran:
```
java.io.FileNotFoundException: /opt/tomcat/webapps/cib-ms-cdp-0.0.1-SNAPSHOT.war (Permission denied)
```

Aunque el despliegue terminó, hubo errores de permisos que impidieron que Spring Boot iniciara correctamente.

## ✅ SOLUCIÓN: Corregir Permisos y Redesplegar

### Paso 1: Verificar Permisos Actuales

```bash
# Ver permisos del WAR
ls -la /opt/tomcat/webapps/cib-ms-cdp-0.0.1-SNAPSHOT.war

# Ver qué usuario ejecuta Tomcat
ps aux | grep tomcat | grep -v grep
```

### Paso 2: Corregir Permisos

```bash
# El usuario que ejecuta Tomcat es 'tomcat'
# Corregir permisos del WAR
chown tomcat:tomcat /opt/tomcat/webapps/cib-ms-cdp-0.0.1-SNAPSHOT.war
chmod 644 /opt/tomcat/webapps/cib-ms-cdp-0.0.1-SNAPSHOT.war

# Verificar que se corrigieron
ls -la /opt/tomcat/webapps/cib-ms-cdp-0.0.1-SNAPSHOT.war
```

### Paso 3: Limpiar y Redesplegar

```bash
# Detener Tomcat
systemctl stop tomcat

# Eliminar el directorio desplegado anterior (puede tener problemas)
rm -rf /opt/tomcat/webapps/cib-ms-cdp-0.0.1-SNAPSHOT

# Limpiar work y temp
rm -rf /opt/tomcat/work/Catalina/localhost/cib-ms-cdp-0.0.1-SNAPSHOT
rm -rf /opt/tomcat/temp/*

# Verificar permisos nuevamente
ls -la /opt/tomcat/webapps/cib-ms-cdp-0.0.1-SNAPSHOT.war

# Iniciar Tomcat
systemctl start tomcat

# Ver logs en tiempo real (espera 30-60 segundos para que despliegue)
tail -f /opt/tomcat/logs/catalina.out
```

### Paso 4: Verificar que Spring Boot Inició

```bash
# Buscar mensaje de inicio de Spring Boot
grep -i "Started CdpApplication\|Application startup" /opt/tomcat/logs/catalina.out | tail -5

# Si no aparece, buscar errores
grep -i "error\|exception\|failed" /opt/tomcat/logs/catalina.out | tail -20
```

### Paso 5: Probar el Endpoint

```bash
# Probar health check
curl http://localhost:8080/cib-ms-cdp-0.0.1-SNAPSHOT/api/cdp/health

# Debería responder: "CDP Microservice is running"
```

## 🔧 Comandos Completos (Copiar y Pegar)

```bash
# 1. Verificar usuario de Tomcat
ps aux | grep tomcat | grep -v grep

# 2. Corregir permisos
chown tomcat:tomcat /opt/tomcat/webapps/cib-ms-cdp-0.0.1-SNAPSHOT.war
chmod 644 /opt/tomcat/webapps/cib-ms-cdp-0.0.1-SNAPSHOT.war

# 3. Detener Tomcat
systemctl stop tomcat

# 4. Limpiar
rm -rf /opt/tomcat/webapps/cib-ms-cdp-0.0.1-SNAPSHOT
rm -rf /opt/tomcat/work/Catalina/localhost/cib-ms-cdp-0.0.1-SNAPSHOT
rm -rf /opt/tomcat/temp/*

# 5. Verificar permisos
ls -la /opt/tomcat/webapps/cib-ms-cdp-0.0.1-SNAPSHOT.war

# 6. Iniciar Tomcat
systemctl start tomcat

# 7. Ver logs (espera 30-60 segundos)
tail -f /opt/tomcat/logs/catalina.out
```

## 📋 Qué Buscar en los Logs

**✅ Despliegue exitoso:**
```
Deployment of web application archive [/opt/tomcat/webapps/cib-ms-cdp-0.0.1-SNAPSHOT.war] has finished
```

**✅ Spring Boot iniciado:**
```
Started CdpApplication in X.XXX seconds
```

**❌ Si ves errores:**
- `Permission denied` → Permisos incorrectos
- `Cannot create datasource` → Problema de BD
- `ClassNotFoundException` → Dependencia faltante

## 🆘 Si Aún No Funciona

### Verificar que no hay más errores de permisos:

```bash
# Ver todos los errores recientes
grep -i "permission\|denied" /opt/tomcat/logs/catalina.out | tail -10

# Verificar permisos del directorio webapps
ls -la /opt/tomcat/webapps/ | grep cib-ms-cdp
```

### Verificar configuración de base de datos:

```bash
# Ver si hay errores de conexión a BD
grep -i "datasource\|connection\|oracle\|CIBCDP" /opt/tomcat/logs/catalina.out | grep -i "error\|exception" | tail -10

# Probar conexión manual
sqlplus CIBCDP/cibcdp@XE
```




