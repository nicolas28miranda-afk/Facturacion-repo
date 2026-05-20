package com.cibercom.cdp.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "REGIMENES_FISCALES_CLIENTE")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegimenFiscalCliente {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "regimen_fiscal_cliente_seq")
    @SequenceGenerator(name = "regimen_fiscal_cliente_seq", sequenceName = "REGIMEN_FISCAL_CLIENTE_SEQ", allocationSize = 1)
    @Column(name = "ID_REGIMEN_FISCAL_CLIENTE")
    private Long idRegimenFiscalCliente;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_CLIENTE", nullable = false)
    private Cliente cliente;
    
    @Column(name = "CODIGO_REGIMEN", nullable = false, length = 3)
    private String codigoRegimen;
    
    @Column(name = "DESCRIPCION", length = 500)
    private String descripcion;
    
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
}
