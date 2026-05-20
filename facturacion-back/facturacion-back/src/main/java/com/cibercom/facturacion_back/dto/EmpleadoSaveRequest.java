package com.cibercom.facturacion_back.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Alta de trabajador en catálogo EMPLEADOS (desde pantalla de nóminas).
 */
public class EmpleadoSaveRequest {

    @JsonProperty("noEmpleado")
    private String noEmpleado;

    @JsonProperty("rfc")
    private String rfc;

    @JsonProperty("curp")
    private String curp;

    @JsonProperty("nombre")
    private String nombre;

    @JsonProperty("apellidoPaterno")
    private String apellidoPaterno;

    @JsonProperty("apellidoMaterno")
    private String apellidoMaterno;

    @JsonProperty("correoElectronico")
    private String correoElectronico;

    @JsonProperty("telefono")
    private String telefono;

    @JsonProperty("codigoPostal")
    private String codigoPostal;

    @JsonProperty("numSeguridadSocial")
    private String numSeguridadSocial;

    @JsonProperty("salarioDiarioIntegrado")
    private String salarioDiarioIntegrado;

    @JsonProperty("periodicidadPago")
    private String periodicidadPago;

    @JsonProperty("salarioBase")
    private String salarioBase;

    @JsonProperty("fechaIngreso")
    private String fechaIngreso;

    public String getNoEmpleado() { return noEmpleado; }
    public void setNoEmpleado(String noEmpleado) { this.noEmpleado = noEmpleado; }

    public String getRfc() { return rfc; }
    public void setRfc(String rfc) { this.rfc = rfc; }

    public String getCurp() { return curp; }
    public void setCurp(String curp) { this.curp = curp; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellidoPaterno() { return apellidoPaterno; }
    public void setApellidoPaterno(String apellidoPaterno) { this.apellidoPaterno = apellidoPaterno; }

    public String getApellidoMaterno() { return apellidoMaterno; }
    public void setApellidoMaterno(String apellidoMaterno) { this.apellidoMaterno = apellidoMaterno; }

    public String getCorreoElectronico() { return correoElectronico; }
    public void setCorreoElectronico(String correoElectronico) { this.correoElectronico = correoElectronico; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getCodigoPostal() { return codigoPostal; }
    public void setCodigoPostal(String codigoPostal) { this.codigoPostal = codigoPostal; }

    public String getNumSeguridadSocial() { return numSeguridadSocial; }
    public void setNumSeguridadSocial(String numSeguridadSocial) { this.numSeguridadSocial = numSeguridadSocial; }

    public String getSalarioDiarioIntegrado() { return salarioDiarioIntegrado; }
    public void setSalarioDiarioIntegrado(String salarioDiarioIntegrado) { this.salarioDiarioIntegrado = salarioDiarioIntegrado; }

    public String getPeriodicidadPago() { return periodicidadPago; }
    public void setPeriodicidadPago(String periodicidadPago) { this.periodicidadPago = periodicidadPago; }

    public String getSalarioBase() { return salarioBase; }
    public void setSalarioBase(String salarioBase) { this.salarioBase = salarioBase; }

    public String getFechaIngreso() { return fechaIngreso; }
    public void setFechaIngreso(String fechaIngreso) { this.fechaIngreso = fechaIngreso; }
}
