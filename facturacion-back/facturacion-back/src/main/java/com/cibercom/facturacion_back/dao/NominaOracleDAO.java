package com.cibercom.facturacion_back.dao;

import com.cibercom.facturacion_back.dto.NominaSaveRequest;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;

@Repository
@Profile("oracle")
public class NominaOracleDAO {

    private final JdbcTemplate jdbcTemplate;
    private volatile String lastInsertError;

    public NominaOracleDAO(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Obtiene datos de nómina vinculados a una factura por su ID_FACTURA.
     * Devuelve un mapa tolerante a esquemas (solo incluye columnas existentes).
     */
    public java.util.Map<String, Object> buscarPorIdFactura(Long idFactura) {
        try {
            if (idFactura == null) return null;
            // Verificar columna FK
            if (!hasColumn("NOMINAS", "ID_FACTURA")) {
                return null;
            }

            // Detectar columnas disponibles de NOMINAS
            boolean hasIdEmpleado = hasColumn("NOMINAS", "ID_EMPLEADO");
            boolean hasFechaPago = hasColumn("NOMINAS", "FECHA_PAGO");
            boolean hasFechaNomina = hasColumn("NOMINAS", "FECHA_NOMINA");
            boolean hasRfcEmisor = hasColumn("NOMINAS", "RFC_EMISOR");
            boolean hasRfcReceptor = hasColumn("NOMINAS", "RFC_RECEPTOR");
            boolean hasNombre = hasColumn("NOMINAS", "NOMBRE");
            boolean hasCurp = hasColumn("NOMINAS", "CURP");
            boolean hasPeriodoPago = hasColumn("NOMINAS", "PERIODO_PAGO");
            boolean hasPercepciones = hasColumn("NOMINAS", "PERCEPCIONES");
            boolean hasDeducciones = hasColumn("NOMINAS", "DEDUCCIONES");
            boolean hasTipoNomina = hasColumn("NOMINAS", "TIPO_NOMINA");
            boolean hasUsoCfdi = hasColumn("NOMINAS", "USO_CFDI");
            boolean hasCorreo = hasColumn("NOMINAS", "CORREO_ELECTRONICO");

            StringBuilder sb = new StringBuilder();
            sb.append("SELECT ");
            if (hasIdEmpleado) sb.append("ID_EMPLEADO, ");
            if (hasNombre) sb.append("NOMBRE, ");
            if (hasCurp) sb.append("CURP, ");
            if (hasRfcEmisor) sb.append("RFC_EMISOR, ");
            if (hasRfcReceptor) sb.append("RFC_RECEPTOR, ");
            if (hasPeriodoPago) sb.append("PERIODO_PAGO, ");
            if (hasFechaPago) sb.append("FECHA_PAGO, ");
            if (hasFechaNomina) sb.append("FECHA_NOMINA, ");
            if (hasPercepciones) sb.append("PERCEPCIONES, ");
            if (hasDeducciones) sb.append("DEDUCCIONES, ");
            if (hasTipoNomina) sb.append("TIPO_NOMINA, ");
            if (hasUsoCfdi) sb.append("USO_CFDI, ");
            if (hasCorreo) sb.append("CORREO_ELECTRONICO, ");
            // quitar última coma si existe
            int lastComma = sb.lastIndexOf(", ");
            if (lastComma > 7) sb.delete(lastComma, lastComma + 2);
            sb.append(" FROM NOMINAS WHERE ID_FACTURA = ?");

            String sql = sb.toString();
            return jdbcTemplate.query(sql, new Object[]{idFactura}, rs -> {
                if (!rs.next()) return null;
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                try { if (hasIdEmpleado) map.put("idEmpleado", rs.getString("ID_EMPLEADO")); } catch (Exception ignore) {}
                try { if (hasNombre) map.put("nombre", rs.getString("NOMBRE")); } catch (Exception ignore) {}
                try { if (hasCurp) map.put("curp", rs.getString("CURP")); } catch (Exception ignore) {}
                try { if (hasRfcEmisor) map.put("rfcEmisor", rs.getString("RFC_EMISOR")); } catch (Exception ignore) {}
                try { if (hasRfcReceptor) map.put("rfcReceptor", rs.getString("RFC_RECEPTOR")); } catch (Exception ignore) {}
                try { if (hasPeriodoPago) map.put("periodoPago", rs.getString("PERIODO_PAGO")); } catch (Exception ignore) {}
                try { if (hasFechaPago) map.put("fechaPago", rs.getDate("FECHA_PAGO") != null ? rs.getDate("FECHA_PAGO").toLocalDate().toString() : ""); } catch (Exception ignore) {}
                try { if (hasFechaNomina) map.put("fechaNomina", rs.getDate("FECHA_NOMINA") != null ? rs.getDate("FECHA_NOMINA").toLocalDate().toString() : ""); } catch (Exception ignore) {}
                try { if (hasPercepciones) map.put("percepciones", rs.getBigDecimal("PERCEPCIONES")); } catch (Exception ignore) {}
                try { if (hasDeducciones) map.put("deducciones", rs.getBigDecimal("DEDUCCIONES")); } catch (Exception ignore) {}
                try { if (hasTipoNomina) map.put("tipoNomina", rs.getString("TIPO_NOMINA")); } catch (Exception ignore) {}
                try { if (hasUsoCfdi) map.put("usoCfdi", rs.getString("USO_CFDI")); } catch (Exception ignore) {}
                try { if (hasCorreo) map.put("correoElectronico", rs.getString("CORREO_ELECTRONICO")); } catch (Exception ignore) {}
                return map;
            });
        } catch (Exception e) {
            this.lastInsertError = e.getMessage();
            return null;
        }
    }

    public String getLastInsertError() { return lastInsertError; }

    public Long insertar(Long idFactura, NominaSaveRequest req) {
        lastInsertError = null;
        try {
            String sql = "INSERT INTO NOMINAS (\n" +
                    "  ID_FACTURA, ID_EMPLEADO, FECHA_NOMINA, RFC_EMISOR, RFC_RECEPTOR, NOMBRE, CURP, \n" +
                    "  PERIODO_PAGO, FECHA_PAGO, PERCEPCIONES, DEDUCCIONES, TIPO_NOMINA, USO_CFDI, CORREO_ELECTRONICO, USUARIO_CREACION\n" +
                    ") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

            KeyHolder kh = new GeneratedKeyHolder();
            int updated = jdbcTemplate.update(con -> {
                PreparedStatement ps = con.prepareStatement(sql, new String[]{"ID_FACTURA_NOMINA"});
                ps.setLong(1, idFactura);
                ps.setString(2, nullToEmpty(req.getIdEmpleado()));
                ps.setDate(3, parseDate(req.getFechaNomina()));
                ps.setString(4, trimOrNull(req.getRfcEmisor()));
                ps.setString(5, trimOrNull(req.getRfcReceptor()));
                ps.setString(6, nullToEmpty(req.getNombre()));
                ps.setString(7, nullToEmpty(req.getCurp()));
                ps.setString(8, nullToEmpty(req.getPeriodoPago()));
                ps.setDate(9, parseDate(req.getFechaPago()));
                ps.setBigDecimal(10, parseDecimal(req.getPercepciones()));
                ps.setBigDecimal(11, parseDecimal(req.getDeducciones()));
                ps.setString(12, nullToEmpty(req.getTipoNomina()));
                ps.setString(13, nullToEmpty(req.getUsoCfdi()));
                ps.setString(14, nullToEmpty(req.getCorreoElectronico()));
                ps.setString(15, nullToEmpty(req.getUsuarioCreacion()));
                return ps;
            }, kh);

            if (updated <= 0) return null;
            try {
                Number n = kh.getKey();
                return n != null ? n.longValue() : null;
            } catch (Exception ignore) {
                return null;
            }
        } catch (Exception e) {
            lastInsertError = e.getMessage();
            return null;
        }
    }

    /**
     * Consulta historial de nóminas por ID_EMPLEADO.
     * Devuelve ID de nómina, ID empleado, fecha (preferente FECHA_PAGO) y estado de la factura.
     */
    public java.util.List<com.cibercom.facturacion_back.dto.NominaHistorialDTO> buscarHistorialPorEmpleado(String idEmpleado) {
        return buscarHistorialPorEmpleado(idEmpleado, 25);
    }

    /**
     * Últimos recibos de nómina del trabajador desde NOMINAS (+ FACTURAS para UUID, estatus y total).
     */
    public java.util.List<com.cibercom.facturacion_back.dto.NominaHistorialDTO> buscarHistorialPorEmpleado(String idEmpleado, int limit) {
        if (idEmpleado == null || idEmpleado.isBlank()) {
            return java.util.List.of();
        }
        int maxRows = Math.min(Math.max(limit, 1), 100);

        String idCol = pickFirstAvailable("NOMINAS", "ID_FACTURA_NOMINA", "ID_NOMINA", "ID");
        boolean hasFechaPago = hasColumn("NOMINAS", "FECHA_PAGO");
        boolean hasFechaNomina = hasColumn("NOMINAS", "FECHA_NOMINA");
        boolean hasPercepciones = hasColumn("NOMINAS", "PERCEPCIONES");
        boolean hasDeducciones = hasColumn("NOMINAS", "DEDUCCIONES");
        boolean hasTipoNomina = hasColumn("NOMINAS", "TIPO_NOMINA");
        boolean joinOnFacturas = hasColumn("NOMINAS", "ID_FACTURA") && hasColumn("FACTURAS", "ID_FACTURA");
        String uuidCol = joinOnFacturas ? pickFirstAvailable("FACTURAS",
                "UUID", "FOLIO_FISCAL", "FOLIO_FISCAL_SAT", "UUID_CFDI", "FOLIO_FISCAL_UUID") : null;
        boolean hasTotalFactura = joinOnFacturas && hasColumn("FACTURAS", "TOTAL");
        boolean hasSerie = joinOnFacturas && hasColumn("FACTURAS", "SERIE");
        boolean hasFolio = joinOnFacturas && hasColumn("FACTURAS", "FOLIO");
        boolean hasEstadoDesc = joinOnFacturas && hasColumn("FACTURAS", "ESTADO_DESCRIPCION");
        boolean hasEstado = joinOnFacturas && hasColumn("FACTURAS", "ESTADO");
        boolean hasEstatusFactura = joinOnFacturas && hasColumn("FACTURAS", "ESTATUS_FACTURA");
        boolean hasTipoFactura = joinOnFacturas && hasColumn("FACTURAS", "TIPO_FACTURA");

        StringBuilder inner = new StringBuilder();
        inner.append("SELECT ");
        if (idCol != null) {
            inner.append("n.").append(idCol).append(" AS IDSEL, ");
        } else {
            inner.append("ROWNUM AS IDSEL, ");
        }
        inner.append("n.ID_EMPLEADO");
        if (hasFechaPago) inner.append(", n.FECHA_PAGO");
        if (hasFechaNomina) inner.append(", n.FECHA_NOMINA");
        if (hasPercepciones) inner.append(", n.PERCEPCIONES");
        if (hasDeducciones) inner.append(", n.DEDUCCIONES");
        if (hasTipoNomina) inner.append(", n.TIPO_NOMINA");
        if (uuidCol != null) inner.append(", f.").append(uuidCol).append(" AS UUIDSEL");
        if (hasTotalFactura) inner.append(", f.TOTAL AS TOTAL_FACTURA");
        if (hasSerie) inner.append(", f.SERIE");
        if (hasFolio) inner.append(", f.FOLIO");
        if (hasEstadoDesc) inner.append(", f.ESTADO_DESCRIPCION");
        if (hasEstado) inner.append(", f.ESTADO");
        if (hasEstatusFactura) inner.append(", f.ESTATUS_FACTURA");
        inner.append(" FROM NOMINAS n ");
        if (joinOnFacturas) {
            inner.append("LEFT JOIN FACTURAS f ON f.ID_FACTURA = n.ID_FACTURA ");
        }
        inner.append("WHERE n.ID_EMPLEADO = ? ");
        if (joinOnFacturas && hasTipoFactura) {
            inner.append("AND (f.TIPO_FACTURA IS NULL OR f.TIPO_FACTURA = 4) ");
        }
        if (hasFechaPago) {
            inner.append("ORDER BY n.FECHA_PAGO DESC NULLS LAST");
            if (hasFechaNomina) inner.append(", n.FECHA_NOMINA DESC NULLS LAST");
        } else if (hasFechaNomina) {
            inner.append("ORDER BY n.FECHA_NOMINA DESC NULLS LAST");
        } else if (idCol != null) {
            inner.append("ORDER BY n.").append(idCol).append(" DESC");
        }

        String sql = "SELECT * FROM (" + inner + ") WHERE ROWNUM <= ?";

        java.util.List<Object> params = new java.util.ArrayList<>();
        params.add(idEmpleado.trim());
        params.add(maxRows);

        return jdbcTemplate.query(sql, params.toArray(), (rs, rowNum) -> {
            com.cibercom.facturacion_back.dto.NominaHistorialDTO dto = new com.cibercom.facturacion_back.dto.NominaHistorialDTO();
            try {
                dto.setId(rs.getLong("IDSEL"));
            } catch (Exception ignore) {
                dto.setId((long) (rowNum + 1));
            }
            dto.setIdEmpleado(rs.getString("ID_EMPLEADO"));

            java.sql.Date fp = null;
            java.sql.Date fn = null;
            try {
                if (hasFechaPago) fp = rs.getDate("FECHA_PAGO");
            } catch (Exception ignore) {}
            try {
                if (hasFechaNomina) fn = rs.getDate("FECHA_NOMINA");
            } catch (Exception ignore) {}
            java.sql.Date fecha = fp != null ? fp : fn;
            dto.setFecha(fecha != null ? fecha.toLocalDate().toString() : "");

            try {
                if (hasPercepciones && rs.getBigDecimal("PERCEPCIONES") != null) {
                    dto.setPercepciones(rs.getBigDecimal("PERCEPCIONES").toPlainString());
                }
            } catch (Exception ignore) {}
            try {
                if (hasDeducciones && rs.getBigDecimal("DEDUCCIONES") != null) {
                    dto.setDeducciones(rs.getBigDecimal("DEDUCCIONES").toPlainString());
                }
            } catch (Exception ignore) {}
            try {
                if (hasTipoNomina) dto.setTipoNomina(rs.getString("TIPO_NOMINA"));
            } catch (Exception ignore) {}

            String estado = "";
            try {
                if (hasEstadoDesc) {
                    estado = rs.getString("ESTADO_DESCRIPCION");
                }
            } catch (Exception ignore) {}
            if (estado == null || estado.isBlank()) {
                try {
                    if (hasEstado) estado = rs.getString("ESTADO");
                } catch (Exception ignore) {}
            }
            if (estado == null || estado.isBlank()) {
                try {
                    if (hasEstatusFactura) {
                        int cod = rs.getInt("ESTATUS_FACTURA");
                        if (!rs.wasNull()) {
                            estado = switch (cod) {
                                case 0 -> "EMITIDA";
                                case 2 -> "CANCELADA";
                                default -> String.valueOf(cod);
                            };
                        }
                    }
                } catch (Exception ignore) {}
            }
            dto.setEstado(estado != null ? estado : "");

            try {
                String uuid = rs.getString("UUIDSEL");
                dto.setUuid(uuid != null ? uuid : "");
            } catch (Exception ignore) {
                dto.setUuid("");
            }

            String totalStr = "";
            try {
                if (hasTotalFactura && rs.getBigDecimal("TOTAL_FACTURA") != null) {
                    totalStr = rs.getBigDecimal("TOTAL_FACTURA").toPlainString();
                }
            } catch (Exception ignore) {}
            if (totalStr.isBlank() && dto.getPercepciones() != null && dto.getDeducciones() != null) {
                try {
                    java.math.BigDecimal p = new java.math.BigDecimal(dto.getPercepciones());
                    java.math.BigDecimal d = new java.math.BigDecimal(dto.getDeducciones());
                    totalStr = p.subtract(d).toPlainString();
                } catch (Exception ignore) {}
            }
            dto.setTotal(totalStr);

            String folioLabel = "";
            try {
                if (hasSerie && hasFolio) {
                    String serie = rs.getString("SERIE");
                    String folio = rs.getString("FOLIO");
                    if (serie != null && folio != null) {
                        folioLabel = serie + "-" + folio;
                    }
                }
            } catch (Exception ignore) {}
            dto.setFolio(folioLabel);

            return dto;
        });
    }

    private java.sql.Date parseDate(String s) {
        try {
            if (s == null || s.isBlank()) return null;
            java.time.LocalDate ld = java.time.LocalDate.parse(s);
            return java.sql.Date.valueOf(ld);
        } catch (Exception e) {
            return null; // dejar que DB maneje default/NULL si permitido
        }
    }

    private java.math.BigDecimal parseDecimal(String s) {
        try {
            if (s == null || s.isBlank()) return java.math.BigDecimal.ZERO;
            return new java.math.BigDecimal(s.trim());
        } catch (Exception e) {
            return java.math.BigDecimal.ZERO;
        }
    }

    private String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    /** Oracle convierte '' en NULL; devolver null solo si realmente no hay valor. */
    private String trimOrNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    private boolean hasColumn(String table, String column) {
        try {
            Integer cnt = jdbcTemplate.queryForObject(
                    "SELECT COUNT(1) FROM ALL_TAB_COLUMNS WHERE UPPER(TABLE_NAME)=? AND UPPER(COLUMN_NAME)=?",
                    Integer.class,
                    table.toUpperCase(),
                    column.toUpperCase()
            );
            return cnt != null && cnt > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private String pickFirstAvailable(String table, String... candidates) {
        for (String c : candidates) {
            if (hasColumn(table, c)) return c;
        }
        return null;
    }
}