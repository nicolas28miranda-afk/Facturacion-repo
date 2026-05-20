package com.cibercom.facturacion_back.service;

import com.cibercom.facturacion_back.dto.EmpleadoConsultaDTO;
import com.cibercom.facturacion_back.dto.EmpleadoSaveRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Catálogo EMPLEADOS (trabajadores). Usado por nóminas; no confundir con USUARIOS (operadores del sistema).
 */
@Service
public class EmpleadoService {

    private static final Logger log = LoggerFactory.getLogger(EmpleadoService.class);

    private static final String SELECT_EMPLEADO = """
            SELECT e.ID_EMPLEADO,
                   e.NO_EMPLEADO,
                   e.NO_EMPLEADO AS NO_USUARIO,
                   TRIM(e.NOMBRE || ' ' || e.APELLIDO_PATERNO || ' ' || NVL(e.APELLIDO_MATERNO, '')) AS NOMBRE_EMPLEADO,
                   e.CORREO_ELECTRONICO AS CORREO,
                   e.TELEFONO,
                   e.CODIGO_POSTAL,
                   e.NUM_SEGURIDAD_SOCIAL,
                   e.SALARIO_DIARIO_INTEGRADO,
                   e.PERIODICIDAD_PAGO,
                   CASE WHEN e.ESTATUS_EMPLEADO IN ('ACTIVO', 'A') THEN 'ACTIVO' ELSE 'INACTIVO' END AS ESTATUS_USUARIO,
                   e.FECHA_INGRESO AS FECHA_ALTA,
                   e.SALARIO_BASE,
                   e.RFC,
                   e.CURP,
                   e.NOMBRE,
                   e.APELLIDO_PATERNO,
                   e.APELLIDO_MATERNO
            FROM EMPLEADOS e
            """;

    private final JdbcTemplate jdbcTemplate;

    public EmpleadoService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<EmpleadoConsultaDTO> listarActivos() {
        String sql = SELECT_EMPLEADO + " WHERE e.ESTATUS_EMPLEADO IN ('ACTIVO', 'A') ORDER BY NOMBRE_EMPLEADO";
        return jdbcTemplate.query(sql, new EmpleadoCatalogoRowMapper());
    }

