# Desplegar Facturación + cib-ms-cdp con Docker

## Qué incluye

| Parte | Qué es |
|-------|--------|
| **facturacion** | Pantalla web + API principal (puerto interno) |
| **cdp** | Microservicio `cib-ms-cdp` (PAC / clientes CFDI) |
| **gateway** | Une todo en un solo puerto **8080** |

El navegador usa una sola dirección:

- App: `http://TU_IP:8080/facturacion-backend/`
- CDP: `http://TU_IP:8080/cib-ms-cdp/api` (lo llama el front solo)

## Antes de empezar: copiar cib-ms-cdp

El repo de facturación **necesita** la carpeta del otro proyecto al lado:

```text
FacturacionCibercom/
  cib-ms-cdp/
    cib-ms-cdp/    ← código Java (pom.xml, src, ...)
  facturacion-back/
  facturacion-cibercom/
  docker-compose.yml
```

Copia desde tu PC, por ejemplo:

`RECURSOS Y ARCHIVOS SIF\cib-ms-cdp` → `FacturacionCibercom\cib-ms-cdp`

## En el servidor AWS

```bash
cd ~/FacturacionCibercom
cp .env.example .env
nano .env
# Importante: SPRING_PROFILES_ACTIVE=docker,oracle (no uses solo prod en Docker)
docker compose up -d --build
```

Abre: **http://TU_IP:8080/facturacion-backend/**

Puerto **8080** abierto en el grupo de seguridad de EC2.

## Comandos útiles

```bash
docker compose ps
docker compose logs -f
docker compose logs -f cdp
docker compose down
```
