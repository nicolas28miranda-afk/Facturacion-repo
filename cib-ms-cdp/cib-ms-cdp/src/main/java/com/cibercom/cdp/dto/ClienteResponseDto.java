package com.cibercom.cdp.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClienteResponseDto {
    
    private Long idCliente;
    private String rfc;
    private String tipoPersona;
    private String email;
    private String codigoPostal;
    private String regimenFiscal;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaUltimaActualizacion;
    private Boolean activo;
    
    // Datos específicos para Persona Física
    private String nombre;
    private String segundoNombre;
    private String apellidoPaterno;
    private String apellidoMaterno;
    private String curp;
    private String nombreCompleto;
    
    // Datos específicos para Persona Moral
    private String razonSocial;
    
    // Datos de domicilio
    private String calle;
    private String numeroExterior;
    private String numeroInterior;
    private String colonia;
    private String localidad;
    private String municipio;
    private String entidadFederativa;
    private String entreCalle;
    private String yCalle;
    private String direccionCompleta;
    
    // Lista de regímenes fiscales
    private List<RegimenFiscalDto> regimenesFiscales;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegimenFiscalDto {
        private Long idRegimenFiscalCliente;
        private String codigoRegimen;
        private String descripcion;
        private Boolean activo;
        private LocalDateTime fechaCreacion;
    }
}
