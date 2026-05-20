package com.cibercom.cdp.repository;

import com.cibercom.cdp.model.PersonaFisica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonaFisicaRepository extends JpaRepository<PersonaFisica, Long> {
    
    /**
     * Buscar persona física por RFC del cliente
     */
    @Query("SELECT pf FROM PersonaFisica pf JOIN pf.cliente c WHERE c.rfc = :rfc")
    Optional<PersonaFisica> findByClienteRfc(@Param("rfc") String rfc);
    
    /**
     * Buscar persona física por CURP
     */
    Optional<PersonaFisica> findByCurp(String curp);
    
    /**
     * Buscar personas físicas por nombre
     */
    List<PersonaFisica> findByNombreContainingIgnoreCase(String nombre);
    
    /**
     * Buscar personas físicas por apellido paterno
     */
    List<PersonaFisica> findByApellidoPaternoContainingIgnoreCase(String apellidoPaterno);
    
    /**
     * Buscar personas físicas por apellido materno
     */
    List<PersonaFisica> findByApellidoMaternoContainingIgnoreCase(String apellidoMaterno);
    
    /**
     * Buscar personas físicas por nombre completo
     */
    @Query("SELECT pf FROM PersonaFisica pf WHERE " +
           "LOWER(pf.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')) AND " +
           "LOWER(pf.apellidoPaterno) LIKE LOWER(CONCAT('%', :apellidoPaterno, '%')) AND " +
           "LOWER(pf.apellidoMaterno) LIKE LOWER(CONCAT('%', :apellidoMaterno, '%'))")
    List<PersonaFisica> buscarPorNombreCompleto(@Param("nombre") String nombre, 
                                               @Param("apellidoPaterno") String apellidoPaterno, 
                                               @Param("apellidoMaterno") String apellidoMaterno);
    
    /**
     * Verificar si existe una persona física con el CURP dado
     */
    boolean existsByCurp(String curp);
}
