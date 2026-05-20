package com.cibercom.cdp.repository;

import com.cibercom.cdp.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    
    /**
     * Buscar cliente por RFC
     */
    Optional<Cliente> findByRfc(String rfc);
    
    /**
     * Buscar cliente por RFC y activo
     */
    Optional<Cliente> findByRfcAndActivoTrue(String rfc);
    
    /**
     * Buscar clientes por tipo de persona
     */
    List<Cliente> findByTipoPersona(Cliente.TipoPersona tipoPersona);
    
    /**
     * Buscar clientes activos por tipo de persona
     */
    List<Cliente> findByTipoPersonaAndActivoTrue(Cliente.TipoPersona tipoPersona);
    
    /**
     * Buscar clientes por email
     */
    List<Cliente> findByEmail(String email);
    
    /**
     * Buscar clientes por código postal
     */
    List<Cliente> findByCodigoPostal(String codigoPostal);
    
    /**
     * Buscar clientes por régimen fiscal
     */
    List<Cliente> findByRegimenFiscal(String regimenFiscal);
    
    /**
     * Buscar clientes activos
     */
    List<Cliente> findByActivoTrue();
    
    /**
     * Verificar si existe un cliente con el RFC dado
     */
    boolean existsByRfc(String rfc);
    
    /**
     * Buscar clientes por nombre (para persona física)
     */
    @Query("SELECT c FROM Cliente c JOIN c.personaFisica pf WHERE " +
           "LOWER(pf.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
           "LOWER(pf.apellidoPaterno) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
           "LOWER(pf.apellidoMaterno) LIKE LOWER(CONCAT('%', :nombre, '%'))")
    List<Cliente> buscarPorNombrePersonaFisica(@Param("nombre") String nombre);
    
    /**
     * Buscar clientes por razón social (para persona moral)
     */
    @Query("SELECT c FROM Cliente c JOIN c.personaMoral pm WHERE " +
           "LOWER(pm.razonSocial) LIKE LOWER(CONCAT('%', :razonSocial, '%'))")
    List<Cliente> buscarPorRazonSocial(@Param("razonSocial") String razonSocial);
    
    /**
     * Contar clientes por tipo de persona
     */
    long countByTipoPersona(Cliente.TipoPersona tipoPersona);
    
    /**
     * Contar clientes activos por tipo de persona
     */
    long countByTipoPersonaAndActivoTrue(Cliente.TipoPersona tipoPersona);
}
