package com.cibercom.facturacion_back.service;

import com.cibercom.facturacion_back.dto.AdminFacturasAccionesResponse;
import com.cibercom.facturacion_back.dto.AdminFacturasAccionesResponse.ComprobanteAdminItem;
import com.cibercom.facturacion_back.dto.AdminFacturasAccionesResponse.ResumenUsuarioItem;
import com.cibercom.facturacion_back.dto.AdminFacturasAccionesResponse.UsuarioCatalogoItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminFacturasAccionesService {

    private static final Logger logger = LoggerFactory.getLogger(AdminFacturasAccionesService.class);

    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

    public AdminFacturasAccionesResponse consultar(
            String usuarioFiltro,
            LocalDate fechaInicio,
            LocalDate fechaFin,
            Integer tipoFacturaFiltro,
            String estatusFiltro) {
        if (jdbcTemplate == null) {
            return AdminFacturasAccionesResponse.builder()
                    .exitoso(false)
                    .mensaje("Base de datos no disponible (perfil Oracle inactivo)")
                    .build();
        }
        try {
            List<UsuarioCatalogoItem> catalogo = cargarCatalogoUsuarios();
            Map<String, UsuarioCatalogoItem> catalogoPorId = indexarCatalogo(catalogo);

            Integer idUsuarioFiltro = resolverIdUsuarioFiltro(usuarioFiltro, catalogo);
            LocalDateTime inicio = fechaInicio != null ? fechaInicio.atStartOfDay() : null;
            LocalDateTime fin = fechaFin != null ? fechaFin.atTime(23, 59, 59) : null;

            List<ComprobanteAdminItem> comprobantes = consultarComprobantes(
                    idUsuarioFiltro, usuarioFiltro, inicio, fin, tipoFacturaFiltro, estatusFiltro, catalogoPorId);

            enriquecerNombresUsuario(comprobantes, catalogoPorId);

            List<ResumenUsuarioItem> resumen = construirResumen(comprobantes);

            return AdminFacturasAccionesResponse.builder()
                    .exitoso(true)
                    .mensaje("Consulta realizada correctamente")
                    .usuariosCatalogo(catalogo)
                    .comprobantes(comprobantes)
                    .resumenUsuarios(resumen)
                    .build();
        } catch (Exception e) {
            logger.error("Error en admin facturas-acciones: {}", e.getMessage(), e);
            return AdminFacturasAccionesResponse.builder()
                    .exitoso(false)
                    .mensaje("Error al consultar: " + e.getMessage())
                    .build();
        }
    }

    private List<UsuarioCatalogoItem> cargarCatalogoUsuarios() {
        String sql = """
                SELECT COALESCE(TO_CHAR(u.ID_DFI), TO_CHAR(u.ID_PERFIL)) AS ID_USUARIO,
                       u.NO_USUARIO,
                       u.NOMBRE_EMPLEADO,
                       u.ESTATUS_USUARIO
                FROM USUARIOS u
                WHERE u.NO_USUARIO IS NOT NULL
                ORDER BY u.NO_USUARIO
                """;
        try {
            return jdbcTemplate.query(sql, (rs, rowNum) -> UsuarioCatalogoItem.builder()
                    .usuarioId(rs.getString("ID_USUARIO"))
                    .noUsuario(rs.getString("NO_USUARIO"))
                    .nombreEmpleado(rs.getString("NOMBRE_EMPLEADO"))
                    .estatusUsuario(rs.getString("ESTATUS_USUARIO"))
                    .build());
        } catch (Exception e) {
            logger.warn("No se pudo cargar catálogo USUARIOS: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private Map<String, UsuarioCatalogoItem> indexarCatalogo(List<UsuarioCatalogoItem> catalogo) {
        Map<String, UsuarioCatalogoItem> map = new HashMap<>();
        for (UsuarioCatalogoItem u : catalogo) {
            if (u.getUsuarioId() != null) {
                map.put(u.getUsuarioId().trim(), u);
            }
            if (u.getNoUsuario() != null) {
                map.put(u.getNoUsuario().trim().toUpperCase(), u);
            }
        }
        return map;
    }

    private Integer resolverIdUsuarioFiltro(String usuarioFiltro, List<UsuarioCatalogoItem> catalogo) {
        if (usuarioFiltro == null || usuarioFiltro.isBlank()) {
            return null;
        }
        String f = usuarioFiltro.trim();
        try {
            return Integer.parseInt(f);
        } catch (NumberFormatException ignored) {
            // buscar por login
        }
        for (UsuarioCatalogoItem u : catalogo) {
            if (u.getNoUsuario() != null && u.getNoUsuario().equalsIgnoreCase(f)) {
                try {
                    return u.getUsuarioId() != null ? Integer.parseInt(u.getUsuarioId().trim()) : null;
                } catch (NumberFormatException e) {
                    return null;
                }
            }
            if (u.getNombreEmpleado() != null && u.getNombreEmpleado().toLowerCase().contains(f.toLowerCase())) {
                try {
                    return u.getUsuarioId() != null ? Integer.parseInt(u.getUsuarioId().trim()) : null;
                } catch (NumberFormatException e) {
                    return null;
                }
            }
        }
        return null;
    }

    private List<ComprobanteAdminItem> consultarComprobantes(
            Integer idUsuarioFiltro,
            String usuarioFiltro,
            LocalDateTime inicio,
            LocalDateTime fin,
            Integer tipoFacturaFiltro,
            String estatusFiltro,
            Map<String, UsuarioCatalogoItem> catalogoPorId) {

        StringBuilder sql = new StringBuilder("""
                SELECT f.UUID, f.SERIE, f.FOLIO, f.RAZON_SOCIAL, f.RFC_R, f.IMPORTE, f.FECHA,
                       f.ESTATUS_FACTURA, f.STATUS_SAT, f.TIPO_FACTURA, f.UUID_ORIG,
                       COALESCE(TO_CHAR(f.USUARIO), 'SIN_USUARIO') AS USUARIO_ID
                FROM FACTURAS f
                WHERE 1=1
                """);
        List<Object> params = new ArrayList<>();

        if (idUsuarioFiltro != null) {
            sql.append(" AND f.USUARIO = ?");
            params.add(idUsuarioFiltro);
        } else if (usuarioFiltro != null && !usuarioFiltro.isBlank()) {
            sql.append(" AND TO_CHAR(f.USUARIO) LIKE ?");
            params.add("%" + usuarioFiltro.trim() + "%");
        }
        if (inicio != null) {
            sql.append(" AND f.FECHA >= ?");
            params.add(inicio);
        }
        if (fin != null) {
            sql.append(" AND f.FECHA <= ?");
            params.add(fin);
        }
        if (tipoFacturaFiltro != null) {
            sql.append(" AND f.TIPO_FACTURA = ?");
            params.add(tipoFacturaFiltro);
        }
        if (estatusFiltro != null && !estatusFiltro.isBlank()) {
            sql.append(" AND (UPPER(f.ESTATUS_FACTURA) LIKE UPPER(?) OR UPPER(f.STATUS_SAT) LIKE UPPER(?))");
            String like = "%" + estatusFiltro.trim() + "%";
            params.add(like);
            params.add(like);
        }
        sql.append(" ORDER BY f.FECHA DESC FETCH FIRST 500 ROWS ONLY");

        return jdbcTemplate.query(sql.toString(), params.toArray(), (rs, rowNum) -> mapRowComprobante(rs));
    }

    private ComprobanteAdminItem mapRowComprobante(ResultSet rs) throws SQLException {
        Integer tipo = rs.getObject("TIPO_FACTURA") != null
                ? ((Number) rs.getObject("TIPO_FACTURA")).intValue()
                : null;
        String uuidOrig = rs.getString("UUID_ORIG");
        Timestamp ts = rs.getTimestamp("FECHA");

        return ComprobanteAdminItem.builder()
                .uuid(rs.getString("UUID"))
                .serie(rs.getString("SERIE"))
                .folio(rs.getString("FOLIO"))
                .tipoFactura(tipo)
                .modulo(etiquetaModulo(tipo, uuidOrig))
                .receptorRazonSocial(rs.getString("RAZON_SOCIAL"))
                .receptorRfc(rs.getString("RFC_R"))
                .total(rs.getBigDecimal("IMPORTE"))
                .fecha(ts != null ? ts.toLocalDateTime() : null)
                .estatusFacturacion(rs.getString("ESTATUS_FACTURA"))
                .estatusSat(rs.getString("STATUS_SAT"))
                .usuarioId(rs.getString("USUARIO_ID"))
                .uuidOrigen(uuidOrig)
                .build();
    }

    static String etiquetaModulo(Integer tipoFactura, String uuidOrigen) {
        if (uuidOrigen != null && !uuidOrigen.isBlank()) {
            return "Nota de crédito";
        }
        if (tipoFactura == null) {
            return "Factura artículos";
        }
        return switch (tipoFactura) {
            case 2 -> "Nota de crédito / Egreso";
            case 3 -> "Carta porte";
            case 4 -> "Nómina";
            case 5 -> "Complemento de pago";
            case 6 -> "Retención de pagos";
            default -> "Factura artículos";
        };
    }

    private void enriquecerNombresUsuario(
            List<ComprobanteAdminItem> comprobantes,
            Map<String, UsuarioCatalogoItem> catalogoPorId) {
        for (ComprobanteAdminItem c : comprobantes) {
            String uid = c.getUsuarioId();
            if (uid == null || "SIN_USUARIO".equals(uid)) {
                c.setNoUsuario("—");
                c.setNombreUsuario("Sin usuario");
                continue;
            }
            UsuarioCatalogoItem u = catalogoPorId.get(uid.trim());
            if (u == null) {
                u = catalogoPorId.get(uid.trim().toUpperCase());
            }
            if (u != null) {
                c.setNoUsuario(u.getNoUsuario());
                c.setNombreUsuario(
                        u.getNombreEmpleado() != null ? u.getNombreEmpleado() : u.getNoUsuario());
            } else {
                c.setNoUsuario(uid);
                c.setNombreUsuario("Usuario " + uid);
            }
        }
    }

    private List<ResumenUsuarioItem> construirResumen(List<ComprobanteAdminItem> comprobantes) {
        Map<String, ResumenUsuarioItem> map = new HashMap<>();
        for (ComprobanteAdminItem c : comprobantes) {
            String key = c.getUsuarioId() != null ? c.getUsuarioId() : "SIN_USUARIO";
            map.putIfAbsent(key, ResumenUsuarioItem.builder()
                    .usuarioId(key)
                    .noUsuario(c.getNoUsuario())
                    .nombreEmpleado(c.getNombreUsuario())
                    .totalComprobantes(0)
                    .totalImporte(BigDecimal.ZERO)
                    .build());

            ResumenUsuarioItem r = map.get(key);
            r.setTotalComprobantes(r.getTotalComprobantes() + 1);
            if (c.getTotal() != null) {
                r.setTotalImporte(r.getTotalImporte().add(c.getTotal()));
            }
            if (c.getFecha() != null && (r.getUltimaEmision() == null || c.getFecha().isAfter(r.getUltimaEmision()))) {
                r.setUltimaEmision(c.getFecha());
            }
            incrementarPorModulo(r, c);
        }
        return map.values().stream()
                .sorted(Comparator.comparing(ResumenUsuarioItem::getTotalComprobantes).reversed())
                .collect(Collectors.toList());
    }

    private void incrementarPorModulo(ResumenUsuarioItem r, ComprobanteAdminItem c) {
        String mod = c.getModulo() != null ? c.getModulo() : "";
        if (mod.contains("Nota")) {
            r.setNotasCredito(r.getNotasCredito() + 1);
        } else if (mod.contains("Nómina")) {
            r.setNominas(r.getNominas() + 1);
        } else if (mod.contains("Carta")) {
            r.setCartasPorte(r.getCartasPorte() + 1);
        } else if (mod.contains("Complemento")) {
            r.setComplementosPago(r.getComplementosPago() + 1);
        } else if (mod.contains("Retención")) {
            r.setRetenciones(r.getRetenciones() + 1);
        } else if (mod.contains("artículos")) {
            r.setFacturasArticulos(r.getFacturasArticulos() + 1);
        } else {
            r.setOtros(r.getOtros() + 1);
        }
    }
}
