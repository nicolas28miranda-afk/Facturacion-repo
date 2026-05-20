# Construye la app completa (front + back) y la deja en Tomcat.
# No hace falta instalar Node ni Maven en el servidor: solo Docker.

# --- 1) Compilar el frontend ---
FROM node:20-alpine AS frontend
WORKDIR /app
COPY facturacion-cibercom/package.json facturacion-cibercom/package-lock.json* ./
RUN npm ci
COPY facturacion-cibercom/ ./
RUN npm run build:prod

# --- 2) Compilar el backend (WAR con el front dentro) ---
FROM maven:3.9-eclipse-temurin-17 AS backend
WORKDIR /app
COPY facturacion-back/facturacion-back/pom.xml ./
COPY facturacion-back/facturacion-back/src ./src
RUN rm -rf ./src/main/webapp/assets ./src/main/webapp/index.html 2>/dev/null || true
COPY --from=frontend /app/dist/ ./src/main/webapp/
RUN mvn clean package -DskipTests

# --- 3) Servidor Tomcat con la app ---
FROM tomcat:10.1-jdk17-temurin
RUN rm -rf /usr/local/tomcat/webapps/*
# ROOT.war: Tomcat en / y Spring usa context-path /facturacion-backend (application.yml prod)
COPY --from=backend /app/target/facturacion-backend-*.war /usr/local/tomcat/webapps/ROOT.war
EXPOSE 8080
