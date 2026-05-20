package com.cibercom.facturacion_back.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TareaOperacionCreateRequest {

    private String tipo;
    private String asunto;
    private String cuerpo;
    @JsonProperty("noUsuarioDe")
    private String noUsuarioDe;
    @JsonProperty("noUsuarioPara")
    private String noUsuarioPara;
    /** ISO-8601 fecha (solo día) o null */
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

    public String getNoUsuarioPara() {
        return noUsuarioPara;
    }

    public void setNoUsuarioPara(String noUsuarioPara) {
        this.noUsuarioPara = noUsuarioPara;
    }

    public String getFechaVencimientoIso() {
        return fechaVencimientoIso;
    }

    public void setFechaVencimientoIso(String fechaVencimientoIso) {
        this.fechaVencimientoIso = fechaVencimientoIso;
    }
}
