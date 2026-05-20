-- Corrige pestaña "Facturación" -> "Emisión" + "Cancelación" (sidebar usa constants.ts)
-- Ejecutar por perfil 1, 2 y 3. Luego COMMIT y volver a iniciar sesión.

UPDATE MENU_CONFIG
   SET MENU_LABEL = 'Emisión',
       USUARIO_MODIFICACION = 'admin',
       FECHA_MODIFICACION = SYSDATE
 WHERE MENU_PATH IS NULL
   AND MENU_LABEL = 'Facturación'
   AND ID_PERFIL IN (1, 2, 3);

INSERT INTO MENU_CONFIG (ID_CONFIG, ID_PERFIL, MENU_LABEL, MENU_PATH, IS_VISIBLE, ORDEN, USUARIO_CREACION)
SELECT MENU_CONFIG_SEQ.NEXTVAL, p.ID_PERFIL, 'Cancelación', NULL, 1,
       (SELECT NVL(MAX(m.ORDEN), 0) + 1
          FROM MENU_CONFIG m
         WHERE m.ID_PERFIL = p.ID_PERFIL
           AND m.MENU_PATH IS NULL),
       'admin'
  FROM (SELECT 1 AS ID_PERFIL FROM DUAL UNION ALL SELECT 2 FROM DUAL UNION ALL SELECT 3 FROM DUAL) p
 WHERE NOT EXISTS (
       SELECT 1 FROM MENU_CONFIG m
        WHERE m.ID_PERFIL = p.ID_PERFIL
          AND m.MENU_PATH IS NULL
          AND m.MENU_LABEL = 'Cancelación'
 );

COMMIT;
