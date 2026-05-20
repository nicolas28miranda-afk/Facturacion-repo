# Certificados CSD (timbrado)

Los archivos `.cer` y `.key` **no se suben a Git** (son secretos).

En el servidor AWS, copia aquí tus archivos con el **mismo nombre** que en `application.yml`, por ejemplo:

- `CSD_Sucursal_1_IVD920810GU2_20230518_062554.cer`
- `CSD_Sucursal_1_IVD920810GU2_20230518_062554.key`

Luego en `.env` define la contraseña de la llave:

```env
FACTURACION_CSD_LLAVE_PASSWORD=tu_contraseña
```

Reinicia: `docker compose up -d`
