package com.cibercom.facturacion_back.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class TareaOperacionMarcarLeidasRequest {

    @JsonProperty("noUsuarioPara")
    private String noUsuarioPara;
    /** Si null o vacío, marca todas las MENSAJE/NOTIFICACION pendientes del destinatario */
    @JsonProperty("ids")
    private List<Long> ids;

    public String getNoUsuarioPara() {
        return noUsuarioPara;
    }

    public void setNoUsuarioPara(String noUsuarioPara) {
        this.noUsuarioPara = noUsuarioPara;
    }

    public List<Long> getIds() {
        return ids;
    }

    public void setIds(List<Long> ids) {
        this.ids = ids;
    }
}
