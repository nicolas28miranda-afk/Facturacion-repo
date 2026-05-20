package com.cibercom.facturacion_back.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminFacturasAccionesResponse {
    private boolean exitoso;
    private String mensaje;

    @Builder.Default
    private List<UsuarioCatalogoItem> usuariosCatalogo = new ArrayList<>();

    @Builder.Default
    private List<ResumenUsuarioItem> resumenUsuarios = new ArrayList<>();

    @Builder.Default
    private List<ComprobanteAdminItem> comprobantes = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsuarioCatalogoItem {
        private String usuarioId;
        private String noUsuario;
        private String nombreEmpleado;
        private String estatusUsuario;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResumenUsuarioItem {
        private String usuarioId;
        private String noUsuario;
        private String nombreEmpleado;
        private long totalComprobantes;
        private BigDecimal totalImporte;
        private long facturasArticulos;
        private long notasCredito;
        private long nominas;
        private long cartasPorte;
        private long complementosPago;
        private long retenciones;
        private long otros;
        private LocalDateTime ultimaEmision;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComprobanteAdminItem {
        private String uuid;
        private String serie;
        private String folio;
        private Integer tipoFactura;
        private String modulo;
        private String receptorRazonSocial;
        private String receptorRfc;
        private BigDecimal total;
        private LocalDateTime fecha;
        private String estatusFacturacion;
        private String estatusSat;
        private String usuarioId;
        private String noUsuario;
        private String nombreUsuario;
        private String uuidOrigen;
    }
}
