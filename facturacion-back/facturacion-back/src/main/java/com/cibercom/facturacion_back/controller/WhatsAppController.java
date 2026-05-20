package com.cibercom.facturacion_back.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.cibercom.facturacion_back.service.WhatsAppService;

import java.util.HashMap;
import java.util.Map;

/**
 * Controlador para envío de facturas por WhatsApp (Meta Cloud API).
 */
@RestController
@RequestMapping("/api/whatsapp")
@CrossOrigin(origins = "*")
public class WhatsAppController {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppController.class);

    @Autowired
    private WhatsAppService whatsAppService;

    @PostMapping("/enviar-factura")
    public ResponseEntity<Map<String, Object>> enviarFacturaPorWhatsApp(
            @RequestBody EnvioWhatsAppRequest request) {

        Map<String, Object> response = new HashMap<>();

        try {
            if (request.getUuidFactura() == null || request.getUuidFactura().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "UUID de factura es requerido");
                return ResponseEntity.badRequest().body(response);
            }

            if (request.getNumeroDestino() == null || request.getNumeroDestino().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Número de destino es requerido");
                return ResponseEntity.badRequest().body(response);
            }

            if (!whatsAppService.estaConfigurado()) {
                response.put("success", false);
                response.put("message",
                        "WhatsApp no está configurado. Define WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID "
                                + "(o whatsapp.access-token y whatsapp.phone-number-id en application.yml).");
                return ResponseEntity.status(503).body(response);
            }

            Map<String, Object> result = whatsAppService.enviarFacturaPorWhatsApp(
                    request.getUuidFactura().trim(),
                    request.getNumeroDestino().trim(),
                    request.getMensaje() != null ? request.getMensaje().trim() : "",
                    request.getLogoBase64());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            logger.error("Error al enviar factura por WhatsApp: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Error al enviar: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/verificar-configuracion")
    public ResponseEntity<Map<String, Object>> verificarConfiguracion() {
        Map<String, Object> response = new HashMap<>();
        boolean ok = whatsAppService.estaConfigurado();
        response.put("configurado", ok);
        response.put("message", ok
                ? "WhatsApp está configurado"
                : "WhatsApp no está configurado. Agrega token y phone-number-id (ver application.yml).");
        return ResponseEntity.ok(response);
    }

    public static class EnvioWhatsAppRequest {
        private String uuidFactura;
        private String numeroDestino;
        private String mensaje;
        private String logoBase64;

        public String getUuidFactura() {
            return uuidFactura;
        }

        public void setUuidFactura(String uuidFactura) {
            this.uuidFactura = uuidFactura;
        }

        public String getNumeroDestino() {
            return numeroDestino;
        }

        public void setNumeroDestino(String numeroDestino) {
            this.numeroDestino = numeroDestino;
        }

        public String getMensaje() {
            return mensaje;
        }

        public void setMensaje(String mensaje) {
            this.mensaje = mensaje;
        }

        public String getLogoBase64() {
            return logoBase64;
        }

        public void setLogoBase64(String logoBase64) {
            this.logoBase64 = logoBase64;
        }
    }
}
