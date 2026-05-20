package com.cibercom.cdp.model;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "CLIENTES")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cliente {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "cliente_seq")
    @SequenceGenerator(name = "cliente_seq", sequenceName = "CLIENTE_SEQ", allocationSize = 1)
    @Column(name = "ID_CLIENTE")
    private Long idCliente;
    
    @Column(name = "RFC", nullable = false, unique = true, length = 13)
    private String rfc;
    
    @Column(name = "TIPO_PERSONA", nullable = false, length = 1)
    @Enumerated(EnumType.STRING)
    private TipoPersona tipoPersona;
    
    @Column(name = "EMAIL", length = 255)
    private String email;
    
    @Column(name = "CODIGO_POSTAL", length = 5)
    private String codigoPostal;
    
    @Column(name = "REGIMEN_FISCAL", length = 3)
    private String regimenFiscal;
    
    @Column(name = "FECHA_CREACION")
    private LocalDateTime fechaCreacion;
    
    @Column(name = "FECHA_ULTIMA_ACTUALIZACION")
    private LocalDateTime fechaUltimaActualizacion;
    
    @Column(name = "ACTIVO")
    private Boolean activo;
    
    // Relación con PersonaFisica
    @OneToOne(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private PersonaFisica personaFisica;
    
    // Relación con PersonaMoral
    @OneToOne(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private PersonaMoral personaMoral;
    
    // Relación con RegimenesFiscales
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<RegimenFiscalCliente> regimenesFiscales;
    
    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaUltimaActualizacion = LocalDateTime.now();
        activo = true;
    }
    
    @PreUpdate
    protected void onUpdate() {
        fechaUltimaActualizacion = LocalDateTime.now();
    }
    
    public enum TipoPersona {
        F("Persona Física"),
        M("Persona Moral");
        
        private final String descripcion;
        
        TipoPersona(String descripcion) {
            this.descripcion = descripcion;
        }
        
        public String getDescripcion() {
            return descripcion;
        }
    }
}
