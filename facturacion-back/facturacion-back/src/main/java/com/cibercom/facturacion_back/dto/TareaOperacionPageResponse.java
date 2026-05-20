package com.cibercom.facturacion_back.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class TareaOperacionPageResponse {

    private List<TareaOperacionDto> content;
    @JsonProperty("totalElements")
    private long totalElements;

    public TareaOperacionPageResponse() {
    }

    public TareaOperacionPageResponse(List<TareaOperacionDto> content, long totalElements) {
        this.content = content;
        this.totalElements = totalElements;
    }

    public List<TareaOperacionDto> getContent() {
        return content;
    }

    public void setContent(List<TareaOperacionDto> content) {
        this.content = content;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }
}
