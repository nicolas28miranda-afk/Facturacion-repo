-- MENU_CONFIG: Operación como sección propia + pantalla; Operación (admin) bajo Administración (solo pantalla).
-- La pestaña "Administración" debe existir ya (MENU_PATH NULL). Cambia 1 por tu ID_PERFIL.

-- 1) Pestaña principal "Operación" (sección sola: MENU_PATH NULL)
INSERT INTO MENU_CONFIG (ID_CONFIG, ID_PERFIL, MENU_LABEL, MENU_PATH)
SELECT (SELECT NVL(MAX(m.ID_CONFIG), 0) + 1 FROM MENU_CONFIG m),
       1,
       'Operación',
       NULL
  FROM DUAL;

-- 2) Pantalla dentro de Operación
INSERT INTO MENU_CONFIG (ID_CONFIG, ID_PERFIL, MENU_LABEL, MENU_PATH)
SELECT (SELECT NVL(MAX(m.ID_CONFIG), 0) + 1 FROM MENU_CONFIG m),
       1,
       'Operación',
       'operacion'
  FROM DUAL;

-- 3) Pantalla dentro de Administración (modal pestaña "Administración" en ConfiguracionMenusPage)
INSERT INTO MENU_CONFIG (ID_CONFIG, ID_PERFIL, MENU_LABEL, MENU_PATH)
SELECT (SELECT NVL(MAX(m.ID_CONFIG), 0) + 1 FROM MENU_CONFIG m),
       1,
       'Operación (admin)',
       'operacion-admin'
  FROM DUAL;

COMMIT;
