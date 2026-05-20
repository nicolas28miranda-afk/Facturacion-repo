package com.cibercom.facturacion_back.controller;

import com.cibercom.facturacion_back.dto.TareaOperacionBulkCreateRequest;
import com.cibercom.facturacion_back.dto.TareaOperacionCreateRequest;
import com.cibercom.facturacion_back.dto.TareaOperacionDto;
import com.cibercom.facturacion_back.dto.TareaOperacionEstadoRequest;
import com.cibercom.facturacion_back.dto.TareaOperacionMarcarLeidasRequest;
import com.cibercom.facturacion_back.dto.TareaOperacionPageResponse;
import com.cibercom.facturacion_back.dto.TareaOperacionReassignRequest;
import com.cibercom.facturacion_back.security.TareasOperacionAdminAuth;
import com.cibercom.facturacion_back.service.TareasOperacionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tareas-operacion")
@CrossOrigin(origins = "*")
public class TareasOperacionController {

    private static final Logger logger = LoggerFactory.getLogger(TareasOperacionController.class);

    @Autowired
    private TareasOperacionService tareasOperacionService;

    @Autowired
    private TareasOperacionAdminAuth tareasOperacionAdminAuth;

    @GetMapping("/recibidas")
    public ResponseEntity<?> listarRecibidas(
            @RequestParam("para") String noUsuarioPara,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        try {
            TareaOperacionPageResponse pageResp = tareasOperacionService.listarRecibidasFiltrado(
                    noUsuarioPara, tipo, estado, texto, fechaDesde, fechaHasta, categoria, page, size);
            return ResponseEntity.ok(pageResp);
        } catch (Exception e) {
            logger.error("Error listar TAREAS_OPERACION para {}: {}", noUsuarioPara, e.getMessage(), e);
            return respuestaErrorSql(e);
        }
    }

    @GetMapping("/todas")
    public ResponseEntity<?> listarTodas(
            @RequestHeader(value = "X-Tareas-Operacion-Admin", required = false) String adminHeader,
            @RequestParam(required = false) String para,
            @RequestParam(required = false) String de,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        try {
            tareasOperacionAdminAuth.verifyOptionalAdmin(adminHeader);
            if (usaListadoCompletoSinFiltros(para, de, tipo, estado, texto, fechaDesde, fechaHasta, page, size)) {
                List<TareaOperacionDto> all = tareasOperacionService.listarTodas();
                return ResponseEntity.ok(new TareaOperacionPageResponse(all, all.size()));
            }
            TareaOperacionPageResponse resp = tareasOperacionService.listarTodasFiltrado(
                    para, de, tipo, estado, texto, fechaDesde, fechaHasta, page, size);
            return ResponseEntity.ok(resp);
        } catch (org.springframework.web.server.ResponseStatusException rse) {
            return ResponseEntity.status(rse.getStatusCode()).body(errorBody(rse.getReason()));
        } catch (Exception e) {
            logger.error("Error listar TAREAS_OPERACION: {} | causa: {}", e.getMessage(), mensajeCausaJdbc(e), e);
            return respuestaErrorSql(e);
        }
    }

    private static boolean usaListadoCompletoSinFiltros(
            String para, String de, String tipo, String estado, String texto,
            LocalDate fechaDesde, LocalDate fechaHasta, Integer page, Integer size) {
        return vacio(para) && vacio(de) && vacio(tipo) && vacio(estado) && vacio(texto)
                && fechaDesde == null && fechaHasta == null && page == null && size == null;
    }

    private static boolean vacio(String s) {
        return s == null || s.isBlank();
    }

