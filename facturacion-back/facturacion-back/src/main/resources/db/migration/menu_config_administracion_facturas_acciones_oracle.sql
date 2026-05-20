-- =============================================================================
-- MENU_CONFIG: Administración (solo 3 pantallas visibles)
--   - Empleados              (admin-empleados)
--   - Operación (admin)      (operacion-admin)
--   - Administrar facturas   (admin-facturas-acciones)  <-- NUEVA
--
-- Idempotente: se puede ejecutar varias veces.
-- Ajuste ID_PERFIL si en su BD los perfiles no son 2 (Jefe) y 3 (Administrador).
-- Esquema por defecto del proyecto: NICK (cambie si aplica).
-- =============================================================================

-- Opcional: USE NICK;

-- -----------------------------------------------------------------------------
-- 1) INSERT: pantalla "Administrar facturas – acciones" en perfiles con pestaña Administración
-- -----------------------------------------------------------------------------
INSERT INTO MENU_CONFIG (
    ID_CONFIG, ID_PERFIL, MENU_LABEL, MENU_PATH, IS_VISIBLE, ORDEN, USUARIO_CREACION
)
SELECT
    MENU_CONFIG_SEQ.NEXTVAL,
    p.ID_PERFIL,
    'Administrar facturas – acciones',
    'admin-facturas-acciones',
    1,
    3,
    'admin'
FROM (
    SELECT DISTINCT mc.ID_PERFIL
      FROM MENU_CONFIG mc
     WHERE mc.MENU_LABEL = 'Administración'
       AND mc.MENU_PATH IS NULL
) p
WHERE NOT EXISTS (
    SELECT 1
      FROM MENU_CONFIG x
     WHERE x.ID_PERFIL = p.ID_PERFIL
       AND x.MENU_PATH = 'admin-facturas-acciones'
);

-- Mismo INSERT explícito para perfiles 2 y 3 (por si no tienen fila de pestaña aún)
INSERT INTO MENU_CONFIG (
    ID_CONFIG, ID_PERFIL, MENU_LABEL, MENU_PATH, IS_VISIBLE, ORDEN, USUARIO_CREACION
)
SELECT MENU_CONFIG_SEQ.NEXTVAL, p.ID_PERFIL, 'Administrar facturas – acciones', 'admin-facturas-acciones', 1, 3, 'admin'
  FROM (SELECT 2 AS ID_PERFIL FROM DUAL UNION ALL SELECT 3 FROM DUAL) p
 WHERE NOT EXISTS (
       SELECT 1 FROM MENU_CONFIG x
        WHERE x.ID_PERFIL = p.ID_PERFIL AND x.MENU_PATH = 'admin-facturas-acciones'
 );

-- -----------------------------------------------------------------------------
-- 2) Ocultar pantallas de Administración que ya no deben mostrarse en el menú
-- -----------------------------------------------------------------------------
UPDATE MENU_CONFIG
   SET IS_VISIBLE = 0,
       USUARIO_MODIFICACION = 'admin',
       FECHA_MODIFICACION = SYSDATE
 WHERE MENU_PATH IN (
       'admin-tiendas',
       'admin-periodos-perfil',
       'admin-periodos-plataforma',
       'admin-kioscos',
       'admin-excepciones',
       'admin-secciones'
   )
   AND ID_PERFIL IN (
       SELECT DISTINCT mc.ID_PERFIL
         FROM MENU_CONFIG mc
        WHERE mc.MENU_LABEL = 'Administración'
          AND mc.MENU_PATH IS NULL
   );

-- Perfiles 2 y 3 (refuerzo)
UPDATE MENU_CONFIG
   SET IS_VISIBLE = 0,
       USUARIO_MODIFICACION = 'admin',
       FECHA_MODIFICACION = SYSDATE
 WHERE MENU_PATH IN (
       'admin-tiendas',
       'admin-periodos-perfil',
       'admin-periodos-plataforma',
       'admin-kioscos',
       'admin-excepciones',
       'admin-secciones'
   )
   AND ID_PERFIL IN (2, 3);

-- -----------------------------------------------------------------------------
-- 3) Dejar visibles y ordenadas solo las 3 pantallas de Administración
-- -----------------------------------------------------------------------------
UPDATE MENU_CONFIG
   SET IS_VISIBLE = 1,
       ORDEN = CASE MENU_PATH
           WHEN 'admin-empleados' THEN 1
           WHEN 'operacion-admin' THEN 2
           WHEN 'admin-facturas-acciones' THEN 3
           ELSE ORDEN
       END,
       USUARIO_MODIFICACION = 'admin',
       FECHA_MODIFICACION = SYSDATE
 WHERE MENU_PATH IN ('admin-empleados', 'operacion-admin', 'admin-facturas-acciones')
   AND ID_PERFIL IN (
       SELECT DISTINCT mc.ID_PERFIL
         FROM MENU_CONFIG mc
        WHERE mc.MENU_LABEL = 'Administración'
          AND mc.MENU_PATH IS NULL
   );

UPDATE MENU_CONFIG
   SET IS_VISIBLE = 1,
       ORDEN = CASE MENU_PATH
           WHEN 'admin-empleados' THEN 1
           WHEN 'operacion-admin' THEN 2
           WHEN 'admin-facturas-acciones' THEN 3
           ELSE ORDEN
       END,
       USUARIO_MODIFICACION = 'admin',
       FECHA_MODIFICACION = SYSDATE
 WHERE MENU_PATH IN ('admin-empleados', 'operacion-admin', 'admin-facturas-acciones')
   AND ID_PERFIL IN (2, 3);

-- -----------------------------------------------------------------------------
-- 4) Verificación (opcional)
-- -----------------------------------------------------------------------------
-- SELECT ID_PERFIL, MENU_LABEL, MENU_PATH, IS_VISIBLE, ORDEN
--   FROM MENU_CONFIG
--  WHERE MENU_PATH LIKE 'admin-%' OR MENU_PATH = 'operacion-admin'
--  ORDER BY ID_PERFIL, ORDEN;

COMMIT;
