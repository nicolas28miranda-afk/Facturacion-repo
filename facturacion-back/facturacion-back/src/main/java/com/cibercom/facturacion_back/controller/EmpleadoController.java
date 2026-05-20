package com.cibercom.facturacion_back.controller;

import com.cibercom.facturacion_back.dto.EmpleadoConsultaDTO;
import com.cibercom.facturacion_back.dto.EmpleadoSaveRequest;
import com.cibercom.facturacion_back.service.EmpleadoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@Profile("oracle")
@RequestMapping("/api/empleados")
public class EmpleadoController {

    private static final Logger log = LoggerFactory.getLogger(EmpleadoController.class);
    private final EmpleadoService empleadoService;

    public EmpleadoController(EmpleadoService empleadoService) {
        this.empleadoService = empleadoService;
    }

    /**
     * Catálogo para nóminas: ?idEmpleado=1 o ?criterio=EMP001 / RFC
     */
    @GetMapping
    public ResponseEntity<?> consultar(
            @RequestParam(required = false) String idEmpleado,
            @RequestParam(required = false) String criterio,
            @RequestParam(required = false, defaultValue = "false") boolean listar) {
        try {
            if (listar) {
                List<EmpleadoConsultaDTO> todos = empleadoService.listarActivos();
                return ResponseEntity.ok(todos);
            }
            String busqueda = (idEmpleado != null && !idEmpleado.isBlank()) ? idEmpleado.trim()
                    : (criterio != null ? criterio.trim() : null);
            if (busqueda == null || busqueda.isEmpty()) {
                return ResponseEntity.badRequest().body("Indique idEmpleado o criterio");
            }
            Optional<EmpleadoConsultaDTO> emp = empleadoService.buscarParaNomina(busqueda);
            if (emp.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(emp.get());
        } catch (Exception e) {
            log.error("Error consultando empleados: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> guardar(@RequestBody EmpleadoSaveRequest request) {
        try {
            EmpleadoConsultaDTO guardado = empleadoService.guardar(request);
            return ResponseEntity.ok(guardado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "ok", false,
                    "mensaje", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error guardando empleado: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "ok", false,
                    "mensaje", "Error al guardar empleado: " + e.getMessage()
            ));
        }
    }
}
