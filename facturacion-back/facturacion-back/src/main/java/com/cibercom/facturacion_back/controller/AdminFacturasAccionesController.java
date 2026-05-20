package com.cibercom.facturacion_back.controller;

import com.cibercom.facturacion_back.dto.AdminFacturasAccionesResponse;
import com.cibercom.facturacion_back.service.AdminFacturasAccionesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/facturas-acciones")
@CrossOrigin(origins = "*")
public class AdminFacturasAccionesController {

    private static final Logger logger = LoggerFactory.getLogger(AdminFacturasAccionesController.class);

    @Autowired(required = false)
    private AdminFacturasAccionesService adminFacturasAccionesService;

    @GetMapping
    public ResponseEntity<AdminFacturasAccionesResponse> consultar(
            @RequestParam(required = false) String usuario,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam(required = false) Integer tipoFactura,
            @RequestParam(required = false) String estatus) {
        logger.info("Admin facturas-acciones: usuario={}, desde={}, hasta={}, tipo={}, estatus={}",
                usuario, fechaInicio, fechaFin, tipoFactura, estatus);

        if (adminFacturasAccionesService == null) {
            return ResponseEntity.ok(AdminFacturasAccionesResponse.builder()
                    .exitoso(false)
                    .mensaje("Servicio no disponible")
                    .build());
        }

        AdminFacturasAccionesResponse response = adminFacturasAccionesService.consultar(
                usuario, fechaInicio, fechaFin, tipoFactura, estatus);
        return ResponseEntity.ok(response);
    }
}
