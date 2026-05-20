package com.cibercom.cdp.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Email;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcesarFacturaRequestDto {
    
    @NotBlank(message = "El RFC es obligatorio")
    private String rfc;
    
    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;
    
    private String primerApellido;
    private String segundoApellido;
    private String curp;
    
    // Datos de domicilio
    @NotBlank(message = "La calle es obligatoria")
    private String calle;
    
    @NotBlank(message = "El número exterior es obligatorio")
    private String numExt;
    
    private String numInt;
    
    @NotBlank(message = "La colonia es obligatoria")
    private String colonia;
    
    private String localidad;
    
    @NotBlank(message = "El municipio es obligatorio")
    private String municipio;
    
    @NotBlank(message = "La entidad federativa es obligatoria")
    private String entidadFederativa;
    
    private String entreCalle;
    private String yCalle;
    
    // Getter para compatibilidad
    public String getyCalle() {
        return yCalle;
    }
    
    @NotBlank(message = "El código postal es obligatorio")
    private String cp;
    
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Formato de email inválido")
    private String email;
    
    @NotNull(message = "Los regímenes fiscales son obligatorios")
    private List<String> regimenesFiscales;
    
    private String fechaUltimaActualizacion;
}
