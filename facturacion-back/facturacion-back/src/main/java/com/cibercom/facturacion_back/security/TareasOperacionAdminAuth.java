package com.cibercom.facturacion_back.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Si {@code app.tareas-operacion.admin-secret} está definido y no vacío,
 * las operaciones de administración exigen la cabecera {@code X-Tareas-Operacion-Admin} con el mismo valor.
 */
@Component
public class TareasOperacionAdminAuth {

    @Value("${app.tareas-operacion.admin-secret:}")
    private String adminSecret;

    public void verifyOptionalAdmin(String headerValue) {
        if (adminSecret == null || adminSecret.isBlank()) {
            return;
        }
        if (adminSecret.equals(headerValue)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Se requiere cabecera X-Tareas-Operacion-Admin válida para esta operación");
    }
}
