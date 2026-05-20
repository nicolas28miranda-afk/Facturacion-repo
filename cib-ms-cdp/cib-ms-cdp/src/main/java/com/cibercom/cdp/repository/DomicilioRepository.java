package com.cibercom.cdp.repository;

import com.cibercom.cdp.model.Domicilio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DomicilioRepository extends JpaRepository<Domicilio, Long> {
    
    /**
     * Buscar domicilios por RFC del cliente
     */
    @Query("SELECT d FROM Domicilio d JOIN d.cliente c WHERE c.rfc = :rfc")
    List<Domicilio> findByClienteRfc(@Param("rfc") String rfc);
    
    /**
     * Buscar domicilios activos por RFC del cliente
     */
    @Query("SELECT d FROM Domicilio d JOIN d.cliente c WHERE c.rfc = :rfc AND d.activo = true")
    List<Domicilio> findActivosByClienteRfc(@Param("rfc") String rfc);
    
    /**
     * Buscar domicilio fiscal por RFC del cliente
     */
    @Query("SELECT d FROM Domicilio d JOIN d.cliente c WHERE c.rfc = :rfc AND d.tipoDomicilio = 'FISCAL' AND d.activo = true")
    Optional<Domicilio> findDomicilioFiscalByClienteRfc(@Param("rfc") String rfc);
    
    /**
     * Buscar domicilios por código postal
     */
    List<Domicilio> findByCodigoPostal(String codigoPostal);
    
    /**
     * Buscar domicilios por municipio
     */
    List<Domicilio> findByMunicipioContainingIgnoreCase(String municipio);
    
    /**
     * Buscar domicilios por entidad federativa
     */
    List<Domicilio> findByEntidadFederativaContainingIgnoreCase(String entidadFederativa);
    
    /**
     * Buscar domicilios por tipo de domicilio
     */
    List<Domicilio> findByTipoDomicilio(Domicilio.TipoDomicilio tipoDomicilio);
    
    /**
     * Buscar domicilios activos por tipo de domicilio
     */
    List<Domicilio> findByTipoDomicilioAndActivoTrue(Domicilio.TipoDomicilio tipoDomicilio);
}
