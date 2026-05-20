package com.cibercom.cdp.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "PERSONAS_MORALES")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonaMoral {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "persona_moral_seq")
    @SequenceGenerator(name = "persona_moral_seq", sequenceName = "PERSONA_MORAL_SEQ", allocationSize = 1)
    @Column(name = "ID_PERSONA_MORAL")
    private Long idPersonaMoral;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_CLIENTE", nullable = false)
    private Cliente cliente;
    
    @Column(name = "RAZON_SOCIAL", nullable = false, length = 200)
    private String razonSocial;
    
    @Column(name = "FECHA_CONSTITUCION")
    private LocalDateTime fechaConstitucion;
    
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
}
