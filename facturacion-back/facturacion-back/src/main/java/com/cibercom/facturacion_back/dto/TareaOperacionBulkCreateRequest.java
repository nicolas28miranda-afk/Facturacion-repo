package com.cibercom.facturacion_back.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class TareaOperacionBulkCreateRequest {

    private String tipo;
    private String asunto;
    private String cuerpo;
    @JsonProperty("noUsuarioDe")
    private String noUsuarioDe;
    @JsonProperty("noUsuariosPara")
    private List<String> noUsuariosPara;
    @JsonProperty("fechaVencimientoIso")
    private String fechaVencimientoIso;

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

    public List<String> getNoUsuariosPara() {
        return noUsuariosPara;
    }

    public void setNoUsuariosPara(List<String> noUsuariosPara) {
        this.noUsuariosPara = noUsuariosPara;
    }

    public String getFechaVencimientoIso() {
        return fechaVencimientoIso;
    }

    public void setFechaVencimientoIso(String fechaVencimientoIso) {
        this.fechaVencimientoIso = fechaVencimientoIso;
    }
}
