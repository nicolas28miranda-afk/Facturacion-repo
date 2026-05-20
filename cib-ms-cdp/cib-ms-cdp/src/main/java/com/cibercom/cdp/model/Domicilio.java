package com.cibercom.cdp.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "DOMICILIOS")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Domicilio {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "domicilio_seq")
    @SequenceGenerator(name = "domicilio_seq", sequenceName = "DOMICILIO_SEQ", allocationSize = 1)
    @Column(name = "ID_DOMICILIO")
    private Long idDomicilio;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_CLIENTE", nullable = false)
    private Cliente cliente;
    
    @Column(name = "TIPO_VIALIDAD", length = 50)
    private String tipoVialidad;
    
    @Column(name = "CALLE", nullable = false, length = 200)
    private String calle;
    
    @Column(name = "NUMERO_EXTERIOR", nullable = false, length = 20)
    private String numeroExterior;
    
    @Column(name = "NUMERO_INTERIOR", length = 20)
    private String numeroInterior;
    
    @Column(name = "COLONIA", nullable = false, length = 100)
    private String colonia;
    
    @Column(name = "LOCALIDAD", length = 100)
    private String localidad;
    
    @Column(name = "MUNICIPIO", nullable = false, length = 100)
    private String municipio;
    
    @Column(name = "ENTIDAD_FEDERATIVA", nullable = false, length = 100)
    private String entidadFederativa;
    
    @Column(name = "CODIGO_POSTAL", nullable = false, length = 5)
    private String codigoPostal;
    
    @Column(name = "ENTRE_CALLE", length = 200)
    private String entreCalle;
    
    @Column(name = "Y_CALLE", length = 200)
    private String yCalle;
    
    // Getter para compatibilidad
    public String getyCalle() {
        return yCalle;
    }
    
    @Column(name = "TIPO_DOMICILIO", length = 20)
    @Enumerated(EnumType.STRING)
    private TipoDomicilio tipoDomicilio;
    
    @Column(name = "ACTIVO")
    private Boolean activo;
    
    @Column(name = "FECHA_CREACION")
    private LocalDateTime fechaCreacion;
    
    @Column(name = "FECHA_ULTIMA_ACTUALIZACION")
    private LocalDateTime fechaUltimaActualizacion;
    
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
    
    public enum TipoDomicilio {
        FISCAL("Fiscal"),
        COMERCIAL("Comercial"),
        PARTICULAR("Particular");
        
        private final String descripcion;
        
        TipoDomicilio(String descripcion) {
            this.descripcion = descripcion;
        }
        
        public String getDescripcion() {
            return descripcion;
        }
    }
    
    // Método para obtener la dirección completa
    public String getDireccionCompleta() {
        StringBuilder direccion = new StringBuilder();
        
        if (calle != null) {
            direccion.append(calle);
        }
        
        if (numeroExterior != null) {
            direccion.append(" ").append(numeroExterior);
        }
        
        if (numeroInterior != null && !numeroInterior.trim().isEmpty()) {
            direccion.append(" Int. ").append(numeroInterior);
        }
        
        if (colonia != null) {
            direccion.append(", ").append(colonia);
        }
        
        if (municipio != null) {
            direccion.append(", ").append(municipio);
        }
        
        if (entidadFederativa != null) {
            direccion.append(", ").append(entidadFederativa);
        }
        
        if (codigoPostal != null) {
            direccion.append(" ").append(codigoPostal);
        }
        
        return direccion.toString();
    }
}
