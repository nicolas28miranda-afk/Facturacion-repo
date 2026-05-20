package com.cibercom.facturacion_back.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class TareaOperacionDto {

    private Long id;
    private String tipo;
    private String asunto;
    private String cuerpo;
    @JsonProperty("noUsuarioDe")
    private String noUsuarioDe;
    @JsonProperty("noUsuarioPara")
    private String noUsuarioPara;
    private String estado;
    @JsonProperty("fechaIso")
    private String fechaIso;
    @JsonProperty("fechaVencimientoIso")
    private String fechaVencimientoIso;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getAsunto() {
        return asunto;
    }

    public void setAsunto(String asunto) {
        this.asunto = asunto;
    }

    public String getCuerpo() {
        return cuerpo;
    }

    public void setCuerpo(String cuerpo) {
        this.cuerpo = cuerpo;
    }

    public String getNoUsuarioDe() {
        return noUsuarioDe;
    }

    public void setNoUsuarioDe(String noUsuarioDe) {
        this.noUsuarioDe = noUsuarioDe;
    }

    public String getNoUsuarioPara() {
        return noUsuarioPara;
    }

    public void setNoUsuarioPara(String noUsuarioPara) {
        this.noUsuarioPara = noUsuarioPara;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getFechaIso() {
        return fechaIso;
    }

    public void setFechaIso(String fechaIso) {
        this.fechaIso = fechaIso;
    }

    public String getFechaVencimientoIso() {
        return fechaVencimientoIso;
    }

    public void setFechaVencimientoIso(String fechaVencimientoIso) {
        this.fechaVencimientoIso = fechaVencimientoIso;
    }
}