    @PostMapping
    public ResponseEntity<?> crear(
            @RequestHeader(value = "X-Tareas-Operacion-Admin", required = false) String adminHeader,
            @RequestBody TareaOperacionCreateRequest body) {
        try {
            tareasOperacionAdminAuth.verifyOptionalAdmin(adminHeader);
            TareaOperacionDto creado = tareasOperacionService.crear(body);
            return ResponseEntity.ok(creado);
        } catch (org.springframework.web.server.ResponseStatusException rse) {
            return ResponseEntity.status(rse.getStatusCode()).body(errorBody(rse.getReason()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error crear TAREAS_OPERACION: {}", e.getMessage(), e);
            return respuestaErrorSql(e);
        }
    }

    @PostMapping("/bulk")
    public ResponseEntity<?> crearBulk(
            @RequestHeader(value = "X-Tareas-Operacion-Admin", required = false) String adminHeader,
            @RequestBody TareaOperacionBulkCreateRequest body) {
        try {
            tareasOperacionAdminAuth.verifyOptionalAdmin(adminHeader);
            List<TareaOperacionDto> creados = tareasOperacionService.crearBulk(body);
            return ResponseEntity.ok(creados);
        } catch (org.springframework.web.server.ResponseStatusException rse) {
            return ResponseEntity.status(rse.getStatusCode()).body(errorBody(rse.getReason()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error crear bulk TAREAS_OPERACION: {}", e.getMessage(), e);
            return respuestaErrorSql(e);
        }
    }

    @PostMapping("/inbox/marcar-leidas")
    public ResponseEntity<?> marcarInboxLeidas(@RequestBody TareaOperacionMarcarLeidasRequest body) {
        try {
            if (body.getNoUsuarioPara() == null || body.getNoUsuarioPara().isBlank()) {
                return ResponseEntity.badRequest().body(errorBody("noUsuarioPara es obligatorio"));
            }
            int n = tareasOperacionService.marcarInboxLeidas(body.getNoUsuarioPara(), body.getIds());
            Map<String, Object> ok = new HashMap<>();
            ok.put("success", true);
            ok.put("actualizadas", n);
            return ResponseEntity.ok(ok);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error marcar leídas: {}", e.getMessage(), e);
            return respuestaErrorSql(e);
        }
    }

    @PatchMapping("/{id}/reasignar")
    public ResponseEntity<?> reasignar(
            @RequestHeader(value = "X-Tareas-Operacion-Admin", required = false) String adminHeader,
            @PathVariable long id,
            @RequestBody TareaOperacionReassignRequest body) {
        try {
            tareasOperacionAdminAuth.verifyOptionalAdmin(adminHeader);
            boolean ok = tareasOperacionService.reasignar(id, body.getNoUsuarioPara());
            if (!ok) {
                return ResponseEntity.notFound().build();
            }
            TareaOperacionDto dto = tareasOperacionService.obtenerPorId(id);
            return ResponseEntity.ok(dto);
        } catch (org.springframework.web.server.ResponseStatusException rse) {
            return ResponseEntity.status(rse.getStatusCode()).body(errorBody(rse.getReason()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error reasignar {}: {}", id, e.getMessage(), e);
            return respuestaErrorSql(e);
        }
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstado(
            @PathVariable long id,
            @RequestBody TareaOperacionEstadoRequest body) {
        try {
            if (body.getEstado() == null || body.getEstado().isBlank()) {
                return ResponseEntity.badRequest().body(errorBody("estado es obligatorio"));
            }
            boolean ok = tareasOperacionService.actualizarEstado(id, body.getEstado());
            if (!ok) {
                return ResponseEntity.notFound().build();
            }
            TareaOperacionDto dto = tareasOperacionService.obtenerPorId(id);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error actualizar estado {}: {}", id, e.getMessage(), e);
            return respuestaErrorSql(e);
        }
    }

    private static boolean esTablaNoExiste(Throwable t) {
        for (Throwable cur = t; cur != null; cur = cur.getCause()) {
            if (mensajeThrowable(cur).contains("ORA-00942")) {
                return true;
            }
            if (cur instanceof SQLException se) {
                for (SQLException next = se.getNextException(); next != null; next = next.getNextException()) {
                    if (mensajeThrowable(next).contains("ORA-00942")) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private static String mensajeThrowable(Throwable t) {
        String m = t.getMessage();
        return m != null ? m : "";
    }

    private static String mensajeCausaJdbc(Throwable e) {
        for (Throwable cur = e; cur != null; cur = cur.getCause()) {
            String m = mensajeThrowable(cur);
            if (m.contains("ORA-")) {
                return m;
            }
            if (cur instanceof SQLException se) {
                for (SQLException next = se.getNextException(); next != null; next = next.getNextException()) {
                    String nm = mensajeThrowable(next);
                    if (nm.contains("ORA-")) {
                        return nm;
                    }
                }
            }
        }
        return mensajeThrowable(e);
    }

    private static String mensajeAmigableSql(Throwable e) {
        if (esTablaNoExiste(e)) {
            return "La tabla TAREAS_OPERACION no existe en el esquema del usuario de conexión a Oracle. "
                    + "Conéctese con el mismo usuario que spring.datasource.username y ejecute el script "
                    + "db/migration/tareas_operacion_oracle.sql (o créela manualmente).";
        }
        String m = mensajeCausaJdbc(e);
        return !m.isBlank() ? m : "Error de base de datos";
    }

    private static ResponseEntity<Map<String, Object>> respuestaErrorSql(Exception e) {
        HttpStatus status = esTablaNoExiste(e) ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.INTERNAL_SERVER_ERROR;
        return ResponseEntity.status(status).body(errorBody(mensajeAmigableSql(e)));
    }

    private static Map<String, Object> errorBody(String message) {
        Map<String, Object> m = new HashMap<>();
        m.put("success", false);
        m.put("message", message);
        return m;
    }
}
