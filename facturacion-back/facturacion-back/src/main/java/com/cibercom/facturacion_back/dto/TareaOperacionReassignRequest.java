package com.cibercom.facturacion_back.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TareaOperacionReassignRequest {

    @JsonProperty("noUsuarioPara")
    private String noUsuarioPara;

    public String getNoUsuarioPara() {
        return noUsuarioPara;
    }

    public void setNoUsuarioPara(String noUsuarioPara) {
        this.noUsuarioPara = noUsuarioPara;
    }
}