    /**
     * Busca por ID_EMPLEADO numérico, NO_EMPLEADO o RFC (coincidencia exacta, sin distinguir mayúsculas en texto).
     */
    public Optional<EmpleadoConsultaDTO> buscarParaNomina(String criterio) {
        if (criterio == null || criterio.trim().isEmpty()) {
            return Optional.empty();
        }
        String t = criterio.trim();
        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE e.ESTATUS_EMPLEADO IN ('ACTIVO', 'A') AND (");

        // Códigos como "0001" son NO_EMPLEADO, no PK; si es numérico, buscar por ID y por código exacto
        boolean numeric = t.matches("\\d+");
        if (numeric) {
            where.append("(e.ID_EMPLEADO = ? OR UPPER(e.NO_EMPLEADO) = UPPER(?))");
            params.add(Long.parseLong(t));
            params.add(t);
        } else {
            where.append("UPPER(e.NO_EMPLEADO) = UPPER(?) OR UPPER(e.RFC) = UPPER(?)");
            params.add(t);
            params.add(t);
        }
        where.append(")");

        String sql = SELECT_EMPLEADO + where;
        log.info("Buscar empleado nómina: criterio={}", t);
        List<EmpleadoConsultaDTO> rows = jdbcTemplate.query(sql, params.toArray(), new EmpleadoCatalogoRowMapper());
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public Optional<EmpleadoConsultaDTO> buscarPorIdEmpleado(long idEmpleado) {
        String sql = SELECT_EMPLEADO + " WHERE e.ID_EMPLEADO = ?";
        List<EmpleadoConsultaDTO> rows = jdbcTemplate.query(sql, new Object[]{idEmpleado}, new EmpleadoCatalogoRowMapper());
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public Optional<EmpleadoConsultaDTO> buscarPorRfc(String rfc) {
        if (rfc == null || rfc.trim().isEmpty()) {
            return Optional.empty();
        }
        return buscarParaNomina(rfc.trim());
    }

    /**
     * Resuelve si el trabajador ya está en EMPLEADOS (por ID, código o RFC).
     */
    public Optional<EmpleadoConsultaDTO> resolverEnCatalogo(String idEmpleado, String rfc) {
        if (idEmpleado != null && !idEmpleado.isBlank()) {
            Optional<EmpleadoConsultaDTO> porId = buscarParaNomina(idEmpleado.trim());
            if (porId.isPresent()) {
                return porId;
            }
        }
        if (rfc != null && !rfc.trim().isEmpty()) {
            return buscarPorRfc(rfc.trim());
        }
        return Optional.empty();
    }

    /**
     * Registra un trabajador nuevo en EMPLEADOS.
     */
    public EmpleadoConsultaDTO guardar(EmpleadoSaveRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Datos de empleado requeridos");
        }
        String rfc = safeUpper(req.getRfc());
        if (rfc == null || rfc.length() < 12) {
            throw new IllegalArgumentException("RFC del trabajador es obligatorio (12 o 13 caracteres)");
        }
        String nombre = safeTrim(req.getNombre());
        if (nombre == null || nombre.isEmpty()) {
            throw new IllegalArgumentException("Nombre del trabajador es obligatorio");
        }
        String paternoRaw = safeTrim(req.getApellidoPaterno());
        final String paterno = (paternoRaw == null || paternoRaw.isEmpty()) ? "." : paternoRaw;

        String noEmpleadoRaw = safeTrim(req.getNoEmpleado());
        if (noEmpleadoRaw == null || noEmpleadoRaw.isEmpty()) {
            throw new IllegalArgumentException("No. Empleado (NO_EMPLEADO) es obligatorio");
        }
        final String noEmpleado = noEmpleadoRaw;

        if (buscarParaNomina(noEmpleado).isPresent()) {
            throw new IllegalArgumentException("Ya existe un empleado con el código: " + noEmpleado);
        }
        if (buscarPorRfc(rfc).isPresent()) {
            throw new IllegalArgumentException("Ya existe un empleado con el RFC: " + rfc);
        }

        String sql = """
                INSERT INTO EMPLEADOS (
                    NO_EMPLEADO, RFC, CURP, NOMBRE, APELLIDO_PATERNO, APELLIDO_MATERNO,
                    CORREO_ELECTRONICO, TELEFONO, CODIGO_POSTAL, NUM_SEGURIDAD_SOCIAL,
                    SALARIO_DIARIO_INTEGRADO, PERIODICIDAD_PAGO, SALARIO_BASE, FECHA_INGRESO,
                    ESTATUS_EMPLEADO
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO')
                """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        try {
            jdbcTemplate.update(con -> {
                PreparedStatement ps = con.prepareStatement(sql, new String[]{"ID_EMPLEADO"});
                int i = 1;
                ps.setString(i++, noEmpleado);
                ps.setString(i++, rfc);
                ps.setString(i++, safeUpper(req.getCurp()));
                ps.setString(i++, nombre);
                ps.setString(i++, paterno);
                ps.setString(i++, safeTrim(req.getApellidoMaterno()));
                ps.setString(i++, safeTrim(req.getCorreoElectronico()));
                ps.setString(i++, safeTrim(req.getTelefono()));
                ps.setString(i++, safeTrim(req.getCodigoPostal()));
                ps.setString(i++, safeTrim(req.getNumSeguridadSocial()));
                ps.setBigDecimal(i++, parseDecimal(req.getSalarioDiarioIntegrado()));
                ps.setString(i++, normalizePeriodicidad(req.getPeriodicidadPago()));
                ps.setBigDecimal(i++, parseDecimal(req.getSalarioBase()));
                ps.setDate(i, parseDate(req.getFechaIngreso()));
                return ps;
            }, keyHolder);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("No se pudo guardar el empleado: " + e.getMostSpecificCause().getMessage(), e);
        }

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Empleado insertado pero no se obtuvo ID_EMPLEADO");
        }
        log.info("Empleado guardado en EMPLEADOS: id={}, rfc={}, noEmpleado={}", key.longValue(), rfc, noEmpleado);
        return buscarPorIdEmpleado(key.longValue())
                .orElseThrow(() -> new IllegalStateException("Empleado guardado pero no encontrado al consultar"));
    }

    private static String safeTrim(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String safeUpper(String s) {
        String t = safeTrim(s);
        return t != null ? t.toUpperCase() : null;
    }

    private static BigDecimal parseDecimal(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return new BigDecimal(s.replace(",", "").trim()).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            return null;
        }
    }

    private static java.sql.Date parseDate(String s) {
        if (s == null || s.isBlank()) {
            return java.sql.Date.valueOf(LocalDate.now());
        }
        try {
            return java.sql.Date.valueOf(LocalDate.parse(s.trim()));
        } catch (Exception e) {
            return java.sql.Date.valueOf(LocalDate.now());
        }
    }

    private static String normalizePeriodicidad(String p) {
        String t = safeTrim(p);
        if (t == null) return "QUINCENAL";
        String u = t.toUpperCase();
        if ("MENSUAL".equals(u) || "QUINCENAL".equals(u) || "SEMANAL".equals(u)
                || "CATORCENAL".equals(u) || "BIMESTRAL".equals(u)) {
            return u;
        }
        return "QUINCENAL";
    }

    static class EmpleadoCatalogoRowMapper implements RowMapper<EmpleadoConsultaDTO> {
        @Override
        public EmpleadoConsultaDTO mapRow(ResultSet rs, int rowNum) throws SQLException {
            EmpleadoConsultaDTO dto = new EmpleadoConsultaDTO();
            dto.setIdEmpleado(rs.getObject("ID_EMPLEADO", Integer.class));
            String noEmp = rs.getString("NO_EMPLEADO");
            dto.setNoEmpleado(noEmp);
            dto.setNoUsuario(noEmp);
            dto.setNombreEmpleado(rs.getString("NOMBRE_EMPLEADO"));
            dto.setNombre(rs.getString("NOMBRE_EMPLEADO"));
            dto.setCorreo(rs.getString("CORREO"));
            dto.setTelefono(rs.getString("TELEFONO"));
            dto.setCodigoPostal(rs.getString("CODIGO_POSTAL"));
            dto.setNumSeguridadSocial(rs.getString("NUM_SEGURIDAD_SOCIAL"));
            dto.setSalarioDiarioIntegrado(rs.getBigDecimal("SALARIO_DIARIO_INTEGRADO"));
            dto.setPeriodicidadPago(rs.getString("PERIODICIDAD_PAGO"));
            dto.setEstatusUsuario(rs.getString("ESTATUS_USUARIO"));
            Timestamp fechaAlta = rs.getTimestamp("FECHA_ALTA");
            dto.setFechaAlta(fechaAlta);
            dto.setSalarioBase(rs.getBigDecimal("SALARIO_BASE"));
            dto.setRfc(rs.getString("RFC"));
            dto.setCurp(rs.getString("CURP"));
            dto.setNombre(rs.getString("NOMBRE"));
            dto.setApellidoPaterno(rs.getString("APELLIDO_PATERNO"));
            dto.setApellidoMaterno(rs.getString("APELLIDO_MATERNO"));
            return dto;
        }
    }
}
