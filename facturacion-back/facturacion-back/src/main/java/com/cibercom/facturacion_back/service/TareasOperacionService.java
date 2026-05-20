package com.cibercom.facturacion_back.service;

import com.cibercom.facturacion_back.dto.TareaOperacionBulkCreateRequest;
import com.cibercom.facturacion_back.dto.TareaOperacionCreateRequest;
import com.cibercom.facturacion_back.dto.TareaOperacionDto;
import com.cibercom.facturacion_back.dto.TareaOperacionPageResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class TareasOperacionService {

    private static final Logger logger = LoggerFactory.getLogger(TareasOperacionService.class);

    private static final String SELECT_COLS = "SELECT ID_TAREA_OPERACION, TIPO, ASUNTO, CUERPO, NO_USUARIO_DE, NO_USUARIO_PARA, "
            + "ESTADO, FECHA_ALTA, FECHA_VENCIMIENTO FROM TAREAS_OPERACION";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UsuarioService usuarioService;

    private static String toIso(Timestamp ts) {
        if (ts == null) {
            return null;
        }
        return Instant.ofEpochMilli(ts.getTime()).atZone(ZoneId.systemDefault()).toOffsetDateTime().toString();
    }

    private TareaOperacionDto mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        TareaOperacionDto dto = new TareaOperacionDto();
        dto.setId(rs.getLong("ID_TAREA_OPERACION"));
        dto.setTipo(rs.getString("TIPO"));
        dto.setAsunto(rs.getString("ASUNTO"));
        String cuerpoStr = rs.getString("CUERPO");
        dto.setCuerpo(cuerpoStr != null ? cuerpoStr : "");
        dto.setNoUsuarioDe(rs.getString("NO_USUARIO_DE"));
        dto.setNoUsuarioPara(rs.getString("NO_USUARIO_PARA"));
        dto.setEstado(rs.getString("ESTADO"));
        dto.setFechaIso(toIso(rs.getTimestamp("FECHA_ALTA")));
        Timestamp fv = rs.getTimestamp("FECHA_VENCIMIENTO");
        dto.setFechaVencimientoIso(fv != null ? toIso(fv) : null);
        return dto;
    }

    public List<TareaOperacionDto> listarPorDestinatario(String noUsuarioPara) {
        TareaOperacionPageResponse page = listarRecibidasFiltrado(
                noUsuarioPara, null, null, null, null, null, null, null, null);
        return page.getContent() != null ? page.getContent() : List.of();
    }

    /**
     * Listado para el operador (destinatario fijo) con filtros y paginación opcional.
     */
    public TareaOperacionPageResponse listarRecibidasFiltrado(
            String noUsuarioPara,
            String tipo,
            String estado,
            String texto,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            String categoria,
            Integer page,
            Integer size) {
        if (noUsuarioPara == null || noUsuarioPara.isBlank()) {
            return new TareaOperacionPageResponse(List.of(), 0);
        }
        int p = page != null && page >= 0 ? page : 0;
        int s = size != null && size > 0 ? Math.min(size, 10_000) : 5_000;
        return listarFiltradoInterno(noUsuarioPara.trim(), false, null, null, tipo, estado, texto, fechaDesde, fechaHasta, categoria, p, s);
    }

    /**
     * Listado global (admin) con filtros y paginación.
     */
    public TareaOperacionPageResponse listarTodasFiltrado(
            String filtroPara,
            String filtroDe,
            String tipo,
            String estado,
            String texto,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            Integer page,
            Integer size) {
        int p = page != null && page >= 0 ? page : 0;
        int s = size != null && size > 0 ? Math.min(size, 10_000) : 500;
        return listarFiltradoInterno(null, true, filtroPara, filtroDe, tipo, estado, texto, fechaDesde, fechaHasta, null, p, s);
    }

    private TareaOperacionPageResponse listarFiltradoInterno(
            String paraEqDestinatario,
            boolean modoTodas,
            String filtroPara,
            String filtroDe,
            String tipo,
            String estado,
            String texto,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            String categoria,
            int page,
            int size) {
        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        List<Object> args = new ArrayList<>();

        if (!modoTodas) {
            where.append(" AND UPPER(NO_USUARIO_PARA) = UPPER(?) ");
            args.add(paraEqDestinatario);
        } else {
            if (filtroPara != null && !filtroPara.isBlank()) {
                where.append(" AND UPPER(NO_USUARIO_PARA) LIKE UPPER(?) ");
                args.add("%" + escaparLike(filtroPara.trim()) + "%");
            }
            if (filtroDe != null && !filtroDe.isBlank()) {
                where.append(" AND UPPER(NO_USUARIO_DE) LIKE UPPER(?) ");
                args.add("%" + escaparLike(filtroDe.trim()) + "%");
            }
        }

        if (tipo != null && !tipo.isBlank()) {
            where.append(" AND TIPO = ? ");
            args.add(tipo.trim().toUpperCase(Locale.ROOT));
        } else if (!modoTodas && categoria != null && !categoria.isBlank()) {
            String cat = categoria.trim().toLowerCase(Locale.ROOT);
            if ("inbox".equals(cat)) {
                where.append(" AND TIPO IN ('MENSAJE','NOTIFICACION') ");
            } else if ("tareas".equals(cat)) {
                where.append(" AND TIPO = 'TAREA' ");
            }
            // "todos" u otro: sin filtro extra por tipo
        }
        if (estado != null && !estado.isBlank()) {
            where.append(" AND ESTADO = ? ");
            args.add(estado.trim().toUpperCase(Locale.ROOT));
        }
        if (texto != null && !texto.isBlank()) {
            where.append(" AND UPPER(ASUNTO) LIKE UPPER(?) ");
            args.add("%" + escaparLike(texto.trim()) + "%");
        }
        if (fechaDesde != null) {
            where.append(" AND FECHA_ALTA >= ? ");
            args.add(Timestamp.valueOf(fechaDesde.atStartOfDay()));
        }
        if (fechaHasta != null) {
            where.append(" AND FECHA_ALTA < ? ");
            args.add(Timestamp.valueOf(fechaHasta.plusDays(1).atStartOfDay()));
        }

        String orderBy = " ORDER BY FECHA_ALTA DESC";
        String countSql = "SELECT COUNT(*) FROM TAREAS_OPERACION" + where;
        Long total = jdbcTemplate.queryForObject(countSql, Long.class, args.toArray());

        String dataSql = SELECT_COLS + where + orderBy + " OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
        List<Object> dataArgs = new ArrayList<>(args);
        dataArgs.add(page * (long) size);
        dataArgs.add(size);

        List<TareaOperacionDto> list = jdbcTemplate.query(dataSql, this::mapRow, dataArgs.toArray());
        return new TareaOperacionPageResponse(list, total != null ? total : 0L);
    }

    private static String escaparLike(String s) {
        return s.replace("%", "").replace("_", "");
    }

    public List<TareaOperacionDto> listarTodas() {
        String sql = SELECT_COLS + " ORDER BY FECHA_ALTA DESC";
        return jdbcTemplate.query(sql, this::mapRow);
    }

    public TareaOperacionDto crear(TareaOperacionCreateRequest req) {
        if (req.getAsunto() == null || req.getAsunto().isBlank()) {
            throw new IllegalArgumentException("asunto es obligatorio");
        }
        if (req.getNoUsuarioDe() == null || req.getNoUsuarioDe().isBlank()) {
            throw new IllegalArgumentException("noUsuarioDe es obligatorio");
        }
        if (req.getNoUsuarioPara() == null || req.getNoUsuarioPara().isBlank()) {
            throw new IllegalArgumentException("noUsuarioPara es obligatorio");
        }
        validarTipo(req.getTipo());
        if (!usuarioService.existeNoUsuario(req.getNoUsuarioPara())) {
            throw new IllegalArgumentException("noUsuarioPara no existe en USUARIOS: " + req.getNoUsuarioPara());
        }

        java.sql.Date fechaVenc = null;
        if (req.getFechaVencimientoIso() != null && !req.getFechaVencimientoIso().isBlank()) {
            String s = req.getFechaVencimientoIso().trim();
            if (s.length() >= 10) {
                LocalDate d = LocalDate.parse(s.substring(0, 10));
                fechaVenc = java.sql.Date.valueOf(d);
            }
        }
        final java.sql.Date fechaVencFinal = fechaVenc;

        String cuerpo = req.getCuerpo() != null ? req.getCuerpo() : "";

        String sql = "INSERT INTO TAREAS_OPERACION (TIPO, ASUNTO, CUERPO, NO_USUARIO_DE, NO_USUARIO_PARA, "
                + "ESTADO, FECHA_VENCIMIENTO) VALUES (?, ?, ?, ?, ?, 'PENDIENTE', ?)";

        GeneratedKeyHolder kh = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"ID_TAREA_OPERACION"});
            ps.setString(1, req.getTipo().trim().toUpperCase(Locale.ROOT));
            ps.setString(2, req.getAsunto().trim());
            ps.setString(3, cuerpo);
            ps.setString(4, req.getNoUsuarioDe().trim());
            ps.setString(5, req.getNoUsuarioPara().trim());
            if (fechaVencFinal != null) {
                ps.setDate(6, fechaVencFinal);
            } else {
                ps.setDate(6, null);
            }
            return ps;
        }, kh);

        Number key = kh.getKey();
        if (key == null) {
            throw new IllegalStateException("No se obtuvo ID_TAREA_OPERACION tras INSERT");
        }
        logger.info("TAREAS_OPERACION creada id={} tipo={} para={}", key.longValue(), req.getTipo(), req.getNoUsuarioPara());
        return obtenerPorId(key.longValue());
    }

    public List<TareaOperacionDto> crearBulk(TareaOperacionBulkCreateRequest bulk) {
        if (bulk.getNoUsuariosPara() == null || bulk.getNoUsuariosPara().isEmpty()) {
            throw new IllegalArgumentException("noUsuariosPara no puede estar vacío");
        }
        if (bulk.getAsunto() == null || bulk.getAsunto().isBlank()) {
            throw new IllegalArgumentException("asunto es obligatorio");
        }
        if (bulk.getNoUsuarioDe() == null || bulk.getNoUsuarioDe().isBlank()) {
            throw new IllegalArgumentException("noUsuarioDe es obligatorio");
        }
        validarTipo(bulk.getTipo());
        List<TareaOperacionDto> creados = new ArrayList<>();
        for (String para : bulk.getNoUsuariosPara()) {
            if (para == null || para.isBlank()) {
                continue;
            }
            TareaOperacionCreateRequest one = new TareaOperacionCreateRequest();
            one.setTipo(bulk.getTipo());
            one.setAsunto(bulk.getAsunto());
            one.setCuerpo(bulk.getCuerpo());
            one.setNoUsuarioDe(bulk.getNoUsuarioDe());
            one.setNoUsuarioPara(para.trim());
            one.setFechaVencimientoIso(bulk.getFechaVencimientoIso());
            creados.add(crear(one));
        }
        if (creados.isEmpty()) {
            throw new IllegalArgumentException("No hay destinatarios válidos en noUsuariosPara");
        }
        return creados;
    }

    public int marcarInboxLeidas(String noUsuarioPara, List<Long> ids) {
        if (noUsuarioPara == null || noUsuarioPara.isBlank()) {
            throw new IllegalArgumentException("noUsuarioPara es obligatorio");
        }
        String u = noUsuarioPara.trim();
        if (ids != null && !ids.isEmpty()) {
            StringBuilder in = new StringBuilder();
            List<Object> args = new ArrayList<>();
            args.add(u);
            for (Long id : ids) {
                if (id == null) {
                    continue;
                }
                in.append("?,");
                args.add(id);
            }
            if (in.length() == 0) {
                return 0;
            }
            in.setLength(in.length() - 1);
            String sql = "UPDATE TAREAS_OPERACION SET ESTADO = 'LEIDO', FECHA_LEIDO = SYSDATE "
                    + "WHERE UPPER(NO_USUARIO_PARA) = UPPER(?) AND TIPO IN ('MENSAJE','NOTIFICACION') AND ESTADO = 'PENDIENTE' "
                    + "AND ID_TAREA_OPERACION IN (" + in + ")";
            return jdbcTemplate.update(sql, args.toArray());
        }
        String sql = "UPDATE TAREAS_OPERACION SET ESTADO = 'LEIDO', FECHA_LEIDO = SYSDATE "
                + "WHERE UPPER(NO_USUARIO_PARA) = UPPER(?) AND TIPO IN ('MENSAJE','NOTIFICACION') AND ESTADO = 'PENDIENTE'";
        return jdbcTemplate.update(sql, u);
    }

    public boolean reasignar(long id, String noUsuarioParaNuevo) {
        if (noUsuarioParaNuevo == null || noUsuarioParaNuevo.isBlank()) {
            throw new IllegalArgumentException("noUsuarioPara es obligatorio");
        }
        String n = noUsuarioParaNuevo.trim();
        if (!usuarioService.existeNoUsuario(n)) {
            throw new IllegalArgumentException("noUsuarioPara no existe en USUARIOS: " + n);
        }
        int rows = jdbcTemplate.update(
                "UPDATE TAREAS_OPERACION SET NO_USUARIO_PARA = ? WHERE ID_TAREA_OPERACION = ?",
                n, id);
        if (rows > 0) {
            logger.info("TAREAS_OPERACION reasignada id={} nuevo_destino={}", id, n);
        }
        return rows > 0;
    }

    public TareaOperacionDto obtenerPorId(long id) {
        String sql = SELECT_COLS + " WHERE ID_TAREA_OPERACION = ?";
        List<TareaOperacionDto> list = jdbcTemplate.query(sql, this::mapRow, id);
        if (list.isEmpty()) {
            return null;
        }
        return list.get(0);
    }

    public boolean actualizarEstado(long id, String estadoNuevo) {
        String e = estadoNuevo != null ? estadoNuevo.trim().toUpperCase(Locale.ROOT) : "";
        if (!List.of("LEIDO", "COMPLETADO", "ARCHIVADO", "CANCELADO", "PENDIENTE").contains(e)) {
            throw new IllegalArgumentException("Estado no válido: " + estadoNuevo);
        }
        int rows;
        if ("LEIDO".equals(e)) {
            rows = jdbcTemplate.update(
                    "UPDATE TAREAS_OPERACION SET ESTADO = 'LEIDO', FECHA_LEIDO = SYSDATE WHERE ID_TAREA_OPERACION = ?",
                    id);
        } else if ("COMPLETADO".equals(e)) {
            rows = jdbcTemplate.update(
                    "UPDATE TAREAS_OPERACION SET ESTADO = 'COMPLETADO', FECHA_COMPLETADO = SYSDATE, "
                            + "FECHA_LEIDO = NVL(FECHA_LEIDO, SYSDATE) WHERE ID_TAREA_OPERACION = ?",
                    id);
        } else {
            rows = jdbcTemplate.update("UPDATE TAREAS_OPERACION SET ESTADO = ? WHERE ID_TAREA_OPERACION = ?", e, id);
        }
        if (rows > 0) {
            logger.info("TAREAS_OPERACION estado actualizado id={} estado={}", id, e);
        }
        return rows > 0;
    }

    private static void validarTipo(String tipo) {
        if (tipo == null) {
            throw new IllegalArgumentException("tipo es obligatorio");
        }
        String t = tipo.trim().toUpperCase(Locale.ROOT);
        if (!List.of("TAREA", "MENSAJE", "NOTIFICACION").contains(t)) {
            throw new IllegalArgumentException("tipo debe ser TAREA, MENSAJE o NOTIFICACION");
        }
    }
}
