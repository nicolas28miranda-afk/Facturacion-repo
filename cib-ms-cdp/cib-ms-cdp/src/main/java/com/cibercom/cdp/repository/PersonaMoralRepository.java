package com.cibercom.cdp.repository;

import com.cibercom.cdp.model.PersonaMoral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonaMoralRepository extends JpaRepository<PersonaMoral, Long> {
    
    /**
     * Buscar persona moral por RFC del cliente
     */
    @Query("SELECT pm FROM PersonaMoral pm JOIN pm.cliente c WHERE c.rfc = :rfc")
    Optional<PersonaMoral> findByClienteRfc(@Param("rfc") String rfc);
    
    /**
     * Buscar personas morales por razón social
     */
    List<PersonaMoral> findByRazonSocialContainingIgnoreCase(String razonSocial);
    
    /**
     * Buscar personas morales por razón social exacta
     */
    Optional<PersonaMoral> findByRazonSocial(String razonSocial);
    
    /**
     * Buscar personas morales por razón social que contenga el texto
     */
    @Query("SELECT pm FROM PersonaMoral pm WHERE " +
           "LOWER(pm.razonSocial) LIKE LOWER(CONCAT('%', :razonSocial, '%'))")
    List<PersonaMoral> buscarPorRazonSocialContaining(@Param("razonSocial") String razonSocial);
}
