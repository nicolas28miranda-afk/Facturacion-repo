# 🏦 CDP - Cliente Data Processing Microservice

## 📋 Descripción del Repositorio

Este repositorio contiene el **Microservicio CDP (Cliente Data Processing)**, un sistema especializado en procesar y almacenar datos de clientes extraídos de constancias CFDI para crear un banco de datos optimizado para facturación.

## 🎯 Propósito del Microservicio

- **Procesamiento automático** de datos CFDI
- **Determinación automática** del tipo de persona (física/moral)
- **Almacenamiento estructurado** en base de datos Oracle
- **Banco de datos centralizado** para optimizar facturación
- **Reducción de tiempos** en captura de datos de clientes

## 🏗️ Arquitectura Técnica

### **Stack Tecnológico**
- **Java 17**
- **Spring Boot 2.7.18**
- **Spring Data JPA**
- **Oracle Database**
- **Maven 3.6+**
- **Lombok 1.18.28**

### **Estructura del Proyecto**
```
cib-ms-cdp/
├── src/main/java/com/cibercom/cdp/
│   ├── model/           # Entidades JPA
│   ├── dto/             # DTOs para comunicación
│   ├── repository/      # Repositorios JPA
│   ├── service/         # Lógica de negocio
│   ├── controller/      # Controladores REST
│   └── config/          # Configuración
├── database/            # Scripts SQL
├── src/main/resources/  # Configuración de aplicación
└── README.md           # Documentación completa
```

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Java 17+
- Maven 3.6+
- Oracle Database 11g+
- SQL Developer (opcional)

### **Configuración de Base de Datos**
1. Ejecutar el script: `database/CREATE_DATABASE_CDP_ADAPTED.sql`
2. Verificar la creación de tablas y datos de prueba

### **Configuración de la Aplicación**
```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@//DESKTOP-EI05NSQ:1521/xepdb1
    username: luisch
    password: adminroot1
```

### **Ejecución**
```bash
mvn clean install
mvn spring-boot:run
```

## 📡 API Endpoints

### **Procesar Factura CFDI**
```http
POST /api/cdp/procesar-factura
Content-Type: application/json
```

### **Buscar Cliente**
```http
GET /api/cdp/cliente/{rfc}
```

### **Listar Clientes**
```http
GET /api/cdp/clientes
```

### **Health Check**
```http
GET /api/cdp/health
```

## 🗄️ Modelo de Datos

### **Tablas Principales**
- **CLIENTES**: Información básica del cliente
- **PERSONAS_FISICAS**: Datos específicos de personas físicas
- **PERSONAS_MORALES**: Datos específicos de personas morales
- **DOMICILIOS**: Información de ubicación
- **REGIMENES_FISCALES_CLIENTE**: Regímenes fiscales múltiples

### **Relaciones**
- Un cliente puede ser persona física O persona moral
- Un cliente puede tener múltiples domicilios
- Un cliente puede tener múltiples regímenes fiscales

## 🔧 Configuración para Desarrollo

### **Variables de Entorno**
```bash
export SPRING_PROFILES_ACTIVE=dev
export DB_HOST=localhost
export DB_PORT=1521
export DB_SID=xepdb1
export DB_USERNAME=luisch
export DB_PASSWORD=adminroot1
```

### **Configuración de IDE**
- **IntelliJ IDEA**: Importar como proyecto Maven
- **Eclipse**: Importar como proyecto Maven existente
- **VS Code**: Abrir carpeta del proyecto

## 📊 Monitoreo y Logs

### **Logs de Aplicación**
- Nivel de logging configurable en `application.yml`
- Logs estructurados con SLF4J
- Rotación automática de logs

### **Health Checks**
- Endpoint de salud: `/api/cdp/health`
- Verificación de conectividad a base de datos
- Estado de la aplicación

## 🔒 Seguridad

### **Configuración CORS**
- Orígenes permitidos configurados
- Métodos HTTP permitidos
- Headers permitidos

### **Validación de Datos**
- Validación de RFC
- Validación de email
- Validación de códigos postales

## 🧪 Testing

### **Ejecutar Tests**
```bash
mvn test
```

### **Tests de Integración**
```bash
mvn verify
```

## 📈 Métricas y Rendimiento

### **Optimizaciones**
- Índices de base de datos optimizados
- Consultas JPA eficientes
- Caché de regímenes fiscales

### **Monitoreo**
- Métricas de Spring Boot Actuator
- Logs de rendimiento
- Trazabilidad de transacciones

## 🚀 Deployment

### **JAR Ejecutable**
```bash
mvn clean package
java -jar target/cib-ms-cdp-0.0.1-SNAPSHOT.jar
```

### **Docker (Opcional)**
```dockerfile
FROM openjdk:17-jre-slim
COPY target/cib-ms-cdp-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

## 📚 Documentación Adicional

- **README.md**: Documentación completa del microservicio
- **API Documentation**: Endpoints y ejemplos de uso
- **Database Schema**: Estructura de base de datos
- **Configuration Guide**: Guía de configuración

## 🤝 Contribución

### **Estándares de Código**
- Código limpio y documentado
- Tests unitarios obligatorios
- Validación de datos de entrada
- Manejo de errores robusto

### **Proceso de Desarrollo**
1. Fork del repositorio
2. Crear rama de feature
3. Implementar cambios
4. Ejecutar tests
5. Crear pull request

## 📞 Soporte

Para soporte técnico o consultas sobre el microservicio CDP, contactar al equipo de desarrollo.

---

**© 2024 Cibercom - Microservicio CDP**
