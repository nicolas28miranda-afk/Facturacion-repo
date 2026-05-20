package com.cibercom.cdp.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcesarFacturaResponseDto {
    
    private Boolean exitoso;
    private String mensaje;
    private Long idCliente;
    private String rfc;
    private String tipoPersona;
    private String nombreCompleto;
    private String email;
    private String codigoPostal;
    private String regimenFiscal;
    private LocalDateTime fechaProcesamiento;
    private Boolean clienteExistente;
    private Boolean datosActualizados;
    
    public static ProcesarFacturaResponseDto exitoso(Long idCliente, String rfc, String tipoPersona, 
                                                    String nombreCompleto, String email, String codigoPostal, 
                                                    String regimenFiscal, Boolean clienteExistente, 
                                                    Boolean datosActualizados) {
        return ProcesarFacturaResponseDto.builder()
                .exitoso(true)
                .mensaje("Cliente procesado exitosamente")
                .idCliente(idCliente)
                .rfc(rfc)
                .tipoPersona(tipoPersona)
                .nombreCompleto(nombreCompleto)
                .email(email)
                .codigoPostal(codigoPostal)
                .regimenFiscal(regimenFiscal)
                .fechaProcesamiento(LocalDateTime.now())
                .clienteExistente(clienteExistente)
                .datosActualizados(datosActualizados)
                .build();
    }
    
    public static ProcesarFacturaResponseDto error(String mensaje) {
        return ProcesarFacturaResponseDto.builder()
                .exitoso(false)
                .mensaje(mensaje)
                .fechaProcesamiento(LocalDateTime.now())
                .build();
    }
}
