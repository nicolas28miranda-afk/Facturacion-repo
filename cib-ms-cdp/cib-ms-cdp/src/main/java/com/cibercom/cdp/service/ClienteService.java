package com.cibercom.cdp.service;

import com.cibercom.cdp.dto.ClienteResponseDto;
import com.cibercom.cdp.dto.ProcesarFacturaRequestDto;
import com.cibercom.cdp.dto.ProcesarFacturaResponseDto;
import com.cibercom.cdp.model.*;
import com.cibercom.cdp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ClienteService {
    
    private final ClienteRepository clienteRepository;
    private final PersonaFisicaRepository personaFisicaRepository;
    private final PersonaMoralRepository personaMoralRepository;
    private final DomicilioRepository domicilioRepository;
    private final RegimenFiscalClienteRepository regimenFiscalClienteRepository;
    
    /**
     * Procesar datos de factura CFDI y almacenar/actualizar cliente
     */
    public ProcesarFacturaResponseDto procesarFactura(ProcesarFacturaRequestDto request) {
        try {
            log.info("Procesando factura para RFC: {}", request.getRfc());
            
            // Determinar tipo de persona basado en el RFC
            Cliente.TipoPersona tipoPersona = determinarTipoPersona(request.getRfc());
            
            // Buscar cliente existente
            Optional<Cliente> clienteExistente = clienteRepository.findByRfc(request.getRfc());
            
            if (clienteExistente.isPresent()) {
                return actualizarClienteExistente(clienteExistente.get(), request, tipoPersona);
            } else {
                return crearNuevoCliente(request, tipoPersona);
            }
            
        } catch (Exception e) {
            log.error("Error al procesar factura para RFC: {}", request.getRfc(), e);
            return ProcesarFacturaResponseDto.error("Error al procesar la factura: " + e.getMessage());
        }
    }
    
    /**
     * Determinar si es persona física o moral basado en el RFC
     */
    private Cliente.TipoPersona determinarTipoPersona(String rfc) {
        if (rfc.length() == 13) {
            // RFC de persona física: 4 letras + 6 dígitos + 3 caracteres
            return Cliente.TipoPersona.F;
        } else if (rfc.length() == 12) {
            // RFC de persona moral: 3 letras + 6 dígitos + 3 caracteres
            return Cliente.TipoPersona.M;
        } else {
            // Por defecto, asumir persona física
            return Cliente.TipoPersona.F;
        }
    }
    
    /**
     * Actualizar cliente existente
     */
    private ProcesarFacturaResponseDto actualizarClienteExistente(Cliente cliente, 
                                                                  ProcesarFacturaRequestDto request, 
                                                                  Cliente.TipoPersona tipoPersona) {
        log.info("Actualizando cliente existente: {}", cliente.getRfc());
        
        boolean datosActualizados = false;
        
        // Actualizar datos básicos del cliente
        if (cliente.getEmail() == null || !cliente.getEmail().equals(request.getEmail())) {
            cliente.setEmail(request.getEmail());
            datosActualizados = true;
        }
        
        if (cliente.getCodigoPostal() == null || !cliente.getCodigoPostal().equals(request.getCp())) {
            cliente.setCodigoPostal(request.getCp());
            datosActualizados = true;
        }
        
        // Actualizar datos específicos según tipo de persona
        if (tipoPersona == Cliente.TipoPersona.F) {
            datosActualizados = actualizarPersonaFisica(cliente, request) || datosActualizados;
        } else {
            datosActualizados = actualizarPersonaMoral(cliente, request) || datosActualizados;
        }
        
        // Actualizar domicilio
        datosActualizados = actualizarDomicilio(cliente, request) || datosActualizados;
        
        // Actualizar regímenes fiscales
        datosActualizados = actualizarRegimenesFiscales(cliente, request) || datosActualizados;
        
        cliente.setFechaUltimaActualizacion(LocalDateTime.now());
        clienteRepository.save(cliente);
        
        return ProcesarFacturaResponseDto.exitoso(
            cliente.getIdCliente(),
            cliente.getRfc(),
            cliente.getTipoPersona().name(),
            obtenerNombreCompleto(cliente),
            cliente.getEmail(),
            cliente.getCodigoPostal(),
            cliente.getRegimenFiscal(),
            true, // clienteExistente
            datosActualizados
        );
    }
    
    /**
     * Crear nuevo cliente
     */
    private ProcesarFacturaResponseDto crearNuevoCliente(ProcesarFacturaRequestDto request, 
                                                        Cliente.TipoPersona tipoPersona) {
        log.info("Creando nuevo cliente: {}", request.getRfc());
        
        // Crear cliente base
        String codigoRegimen = "000"; // Valor por defecto
        if (request.getRegimenesFiscales() != null && !request.getRegimenesFiscales().isEmpty()) {
            codigoRegimen = extraerCodigoRegimen(request.getRegimenesFiscales().get(0)); // Solo el código del primer régimen
        }
        
        Cliente cliente = Cliente.builder()
                .rfc(request.getRfc())
                .tipoPersona(tipoPersona)
                .email(request.getEmail())
                .codigoPostal(request.getCp())
                .regimenFiscal(codigoRegimen)
                .activo(true)
                .build();
        
        cliente = clienteRepository.save(cliente);
        
        // Crear datos específicos según tipo de persona
        if (tipoPersona == Cliente.TipoPersona.F) {
            crearPersonaFisica(cliente, request);
        } else {
            crearPersonaMoral(cliente, request);
        }
        
        // Crear domicilio
        crearDomicilio(cliente, request);
        
        // Crear regímenes fiscales
        crearRegimenesFiscales(cliente, request);
        
        return ProcesarFacturaResponseDto.exitoso(
            cliente.getIdCliente(),
            cliente.getRfc(),
            cliente.getTipoPersona().name(),
            obtenerNombreCompleto(cliente),
            cliente.getEmail(),
            cliente.getCodigoPostal(),
            cliente.getRegimenFiscal(),
            false, // clienteExistente
            true // datosActualizados
        );
    }
    
    /**
     * Actualizar persona física
     */
    private boolean actualizarPersonaFisica(Cliente cliente, ProcesarFacturaRequestDto request) {
        Optional<PersonaFisica> personaFisicaOpt = personaFisicaRepository.findByClienteRfc(cliente.getRfc());
        
        if (personaFisicaOpt.isPresent()) {
            PersonaFisica personaFisica = personaFisicaOpt.get();
            boolean actualizado = false;
            
            if (personaFisica.getNombre() == null || !personaFisica.getNombre().equals(request.getNombre())) {
                personaFisica.setNombre(request.getNombre());
                actualizado = true;
            }
            
            if (personaFisica.getPrimerApellido() == null || !personaFisica.getPrimerApellido().equals(request.getPrimerApellido())) {
                personaFisica.setPrimerApellido(request.getPrimerApellido());
                actualizado = true;
            }
            
            if (personaFisica.getSegundoApellido() == null || !personaFisica.getSegundoApellido().equals(request.getSegundoApellido())) {
                personaFisica.setSegundoApellido(request.getSegundoApellido());
                actualizado = true;
            }
            
            if (request.getCurp() != null && (personaFisica.getCurp() == null || !personaFisica.getCurp().equals(request.getCurp()))) {
                personaFisica.setCurp(request.getCurp());
                actualizado = true;
            }
            
            if (actualizado) {
                personaFisicaRepository.save(personaFisica);
            }
            
            return actualizado;
        }
        
        return false;
    }
    
    /**
     * Actualizar persona moral
     */
    private boolean actualizarPersonaMoral(Cliente cliente, ProcesarFacturaRequestDto request) {
        Optional<PersonaMoral> personaMoralOpt = personaMoralRepository.findByClienteRfc(cliente.getRfc());
        
        if (personaMoralOpt.isPresent()) {
            PersonaMoral personaMoral = personaMoralOpt.get();
            boolean actualizado = false;
            
            if (personaMoral.getRazonSocial() == null || !personaMoral.getRazonSocial().equals(request.getNombre())) {
                personaMoral.setRazonSocial(request.getNombre());
                actualizado = true;
            }
            
            if (actualizado) {
                personaMoralRepository.save(personaMoral);
            }
            
            return actualizado;
        }
        
        return false;
    }
    
    /**
     * Actualizar domicilio
     */
    private boolean actualizarDomicilio(Cliente cliente, ProcesarFacturaRequestDto request) {
        Optional<Domicilio> domicilioOpt = domicilioRepository.findDomicilioFiscalByClienteRfc(cliente.getRfc());
        
        if (domicilioOpt.isPresent()) {
            Domicilio domicilio = domicilioOpt.get();
            boolean actualizado = false;
            
            if (domicilio.getCalle() == null || !domicilio.getCalle().equals(request.getCalle())) {
                domicilio.setCalle(request.getCalle());
                actualizado = true;
            }
            
            if (domicilio.getNumeroExterior() == null || !domicilio.getNumeroExterior().equals(request.getNumExt())) {
                domicilio.setNumeroExterior(request.getNumExt());
                actualizado = true;
            }
            
            if (domicilio.getNumeroInterior() == null || !domicilio.getNumeroInterior().equals(request.getNumInt())) {
                domicilio.setNumeroInterior(request.getNumInt());
                actualizado = true;
            }
            
            if (domicilio.getColonia() == null || !domicilio.getColonia().equals(request.getColonia())) {
                domicilio.setColonia(request.getColonia());
                actualizado = true;
            }
            
            if (domicilio.getMunicipio() == null || !domicilio.getMunicipio().equals(request.getMunicipio())) {
                domicilio.setMunicipio(request.getMunicipio());
                actualizado = true;
            }
            
            if (domicilio.getEntidadFederativa() == null || !domicilio.getEntidadFederativa().equals(request.getEntidadFederativa())) {
                domicilio.setEntidadFederativa(request.getEntidadFederativa());
                actualizado = true;
            }
            
            if (domicilio.getCodigoPostal() == null || !domicilio.getCodigoPostal().equals(request.getCp())) {
                domicilio.setCodigoPostal(request.getCp());
                actualizado = true;
            }
            
            if (actualizado) {
                domicilioRepository.save(domicilio);
            }
            
            return actualizado;
        }
        
        return false;
    }
    
    /**
     * Actualizar regímenes fiscales
     */
    private boolean actualizarRegimenesFiscales(Cliente cliente, ProcesarFacturaRequestDto request) {
        // Por simplicidad, asumimos que los regímenes fiscales no cambian frecuentemente
        // En una implementación más robusta, se compararían los regímenes existentes con los nuevos
        return false;
    }
    
    /**
     * Crear persona física
     */
    private void crearPersonaFisica(Cliente cliente, ProcesarFacturaRequestDto request) {
        PersonaFisica personaFisica = PersonaFisica.builder()
                .cliente(cliente)
                .nombre(request.getNombre())
                .apellidoPaterno(request.getPrimerApellido())
                .apellidoMaterno(request.getSegundoApellido())
                .curp(request.getCurp())
                .build();
        
        personaFisicaRepository.save(personaFisica);
    }
    
    /**
     * Crear persona moral
     */
    private void crearPersonaMoral(Cliente cliente, ProcesarFacturaRequestDto request) {
        PersonaMoral personaMoral = PersonaMoral.builder()
                .cliente(cliente)
                .razonSocial(request.getNombre())
                .build();
        
        personaMoralRepository.save(personaMoral);
    }
    
    /**
     * Crear domicilio
     */
    private void crearDomicilio(Cliente cliente, ProcesarFacturaRequestDto request) {
        Domicilio domicilio = Domicilio.builder()
                .cliente(cliente)
                .calle(request.getCalle())
                .numeroExterior(request.getNumExt())
                .numeroInterior(request.getNumInt())
                .colonia(request.getColonia())
                .localidad(request.getLocalidad())
                .municipio(request.getMunicipio())
                .entidadFederativa(request.getEntidadFederativa())
                .codigoPostal(request.getCp())
                .entreCalle(request.getEntreCalle())
                .yCalle(request.getyCalle())
                .tipoDomicilio(Domicilio.TipoDomicilio.FISCAL)
                .activo(true)
                .build();
        
        domicilioRepository.save(domicilio);
    }
    
    /**
     * Crear regímenes fiscales
     */
    private void crearRegimenesFiscales(Cliente cliente, ProcesarFacturaRequestDto request) {
        if (request.getRegimenesFiscales() == null || request.getRegimenesFiscales().isEmpty()) {
            return; // No hay regímenes para crear
        }
        
        for (String regimen : request.getRegimenesFiscales()) {
            RegimenFiscalCliente regimenFiscal = RegimenFiscalCliente.builder()
                    .cliente(cliente)
                    .codigoRegimen(regimen.split(" - ")[0])
                    .descripcion(regimen)
                    .activo(true)
                    .build();
            
            regimenFiscalClienteRepository.save(regimenFiscal);
        }
    }
    
    /**
     * Extraer código del régimen fiscal de la descripción completa
     */
    private String extraerCodigoRegimen(String regimenCompleto) {
        if (regimenCompleto == null || regimenCompleto.trim().isEmpty()) {
            return "000";
        }
        
        // Si contiene " - ", extraer solo la parte antes del guión
        if (regimenCompleto.contains(" - ")) {
            return regimenCompleto.split(" - ")[0].trim();
        }
        
        // Si es solo un código de 3 dígitos, devolverlo
        if (regimenCompleto.matches("\\d{3}")) {
            return regimenCompleto;
        }
        
        // Por defecto, devolver "000"
        return "000";
    }
    
    /**
     * Obtener nombre completo del cliente
     */
    private String obtenerNombreCompleto(Cliente cliente) {
        if (cliente.getTipoPersona() == Cliente.TipoPersona.F && cliente.getPersonaFisica() != null) {
            return cliente.getPersonaFisica().getNombreCompleto();
        } else if (cliente.getTipoPersona() == Cliente.TipoPersona.M && cliente.getPersonaMoral() != null) {
            return cliente.getPersonaMoral().getRazonSocial();
        }
        return cliente.getRfc();
    }
    
    /**
     * Buscar cliente por RFC
     */
    public Optional<ClienteResponseDto> buscarClientePorRfc(String rfc) {
        return clienteRepository.findByRfcAndActivoTrue(rfc)
                .map(this::convertirAClienteResponseDto);
    }
    
    /**
     * Listar todos los clientes activos
     */
    public List<ClienteResponseDto> listarClientesActivos() {
        return clienteRepository.findByActivoTrue().stream()
                .map(this::convertirAClienteResponseDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Convertir Cliente a ClienteResponseDto
     */
    private ClienteResponseDto convertirAClienteResponseDto(Cliente cliente) {
        ClienteResponseDto.ClienteResponseDtoBuilder builder = ClienteResponseDto.builder()
                .idCliente(cliente.getIdCliente())
                .rfc(cliente.getRfc())
                .tipoPersona(cliente.getTipoPersona().name())
                .email(cliente.getEmail())
                .codigoPostal(cliente.getCodigoPostal())
                .regimenFiscal(cliente.getRegimenFiscal())
                .fechaCreacion(cliente.getFechaCreacion())
                .fechaUltimaActualizacion(cliente.getFechaUltimaActualizacion())
                .activo(cliente.getActivo());
        
        // Agregar datos específicos según tipo de persona
        if (cliente.getTipoPersona() == Cliente.TipoPersona.F && cliente.getPersonaFisica() != null) {
            PersonaFisica pf = cliente.getPersonaFisica();
            builder.nombre(pf.getNombre())
                   .segundoNombre(pf.getSegundoNombre())
                   .apellidoPaterno(pf.getApellidoPaterno())
                   .apellidoMaterno(pf.getApellidoMaterno())
                   .curp(pf.getCurp())
                   .nombreCompleto(pf.getNombreCompleto());
        } else if (cliente.getTipoPersona() == Cliente.TipoPersona.M && cliente.getPersonaMoral() != null) {
            PersonaMoral pm = cliente.getPersonaMoral();
            builder.razonSocial(pm.getRazonSocial())
                   .nombreCompleto(pm.getRazonSocial());
        }
        
        // Agregar datos de domicilio
        Optional<Domicilio> domicilioOpt = domicilioRepository.findDomicilioFiscalByClienteRfc(cliente.getRfc());
        if (domicilioOpt.isPresent()) {
            Domicilio domicilio = domicilioOpt.get();
            builder.calle(domicilio.getCalle())
                   .numeroExterior(domicilio.getNumeroExterior())
                   .numeroInterior(domicilio.getNumeroInterior())
                   .colonia(domicilio.getColonia())
                   .localidad(domicilio.getLocalidad())
                   .municipio(domicilio.getMunicipio())
                   .entidadFederativa(domicilio.getEntidadFederativa())
                   .codigoPostal(domicilio.getCodigoPostal())
                   .entreCalle(domicilio.getEntreCalle())
                   .yCalle(domicilio.getyCalle())
                   .direccionCompleta(domicilio.getDireccionCompleta());
        }
        
        // Agregar regímenes fiscales
        List<ClienteResponseDto.RegimenFiscalDto> regimenes = cliente.getRegimenesFiscales().stream()
                .map(rf -> ClienteResponseDto.RegimenFiscalDto.builder()
                        .idRegimenFiscalCliente(rf.getIdRegimenFiscalCliente())
                        .codigoRegimen(rf.getCodigoRegimen())
                        .descripcion(rf.getDescripcion())
                        .activo(rf.getActivo())
                        .fechaCreacion(rf.getFechaCreacion())
                        .build())
                .collect(Collectors.toList());
        
        builder.regimenesFiscales(regimenes);
        
        return builder.build();
    }
}
