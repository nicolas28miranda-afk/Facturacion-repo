package com.cibercom.cdp.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "PERSONAS_FISICAS")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonaFisica {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "persona_fisica_seq")
    @SequenceGenerator(name = "persona_fisica_seq", sequenceName = "PERSONA_FISICA_SEQ", allocationSize = 1)
    @Column(name = "ID_PERSONA_FISICA")
    private Long idPersonaFisica;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_CLIENTE", nullable = false)
    private Cliente cliente;
    
    @Column(name = "NOMBRE", nullable = false, length = 100)
    private String nombre;
    
    @Column(name = "SEGUNDO_NOMBRE", length = 100)
    private String segundoNombre;
    
    @Column(name = "APELLIDO_PATERNO", nullable = false, length = 100)
    private String apellidoPaterno;
    
    @Column(name = "APELLIDO_MATERNO", length = 100)
    private String apellidoMaterno;
    
    // Getters y setters para compatibilidad
    public String getPrimerApellido() {
        return apellidoPaterno;
    }
    
    public void setPrimerApellido(String primerApellido) {
        this.apellidoPaterno = primerApellido;
    }
    
    public String getSegundoApellido() {
        return apellidoMaterno;
    }
    
    public void setSegundoApellido(String segundoApellido) {
        this.apellidoMaterno = segundoApellido;
    }
    
    @Column(name = "CURP", length = 18)
    private String curp;
    
    @Column(name = "FECHA_NACIMIENTO")
    private LocalDateTime fechaNacimiento;
    
    @Column(name = "FECHA_CREACION")
    private LocalDateTime fechaCreacion;
    
    @Column(name = "FECHA_ULTIMA_ACTUALIZACION")
    private LocalDateTime fechaUltimaActualizacion;
    
    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaUltimaActualizacion = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        fechaUltimaActualizacion = LocalDateTime.now();
    }
    
    // Método para obtener el nombre completo
    public String getNombreCompleto() {
        StringBuilder nombreCompleto = new StringBuilder();
        
        if (nombre != null) {
            nombreCompleto.append(nombre);
        }
        
        if (segundoNombre != null && !segundoNombre.trim().isEmpty()) {
            nombreCompleto.append(" ").append(segundoNombre);
        }
        
        if (apellidoPaterno != null) {
            nombreCompleto.append(" ").append(apellidoPaterno);
        }
        
        if (apellidoMaterno != null && !apellidoMaterno.trim().isEmpty()) {
            nombreCompleto.append(" ").append(apellidoMaterno);
        }
        
        return nombreCompleto.toString().trim();
    }
}
