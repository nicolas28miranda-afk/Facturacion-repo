package com.cibercom.cdp.controller;

import com.cibercom.cdp.dto.ClienteResponseDto;
import com.cibercom.cdp.dto.ProcesarFacturaRequestDto;
import com.cibercom.cdp.dto.ProcesarFacturaResponseDto;
import com.cibercom.cdp.service.ClienteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/cdp")
@RequiredArgsConstructor
@Slf4j
public class ClienteController {
    
    private final ClienteService clienteService;
    
    /**
     * Procesar datos de factura CFDI
     */
    @PostMapping("/procesar-factura")
    public ResponseEntity<ProcesarFacturaResponseDto> procesarFactura(@Valid @RequestBody ProcesarFacturaRequestDto request) {
        log.info("Recibida solicitud para procesar factura: {}", request.getRfc());
        
        try {
            ProcesarFacturaResponseDto response = clienteService.procesarFactura(request);
            
            if (response.getExitoso()) {
                log.info("Factura procesada exitosamente para RFC: {}", request.getRfc());
                return ResponseEntity.ok(response);
            } else {
                log.error("Error al procesar factura para RFC: {} - {}", request.getRfc(), response.getMensaje());
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            log.error("Error inesperado al procesar factura para RFC: {}", request.getRfc(), e);
            return ResponseEntity.internalServerError()
                    .body(ProcesarFacturaResponseDto.error("Error interno del servidor: " + e.getMessage()));
        }
    }
    
    /**
     * Buscar cliente por RFC
     */
    @GetMapping("/cliente/{rfc}")
    public ResponseEntity<ClienteResponseDto> buscarClientePorRfc(@PathVariable String rfc) {
        log.info("Buscando cliente por RFC: {}", rfc);
        
        try {
            Optional<ClienteResponseDto> cliente = clienteService.buscarClientePorRfc(rfc);
            
            if (cliente.isPresent()) {
                log.info("Cliente encontrado: {}", rfc);
                return ResponseEntity.ok(cliente.get());
            } else {
                log.info("Cliente no encontrado: {}", rfc);
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            log.error("Error al buscar cliente por RFC: {}", rfc, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Listar todos los clientes activos
     */
    @GetMapping("/clientes")
    public ResponseEntity<List<ClienteResponseDto>> listarClientesActivos() {
        log.info("Listando todos los clientes activos");
        
        try {
            List<ClienteResponseDto> clientes = clienteService.listarClientesActivos();
            log.info("Encontrados {} clientes activos", clientes.size());
            return ResponseEntity.ok(clientes);
            
        } catch (Exception e) {
            log.error("Error al listar clientes activos", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Health check del microservicio
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        log.info("Health check solicitado");
        return ResponseEntity.ok("CDP Microservice is running");
    }
}
