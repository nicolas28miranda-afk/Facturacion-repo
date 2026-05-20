package com.cibercom.cdp.repository;

import com.cibercom.cdp.model.RegimenFiscalCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegimenFiscalClienteRepository extends JpaRepository<RegimenFiscalCliente, Long> {
    
    /**
     * Buscar regímenes fiscales por RFC del cliente
     */
    @Query("SELECT rfc FROM RegimenFiscalCliente rfc JOIN rfc.cliente c WHERE c.rfc = :rfc")
    List<RegimenFiscalCliente> findByClienteRfc(@Param("rfc") String rfc);
    
    /**
     * Buscar regímenes fiscales activos por RFC del cliente
     */
    @Query("SELECT rfc FROM RegimenFiscalCliente rfc JOIN rfc.cliente c WHERE c.rfc = :rfc AND rfc.activo = true")
    List<RegimenFiscalCliente> findActivosByClienteRfc(@Param("rfc") String rfc);
    
    /**
     * Buscar régimen fiscal por código y RFC del cliente
     */
    @Query("SELECT rfc FROM RegimenFiscalCliente rfc JOIN rfc.cliente c WHERE c.rfc = :rfc AND rfc.codigoRegimen = :codigoRegimen")
    Optional<RegimenFiscalCliente> findByClienteRfcAndCodigoRegimen(@Param("rfc") String rfc, @Param("codigoRegimen") String codigoRegimen);
    
    /**
     * Buscar regímenes fiscales por código
     */
    List<RegimenFiscalCliente> findByCodigoRegimen(String codigoRegimen);
    
    /**
     * Buscar regímenes fiscales activos por código
     */
    List<RegimenFiscalCliente> findByCodigoRegimenAndActivoTrue(String codigoRegimen);
    
    /**
     * Verificar si existe un régimen fiscal para el cliente
     */
    @Query("SELECT COUNT(rfc) > 0 FROM RegimenFiscalCliente rfc JOIN rfc.cliente c WHERE c.rfc = :rfc AND rfc.codigoRegimen = :codigoRegimen")
    boolean existsByClienteRfcAndCodigoRegimen(@Param("rfc") String rfc, @Param("codigoRegimen") String codigoRegimen);
}
