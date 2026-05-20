package com.cibercom.cdp.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Email;
import javax.validation.constraints.Pattern;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClienteRequestDto {
    
    @NotBlank(message = "El RFC es obligatorio")
    @Pattern(regexp = "^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$", message = "Formato de RFC inválido")
    private String rfc;
    
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Formato de email inválido")
    private String email;
    
    @NotBlank(message = "El código postal es obligatorio")
    @Pattern(regexp = "^[0-9]{5}$", message = "El código postal debe tener 5 dígitos")
    private String codigoPostal;
    
    @NotBlank(message = "El régimen fiscal es obligatorio")
    private String regimenFiscal;
    
    // Datos específicos para Persona Física
    private String nombre;
    private String segundoNombre;
    private String apellidoPaterno;
    private String apellidoMaterno;
    private String curp;
    
    // Datos específicos para Persona Moral
    private String razonSocial;
    
    // Datos de domicilio
    @NotBlank(message = "La calle es obligatoria")
    private String calle;
    
    @NotBlank(message = "El número exterior es obligatorio")
    private String numeroExterior;
    
    private String numeroInterior;
    
    @NotBlank(message = "La colonia es obligatoria")
    private String colonia;
    
    private String localidad;
    
    @NotBlank(message = "El municipio es obligatorio")
    private String municipio;
    
    @NotBlank(message = "La entidad federativa es obligatoria")
    private String entidadFederativa;
    
    private String entreCalle;
    private String yCalle;
    
    // Lista de regímenes fiscales adicionales
    private List<String> regimenesFiscalesAdicionales;
}
