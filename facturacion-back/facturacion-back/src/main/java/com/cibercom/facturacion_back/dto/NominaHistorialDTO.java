package com.cibercom.facturacion_back.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO de historial de nóminas para la tabla de historial en frontend.
 */
public class NominaHistorialDTO {

    @JsonProperty("id")
    private Long id; // ID_FACTURA_NOMINA

    @JsonProperty("idEmpleado")
    private String idEmpleado;

    @JsonProperty("fecha")
    private String fecha; // YYYY-MM-DD (FECHA_PAGO preferente)

    @JsonProperty("estado")
    private String estado; // ESTADO de FACTURAS, si disponible

    @JsonProperty("uuid")
    private String uuid; // UUID/Folio Fiscal si disponible

    @JsonProperty("total")
    private String total;

    @JsonProperty("percepciones")
    private String percepciones;

    @JsonProperty("deducciones")
    private String deducciones;

    @JsonProperty("tipoNomina")
    private String tipoNomina;

    @JsonProperty("folio")
    private String folio;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getIdEmpleado() { return idEmpleado; }
    public void setIdEmpleado(String idEmpleado) { this.idEmpleado = idEmpleado; }

    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getUuid() { return uuid; }
    public void setUuid(String uuid) { this.uuid = uuid; }

    public String getTotal() { return total; }
    public void setTotal(String total) { this.total = total; }

    public String getPercepciones() { return percepciones; }
    public void setPercepciones(String percepciones) { this.percepciones = percepciones; }

    public String getDeducciones() { return deducciones; }
    public void setDeducciones(String deducciones) { this.deducciones = deducciones; }

    public String getTipoNomina() { return tipoNomina; }
    public void setTipoNomina(String tipoNomina) { this.tipoNomina = tipoNomina; }

    public String getFolio() { return folio; }
    public void setFolio(String folio) { this.folio = folio; }
}