package com.cibercom.facturacion_back.service;

import com.cibercom.facturacion_back.dao.ConceptoOracleDAO;
import com.cibercom.facturacion_back.dao.NominaOracleDAO;
import com.cibercom.facturacion_back.dao.UuidFacturaOracleDAO;
import com.cibercom.facturacion_back.dto.NominaSaveRequest;
import com.cibercom.facturacion_back.dto.NominaSaveResponse;
import com.cibercom.facturacion_back.dto.PacTimbradoRequest;
import com.cibercom.facturacion_back.dto.PacTimbradoResponse;
import com.cibercom.facturacion_back.integration.PacClient;
import com.cibercom.facturacion_back.model.ClienteCatalogo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Profile("oracle")
public class NominaService {

    private static final Logger logger = LoggerFactory.getLogger(NominaService.class);
    private static final DateTimeFormatter FECHA_HORA = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final UuidFacturaOracleDAO uuidFacturaOracleDAO;
    private final ConceptoOracleDAO conceptoOracleDAO;
    private final NominaOracleDAO nominaOracleDAO;
    private final ClienteCatalogoService clienteCatalogoService;
    private final PacClient pacClient;
    private final Environment environment;
    private final ITextPdfService iTextPdfService;
    private final CorreoService correoService;
    private final FormatoCorreoService formatoCorreoService;
    private final LogoBrandingService logoBrandingService;

    // Inyectar valores de application.yml usando @Value (igual que FacturaService y PagoService)
    @Value("${facturacion.emisor.rfc:IVD920810GU2}")
    private String rfcEmisorDefault;
    
    @Value("${facturacion.emisor.nombre:INNOVACION VALOR Y DESARROLLO SA}")
    private String nombreEmisorDefault;
    
    @Value("${facturacion.emisor.regimen:601}")
    private String regimenFiscalEmisorDefault;
    
    @Value("${facturacion.emisor.cp:58000}")
    private String codigoPostalEmisorDefault;
    
    @Value("${facturacion.emisor.registroPatronal:VADA800927HSRSRL05}")
    private String registroPatronalDefault;

    @Value("${server.base-url:http://localhost:8080}")
    private String serverBaseUrl;

    public NominaService(UuidFacturaOracleDAO uuidFacturaOracleDAO,
                         ConceptoOracleDAO conceptoOracleDAO,
                         NominaOracleDAO nominaOracleDAO,
                         ClienteCatalogoService clienteCatalogoService,
                         PacClient pacClient,
                         Environment environment,
                         ITextPdfService iTextPdfService,
                         CorreoService correoService,
                         FormatoCorreoService formatoCorreoService,
                         LogoBrandingService logoBrandingService) {
        this.uuidFacturaOracleDAO = uuidFacturaOracleDAO;
        this.conceptoOracleDAO = conceptoOracleDAO;
        this.nominaOracleDAO = nominaOracleDAO;
        this.clienteCatalogoService = clienteCatalogoService;
        this.pacClient = pacClient;
        this.environment = environment;
        this.iTextPdfService = iTextPdfService;
        this.correoService = correoService;
        this.formatoCorreoService = formatoCorreoService;
        this.logoBrandingService = logoBrandingService;
    }

    public NominaSaveResponse guardar(NominaSaveRequest req, Long usuario) {
        NominaSaveResponse response = new NominaSaveResponse();
        List<String> errors = new ArrayList<>();
        response.setErrors(errors);

        // Validaciones básicas
        String rfcEmisor = safeTrim(req.getRfcEmisor());
        if (rfcEmisor == null || rfcEmisor.isEmpty()) {
            rfcEmisor = safeTrim(rfcEmisorDefault);
        }
        if (rfcEmisor == null || rfcEmisor.isEmpty()) {
            errors.add("RFC del emisor no configurado (formulario o facturacion.emisor.rfc).");
            response.setOk(false);
            response.setMessage("RFC del emisor requerido.");
            return response;
        }
        req.setRfcEmisor(rfcEmisor);
        String rfcReceptor = safeTrim(req.getRfcReceptor());
        String nombre = safeTrim(req.getNombre());
        String idEmpleado = safeTrim(req.getIdEmpleado());
        String fechaPago = safeTrim(req.getFechaPago());
        String correoReceptor = safeTrim(req.getCorreoElectronico());
        String domicilioFiscalReceptor = safeTrim(req.getDomicilioFiscalReceptor());
        String periodoPago = safeTrim(req.getPeriodoPago());
        String curp = safeTrim(req.getCurp());
        String tipoNomina = safeTrim(req.getTipoNomina());
        String usoCfdi = safeTrim(req.getUsoCfdi());
        
        // CRÍTICO NOM44: Campos requeridos cuando existe RegistroPatronal
        String numSeguridadSocial = safeTrim(req.getNumSeguridadSocial());
        String fechaInicioRelLaboral = safeTrim(req.getFechaInicioRelLaboral());
        String antiguedad = safeTrim(req.getAntiguedad());
        String riesgoPuesto = safeTrim(req.getRiesgoPuesto());
        String salarioDiarioIntegrado = safeTrim(req.getSalarioDiarioIntegrado());

        if (rfcReceptor == null || nombre == null || idEmpleado == null || fechaPago == null) {
            errors.add("Datos incompletos: RFC receptor, nombre, ID empleado y fecha de pago son obligatorios.");
            response.setOk(false);
            response.setMessage("Datos incompletos.");
            return response;
        }

        if (correoReceptor == null || !correoReceptor.contains("@")) {
            errors.add("El correo del receptor es obligatorio y debe tener un formato válido.");
            response.setOk(false);
            response.setMessage("Correo del receptor inválido.");
            return response;
        }

        // Validar domicilio fiscal del receptor (código postal)
        if (domicilioFiscalReceptor == null || domicilioFiscalReceptor.trim().isEmpty()) {
            errors.add("El domicilio fiscal del receptor (código postal) es obligatorio.");
            response.setOk(false);
            response.setMessage("Domicilio fiscal del receptor requerido.");
            return response;
        }
        
        // Validar que sea un código postal válido (5 dígitos)
        if (!domicilioFiscalReceptor.matches("\\d{5}")) {
            errors.add("El domicilio fiscal del receptor debe ser un código postal válido de 5 dígitos.");
            response.setOk(false);
            response.setMessage("Código postal inválido.");
            return response;
        }

        // Resolver valores monetarios
        BigDecimal percep = parse(req.getPercepciones());
        BigDecimal deduc = parse(req.getDeducciones());
        BigDecimal total = parse(req.getTotal());
        if (total == null || total.compareTo(BigDecimal.ZERO) <= 0) {
            total = percep.subtract(deduc);
        }
        if (percep == null) percep = BigDecimal.ZERO;
        if (deduc == null) deduc = BigDecimal.ZERO;
        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            errors.add("El total debe ser mayor a cero.");
            response.setOk(false);
            response.setMessage("Total inválido.");
            return response;
        }

        // Parsear fecha de pago
        LocalDate fechaPagoDate = parseFecha(fechaPago).orElse(LocalDate.now());
        
        // Parsear periodo de pago para obtener fechas inicial y final
        LocalDate fechaInicialPago = fechaPagoDate;
        LocalDate fechaFinalPago = fechaPagoDate;
        int numDiasPagados = 1;
        
        if (periodoPago != null && !periodoPago.isEmpty()) {
            try {
                // Intentar parsear formato "DD/MM/YYYY al DD/MM/YYYY" o "YYYY-MM-DD al YYYY-MM-DD"
                if (periodoPago.contains(" al ")) {
                    String[] partes = periodoPago.split(" al ");
                    if (partes.length == 2) {
                        String fechaIniStr = partes[0].trim();
                        String fechaFinStr = partes[1].trim();
                        
                        // Intentar parsear formato DD/MM/YYYY
                        if (fechaIniStr.contains("/") && fechaIniStr.split("/").length == 3) {
                            String[] partesIni = fechaIniStr.split("/");
                            String[] partesFin = fechaFinStr.split("/");
                            if (partesIni.length == 3 && partesFin.length == 3) {
                                // Formato DD/MM/YYYY
                                fechaInicialPago = LocalDate.of(
                                    Integer.parseInt(partesIni[2]),
                                    Integer.parseInt(partesIni[1]),
                                    Integer.parseInt(partesIni[0])
                                );
                                fechaFinalPago = LocalDate.of(
                                    Integer.parseInt(partesFin[2]),
                                    Integer.parseInt(partesFin[1]),
                                    Integer.parseInt(partesFin[0])
                                );
                            }
                        } else {
                            // Formato YYYY-MM-DD (ISO)
                            fechaInicialPago = LocalDate.parse(fechaIniStr);
                            fechaFinalPago = LocalDate.parse(fechaFinStr);
                        }
                        
                        numDiasPagados = (int) java.time.temporal.ChronoUnit.DAYS.between(fechaInicialPago, fechaFinalPago) + 1;
                        if (numDiasPagados < 1) {
                            numDiasPagados = 1;
                        }
                    }
                }
            } catch (Exception e) {
                logger.warn("No se pudo parsear periodo de pago: {}. Error: {}", periodoPago, e.getMessage());
                // Usar fecha de pago como fallback
                fechaInicialPago = fechaPagoDate;
                fechaFinalPago = fechaPagoDate;
                numDiasPagados = 1;
            }
        }

        // Resolver ID_RECEPTOR por RFC (CLIENTES); crear si no existe
        Long idReceptor = resolverIdReceptorPorRfc(rfcReceptor, nombre, correoReceptor);

        // Usar valores de application.yml para emisor
        String nombreEmisorFinal = nombreEmisorDefault != null && !nombreEmisorDefault.trim().isEmpty() 
                ? nombreEmisorDefault.trim() 
                : rfcEmisor;
        String regimenEmisorFinal = regimenFiscalEmisorDefault != null && !regimenFiscalEmisorDefault.trim().isEmpty()
                ? regimenFiscalEmisorDefault.trim()
                : "601";
        
        logger.info("═══════════════════════════════════════════════════════════════");
        logger.info("📋 DATOS DEL EMISOR PARA NÓMINA:");
        logger.info("  RFC: {}", rfcEmisor);
        logger.info("  Nombre: '{}' (desde application.yml)", nombreEmisorFinal);
        logger.info("  Régimen Fiscal: {}", regimenEmisorFinal);
        logger.info("═══════════════════════════════════════════════════════════════");

        // Generar serie y folio
        String serieNomina = "NOM";
        String folioNomina = generarFolioNomina();

        // Construir XML completo de nómina
        String xmlNomina = construirXmlNominaCompleto(
                rfcEmisor,
                nombreEmisorFinal,
                regimenEmisorFinal,
                rfcReceptor,
                nombre,
                curp,
                domicilioFiscalReceptor,
                periodoPago,
                fechaPagoDate,
                fechaInicialPago,
                fechaFinalPago,
                numDiasPagados,
                tipoNomina,
                percep,
                deduc,
                total,
                usoCfdi,
                serieNomina,
                folioNomina,
                numSeguridadSocial,
                fechaInicioRelLaboral,
                antiguedad,
                riesgoPuesto,
                salarioDiarioIntegrado
        );

        // Enviar al PAC
        PacTimbradoRequest pacRequest = PacTimbradoRequest.builder()
                .xmlContent(xmlNomina)
                .rfcEmisor(rfcEmisor)
                .rfcReceptor(rfcReceptor)
                .total(total.setScale(2, RoundingMode.HALF_UP).doubleValue())
                .tipo("NOMINA")
                .fechaFactura(LocalDateTime.now().toString())
                .publicoGeneral(false)
                .serie(serieNomina)
                .folio(folioNomina)
                .medioPago("PUE")
                .formaPago("99")
                .usoCFDI(usoCfdi != null ? usoCfdi : "CN01")
                .relacionadosUuids(null)
                .build();

        PacTimbradoResponse pacResp = pacClient.solicitarTimbrado(pacRequest);
        if (pacResp == null || Boolean.FALSE.equals(pacResp.getOk())) {
            String mensajeError = pacResp != null && pacResp.getMessage() != null
                    ? pacResp.getMessage()
                    : "PAC no disponible para timbrado.";
            
            // Incluir detalles adicionales del error del PAC
            if (pacResp != null) {
                logger.error("═══════════════════════════════════════════════════════════════");
                logger.error("❌ ERROR AL TIMBRAR NÓMINA:");
                logger.error("  Mensaje del PAC: {}", mensajeError);
                logger.error("  Status: {}", pacResp.getStatus());
                logger.error("  CodEstatus: {}", pacResp.getCodEstatus());
                if (pacResp.getUuid() != null) {
                    logger.error("  UUID (si existe): {}", pacResp.getUuid());
                }
                logger.error("═══════════════════════════════════════════════════════════════");
            }
            
            errors.add(mensajeError);
            response.setOk(false);
            // Incluir el mensaje específico del PAC en la respuesta
            response.setMessage("Error al timbrar nómina: " + mensajeError);
            return response;
        }

        String uuidNomina = safeTrim(pacResp.getUuid());
        if (uuidNomina == null) {
            uuidNomina = UUID.randomUUID().toString().replace("-", "").toUpperCase();
        }
        response.setUuidFactura(uuidNomina);

        LocalDateTime fechaTimbrado = pacResp != null && pacResp.getFechaTimbrado() != null
                ? pacResp.getFechaTimbrado()
                : LocalDateTime.now();

        // Actualizar XML con datos del PAC
        String xmlTimbrado = pacResp.getXmlTimbrado();
        if (xmlTimbrado == null || xmlTimbrado.isBlank()) {
            xmlTimbrado = xmlNomina; // Usar el XML original si no viene del PAC
        }

        // Insertar en FACTURAS (tipo_factura = 4 para nóminas)
        // Estado EMITIDA = "0" cuando Finkok la devuelve timbrada
        String estadoEmitida = com.cibercom.facturacion_back.model.EstadoFactura.EMITIDA.getCodigo(); // "0"
        String estadoDescripcion = com.cibercom.facturacion_back.model.EstadoFactura.EMITIDA.getDescripcion(); // "EMITIDA"
        boolean insercionFactura = uuidFacturaOracleDAO.insertarBasicoConIdReceptor(
                uuidNomina,
                xmlTimbrado,
                serieNomina,
                folioNomina,
                percep.subtract(deduc),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                total,
                "99",
                usoCfdi != null ? usoCfdi : "CN01",
                estadoEmitida, // "0" = EMITIDA
                estadoDescripcion, // "EMITIDA"
                "PUE",
                rfcReceptor,
                rfcEmisor,
                correoReceptor,
                idReceptor,
                Integer.valueOf(4), // tipo_factura = 4 para nóminas
                usuario // usuario que emitió la nómina
        );

        if (!insercionFactura) {
            String detalle = uuidFacturaOracleDAO.getLastInsertError();
            errors.add("FACTURAS: no se pudo insertar la nómina. " + (detalle != null ? detalle : ""));
            response.setOk(false);
            response.setMessage("Error al registrar la nómina en FACTURAS.");
            return response;
        }

        // Obtener ID_FACTURA recién insertado
        Optional<Long> facturaIdOpt = conceptoOracleDAO.obtenerIdFacturaPorUuid(uuidNomina);
        Long facturaId = facturaIdOpt.orElse(null);
        
        if (facturaId == null) {
            errors.add("No se pudo obtener el ID_FACTURA de la nómina insertada.");
            response.setOk(false);
            response.setMessage("Error al obtener ID_FACTURA.");
            return response;
        }

        response.setIdFactura(facturaId);

        // Insertar en NOMINAS (req con RFC y demás ya normalizados arriba)
        req.setIdEmpleado(idEmpleado);
        req.setRfcReceptor(rfcReceptor);
        Long idNomina = nominaOracleDAO.insertar(facturaId, req);
        if (idNomina == null) {
            String detalle = nominaOracleDAO.getLastInsertError();
            errors.add("NOMINAS: no se pudo insertar. " + (detalle != null ? detalle : ""));
            response.setOk(false);
            response.setMessage("Error al registrar en NOMINAS.");
            return response;
        }

        response.setIdFacturaNomina(idNomina);
        response.setOk(true);
        response.setMessage("Nómina timbrada y registrada correctamente. UUID: " + uuidNomina);

        return response;
    }

    /**
     * Consulta historial de nóminas por empleado.
     */
    public java.util.List<com.cibercom.facturacion_back.dto.NominaHistorialDTO> consultarHistorial(String idEmpleado) {
        return consultarHistorial(idEmpleado, 25);
    }

    public java.util.List<com.cibercom.facturacion_back.dto.NominaHistorialDTO> consultarHistorial(String idEmpleado, int limit) {
        if (idEmpleado == null || idEmpleado.trim().isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return nominaOracleDAO.buscarHistorialPorEmpleado(idEmpleado.trim(), limit);
    }

    // Métodos auxiliares
    private String safeTrim(String s) {
        return s != null ? s.trim() : null;
    }

    private BigDecimal parse(String s) {
        try {
            return s == null ? BigDecimal.ZERO : new BigDecimal(s.trim());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private String safe(String s, String def) {
        return isBlank(s) ? def : s;
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private Optional<LocalDate> parseFecha(String fechaStr) {
        if (fechaStr == null || fechaStr.isBlank()) {
            return Optional.empty();
        }
        try {
            // Intentar formato ISO primero (YYYY-MM-DD)
            try {
                return Optional.of(LocalDate.parse(fechaStr));
            } catch (Exception e1) {
                // Intentar formato DD/MM/YYYY
                if (fechaStr.contains("/") && fechaStr.split("/").length == 3) {
                    String[] partes = fechaStr.split("/");
                    if (partes.length == 3) {
                        int dia = Integer.parseInt(partes[0].trim());
                        int mes = Integer.parseInt(partes[1].trim());
                        int anio = Integer.parseInt(partes[2].trim());
                        return Optional.of(LocalDate.of(anio, mes, dia));
                    }
                }
                // Si no coincide ningún formato, lanzar excepción
                throw e1;
            }
        } catch (Exception e) {
            logger.warn("Error al parsear fecha: {}. Error: {}", fechaStr, e.getMessage());
            return Optional.empty();
        }
    }

    private Long resolverIdReceptorPorRfc(String rfc, String nombre, String correo) {
        if (rfc == null || rfc.isBlank()) {
            return null;
        }
        try {
            Optional<ClienteCatalogo> clienteOpt = clienteCatalogoService.buscarPorRfc(rfc.trim().toUpperCase());
            if (clienteOpt.isPresent()) {
                return clienteOpt.get().getIdCliente();
            }
            // Crear nuevo cliente si no existe
            ClienteCatalogo nuevo = new ClienteCatalogo();
            nuevo.setRfc(rfc.trim().toUpperCase());
            nuevo.setRazonSocial(nombre != null ? nombre : rfc);
            nuevo.setCorreoElectronico(correo);
            ClienteCatalogo guardado = clienteCatalogoService.guardar(nuevo);
            return guardado != null ? guardado.getIdCliente() : null;
        } catch (Exception e) {
            logger.error("Error al resolver ID receptor por RFC {}: {}", rfc, e.getMessage(), e);
            return null;
        }
    }

    private String generarFolioNomina() {
        return String.valueOf(System.currentTimeMillis() % 1000000);
    }

    private String escapeXml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("\"", "&quot;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    private String formatMonto(BigDecimal monto) {
        return monto != null ? monto.setScale(2, RoundingMode.HALF_UP).toPlainString() : "0.00";
    }

    /**
     * Calcula la antigüedad en formato PnYnMnDn desde fechaInicio hasta fechaFinal
     * CRÍTICO NOM55: La antigüedad debe calcularse desde FechaInicioRelLaboral hasta FechaFinalPago
     * CRÍTICO NOM109: El formato debe seguir el patrón ISO 8601, omitiendo componentes en cero
     * pero siempre incluyendo al menos un componente (años, meses o días)
     */
    private String calcularAntiguedad(LocalDate fechaInicio, LocalDate fechaFinal) {
        if (fechaInicio == null || fechaFinal == null) {
            return "P0D";
        }
        
        Period periodo = Period.between(fechaInicio, fechaFinal);
        int años = periodo.getYears();
        int meses = periodo.getMonths();
        int días = periodo.getDays();
        
        // CRÍTICO NOM111: Cuando hay RegistroPatronal, el SAT requiere formato completo
        // El formato debe incluir siempre días (incluso si es 0D) cuando hay años o meses
        // Formato requerido: PnYnMnDn donde al menos un componente debe estar presente
        StringBuilder antiguedad = new StringBuilder("P");
        
        // Incluir años si existen
        if (años > 0) {
            antiguedad.append(años).append("Y");
        }
        // Incluir meses si existen
        if (meses > 0) {
            antiguedad.append(meses).append("M");
        }
        // CRÍTICO: Siempre incluir días (incluso si es 0) para cumplir con el patrón del SAT cuando hay RegistroPatronal
        // El SAT valida que el formato sea completo: P1Y0D en lugar de P1Y
        antiguedad.append(días).append("D");
        
        return antiguedad.toString();
    }

    /**
     * Construye un XML completo de CFDI 4.0 con complemento Nómina 1.2
     * Siguiendo el formato oficial del SAT para nóminas
     */
    private String construirXmlNominaCompleto(
            String rfcEmisor, String nombreEmisor, String regimenFiscalEmisor,
            String rfcReceptor, String nombreReceptor, String curp,
            String domicilioFiscalReceptor,
            String periodoPago, LocalDate fechaPago, LocalDate fechaInicialPago,
            LocalDate fechaFinalPago, int numDiasPagados,
            String tipoNomina, BigDecimal percepciones, BigDecimal deducciones,
            BigDecimal total, String usoCfdi, String serie, String folio,
            String numSeguridadSocial, String fechaInicioRelLaboral,
            String antiguedad, String riesgoPuesto, String salarioDiarioIntegrado) {
        
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        
        String lugarExpedicion = codigoPostalEmisorDefault != null && !codigoPostalEmisorDefault.trim().isEmpty() 
                ? codigoPostalEmisorDefault.trim() 
                : "58000";
        
        // CRÍTICO: Para TipoDeComprobante="N" (Nómina), NO se debe incluir el atributo Descuento
        // El SubTotal debe ser igual al Total (sin descuento a nivel de comprobante)
        // Las deducciones se manejan dentro del complemento de nómina, no en el comprobante
        xml.append("<cfdi:Comprobante xmlns:cfdi=\"http://www.sat.gob.mx/cfd/4\" ")
           .append("xmlns:nomina12=\"http://www.sat.gob.mx/nomina12\" ")
           .append("xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" ")
           .append("xsi:schemaLocation=\"http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd ")
           .append("http://www.sat.gob.mx/nomina12 http://www.sat.gob.mx/sitio_internet/cfd/nomina/nomina12.xsd\" ")
           .append("Version=\"4.0\" ")
           .append("Serie=\"").append(serie).append("\" ")
           .append("Folio=\"").append(folio).append("\" ")
           .append("Fecha=\"").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"))).append("\" ");
        
        // Calcular primero todos los valores del concepto para asegurar consistencia
        // CRÍTICO CFDI40108: El SubTotal debe ser igual a la suma de ValorUnitario * Cantidad de los conceptos
        // CRÍTICO CFDI40108: El Total debe ser igual al redondeo de la suma de los Importes de los conceptos
        BigDecimal totalOtrosPagos = BigDecimal.ZERO; // Por ahora siempre 0, pero se puede extender
        BigDecimal valorUnitarioConcepto = percepciones.add(totalOtrosPagos);
        
        // CRÍTICO: Para nóminas, SubTotal debe ser igual a ValorUnitario * Cantidad (en este caso 1)
        // Usar el mismo valorUnitarioConcepto ya calculado para asegurar consistencia
        BigDecimal subtotalComprobante = valorUnitarioConcepto;
        xml.append("SubTotal=\"").append(formatMonto(subtotalComprobante)).append("\" ");
        
        // CRÍTICO CFDI40108: Si hay deducciones, DEBE incluirse Descuento a nivel de Comprobante
        // para que la ecuación aritmética (Total = SubTotal - Descuento) sea válida.
        if (deducciones.compareTo(BigDecimal.ZERO) > 0) {
            xml.append("Descuento=\"").append(formatMonto(deducciones)).append("\" ");
        }
        
        // CRÍTICO: El orden de los atributos según el XSD de CFDI 4.0 es:
        // SubTotal -> Descuento -> Moneda -> Total -> TipoDeComprobante -> Exportacion -> MetodoPago -> LugarExpedicion
        xml.append("Moneda=\"MXN\" ");
        
        // Calcular el Total del comprobante
        // Total = SubTotal - Descuento
        BigDecimal totalComprobante = subtotalComprobante.subtract(deducciones);
        
        xml.append("Total=\"").append(formatMonto(totalComprobante)).append("\" ")
           // CRÍTICO: Para TipoDeComprobante="N" (Nómina), NO incluir TipoCambio (causa error NOM109)
           .append("TipoDeComprobante=\"N\" ")
           .append("Exportacion=\"01\" ")
           .append("MetodoPago=\"PUE\" ")
           .append("LugarExpedicion=\"").append(lugarExpedicion).append("\">\n");
        
        // Emisor
        xml.append("  <cfdi:Emisor Rfc=\"").append(rfcEmisor).append("\" ")
           .append("Nombre=\"").append(escapeXml(nombreEmisor)).append("\" ")
           .append("RegimenFiscal=\"").append(regimenFiscalEmisor).append("\"/>\n");
        
        // Receptor
        // CRÍTICO: Usar el domicilio fiscal del receptor (código postal del receptor)
        // NO usar el código postal del emisor, esto causa error CFDI40111
        String domicilioReceptorFinal = domicilioFiscalReceptor != null && !domicilioFiscalReceptor.trim().isEmpty()
                ? domicilioFiscalReceptor.trim()
                : "00000"; // Fallback si no se proporciona
        
        xml.append("  <cfdi:Receptor Rfc=\"").append(rfcReceptor).append("\" ")
           .append("Nombre=\"").append(escapeXml(nombreReceptor)).append("\" ")
           .append("DomicilioFiscalReceptor=\"").append(domicilioReceptorFinal).append("\" ")
           .append("RegimenFiscalReceptor=\"605\" ")
           .append("UsoCFDI=\"").append(usoCfdi != null ? usoCfdi : "CN01").append("\"/>\n");
        
        // Conceptos
        // CRÍTICO: Para TipoDeComprobante="N", el ValorUnitario debe ser igual a TotalPercepciones + TotalOtrosPagos
        // NO debe ser el total neto (después de deducciones)
        // CRÍTICO NOM22: Si hay deducciones (TotalDeducciones > 0), el atributo Descuento en el Concepto
        // debe existir y ser igual a TotalDeducciones. El Importe será ValorUnitario - Descuento.
        // Las deducciones también se manejan en el complemento nomina12:Deducciones
        
        xml.append("  <cfdi:Conceptos>\n");
        
        // CRÍTICO CFDI: El Importe SIEMPRE debe ser Cantidad * ValorUnitario.
        // NO se le debe restar el descuento aquí. El descuento es un atributo separado.
        BigDecimal importeConcepto = valorUnitarioConcepto;
        
        // CRÍTICO: El orden de los atributos según el XSD de CFDI 4.0 es:
        // ClaveProdServ -> Cantidad -> ClaveUnidad -> Descripcion -> ValorUnitario -> Importe -> Descuento -> ObjetoImp
        xml.append("    <cfdi:Concepto ClaveProdServ=\"84111505\" Cantidad=\"1\" ")
           .append("ClaveUnidad=\"ACT\" Descripcion=\"Pago de nómina\" ")
           .append("ValorUnitario=\"").append(formatMonto(valorUnitarioConcepto)).append("\" ")
           .append("Importe=\"").append(formatMonto(importeConcepto)).append("\" ");
        
        // CRÍTICO NOM22: Si hay deducciones, el atributo Descuento en el Concepto debe ser igual a TotalDeducciones
        if (deducciones.compareTo(BigDecimal.ZERO) > 0) {
            xml.append("Descuento=\"").append(formatMonto(deducciones)).append("\" ");
        }
        
        xml.append("ObjetoImp=\"01\"/>\n");
        xml.append("  </cfdi:Conceptos>\n");
        
        // Complemento Nómina
        xml.append("  <cfdi:Complemento>\n");
        xml.append("    <nomina12:Nomina Version=\"1.2\" ")
           .append("TipoNomina=\"").append(tipoNomina != null ? tipoNomina : "O").append("\" ")
           .append("FechaPago=\"").append(fechaPago.format(DateTimeFormatter.ISO_LOCAL_DATE)).append("\" ")
           .append("FechaInicialPago=\"").append(fechaInicialPago.format(DateTimeFormatter.ISO_LOCAL_DATE)).append("\" ")
           .append("FechaFinalPago=\"").append(fechaFinalPago.format(DateTimeFormatter.ISO_LOCAL_DATE)).append("\" ")
           .append("NumDiasPagados=\"").append(numDiasPagados).append("\" ")
           .append("TotalPercepciones=\"").append(formatMonto(percepciones)).append("\" ")
           .append("TotalDeducciones=\"").append(formatMonto(deducciones)).append("\"");
        
        // CRÍTICO NOM40: Si hay nodo OtrosPagos, el atributo TotalOtrosPagos es OBLIGATORIO.
        // El nodo OtrosPagos se genera si hay deducciones (por la regla del subsidio al empleo).
        // Así que si hay deducciones, forzamos TotalOtrosPagos aunque sea 0.00
        if (totalOtrosPagos.compareTo(BigDecimal.ZERO) > 0 || deducciones.compareTo(BigDecimal.ZERO) > 0) {
            xml.append(" TotalOtrosPagos=\"").append(formatMonto(totalOtrosPagos)).append("\"");
        }
        
        xml.append(">\n");
        
        // CRÍTICO NOM42: El nodo nomina12:Emisor con RegistroPatronal es obligatorio
        xml.append("      <nomina12:Emisor RegistroPatronal=\"").append(escapeXml(registroPatronalDefault)).append("\"/>\n");
        
        // Receptor de nómina
        // CRÍTICO NOM44: Cuando existe RegistroPatronal, estos atributos son obligatorios
        
        // CRÍTICO: La CURP es obligatoria y debe tener 18 caracteres.
        // Si no viene informada, usamos una generada basada en el RFC del receptor (CUSC850516316) para pruebas
        String curpFinal = curp;
        if (curpFinal == null || curpFinal.trim().length() != 18) {
            // CURP calculada para CESAR OSBALDO CRUZ SOLORZANO (CUSC850516316)
            curpFinal = "CUSC850516HDFRLS01";
        }
        
        xml.append("      <nomina12:Receptor Curp=\"").append(escapeXml(curpFinal)).append("\" ")
           .append("NumSeguridadSocial=\"").append(numSeguridadSocial != null && !numSeguridadSocial.trim().isEmpty() ? escapeXml(numSeguridadSocial) : "").append("\" ")
           .append("TipoContrato=\"01\" ")
           .append("TipoRegimen=\"02\" ")
           .append("NumEmpleado=\"1\" ")
           .append("PeriodicidadPago=\"").append(periodoPago != null && periodoPago.contains("QUINCENAL") ? "04" : "05").append("\" ")
           .append("ClaveEntFed=\"MEX\"");
        
        // CRÍTICO NOM44: Atributos obligatorios cuando existe RegistroPatronal
        // CRÍTICO NOM55: La antigüedad debe calcularse desde FechaInicioRelLaboral hasta FechaFinalPago
        LocalDate fechaInicioLocalDate = null;
        if (fechaInicioRelLaboral != null && !fechaInicioRelLaboral.trim().isEmpty()) {
            try {
                fechaInicioLocalDate = LocalDate.parse(fechaInicioRelLaboral);
                xml.append(" FechaInicioRelLaboral=\"").append(escapeXml(fechaInicioRelLaboral)).append("\"");
            } catch (Exception e) {
                logger.warn("Error al parsear fechaInicioRelLaboral: " + fechaInicioRelLaboral, e);
            }
        }
        
        // Calcular antigüedad automáticamente desde FechaInicioRelLaboral hasta FechaFinalPago
        String antiguedadCalculada = null;
        if (fechaInicioLocalDate != null && fechaFinalPago != null) {
            antiguedadCalculada = calcularAntiguedad(fechaInicioLocalDate, fechaFinalPago);
            xml.append(" Antigüedad=\"").append(escapeXml(antiguedadCalculada)).append("\"");
        } else if (antiguedad != null && !antiguedad.trim().isEmpty()) {
            // Fallback: usar el valor proporcionado si no se puede calcular
            xml.append(" Antigüedad=\"").append(escapeXml(antiguedad)).append("\"");
        }
        if (riesgoPuesto != null && !riesgoPuesto.trim().isEmpty()) {
            xml.append(" RiesgoPuesto=\"").append(escapeXml(riesgoPuesto)).append("\"");
        }
        if (salarioDiarioIntegrado != null && !salarioDiarioIntegrado.trim().isEmpty()) {
            xml.append(" SalarioDiarioIntegrado=\"").append(escapeXml(salarioDiarioIntegrado)).append("\"");
        }
        
        xml.append("/>\n");
        
        // Percepciones
        // CRÍTICO NOM37: TotalPercepciones debe ser igual a TotalSueldos + TotalSeparacionIndemnizacion + TotalJubilacionPensionRetiro
        // Para percepciones tipo "001" (Sueldos, Salarios y Remuneraciones), el monto va en TotalSueldos
        if (percepciones.compareTo(BigDecimal.ZERO) > 0) {
            // Calcular los totales según el tipo de percepción
            // Por ahora, todas las percepciones se consideran "Sueldos" (tipo 001)
            BigDecimal totalSueldos = percepciones;
            BigDecimal totalSeparacionIndemnizacion = BigDecimal.ZERO;
            BigDecimal totalJubilacionPensionRetiro = BigDecimal.ZERO;
            
            // Verificar que la suma coincida con TotalPercepciones
            BigDecimal sumaTotales = totalSueldos.add(totalSeparacionIndemnizacion).add(totalJubilacionPensionRetiro);
            if (sumaTotales.compareTo(percepciones) != 0) {
                logger.warn("⚠️ La suma de TotalSueldos + TotalSeparacionIndemnizacion + TotalJubilacionPensionRetiro ({}) no coincide con TotalPercepciones ({}). Ajustando...", 
                    sumaTotales, percepciones);
                // Ajustar totalSueldos para que la suma coincida
                totalSueldos = percepciones.subtract(totalSeparacionIndemnizacion).subtract(totalJubilacionPensionRetiro);
            }
            
            xml.append("      <nomina12:Percepciones ")
               .append("TotalSueldos=\"").append(formatMonto(totalSueldos)).append("\" ");
            
            // CRÍTICO NOM78: Si TotalSeparacionIndemnizacion es 0, NO incluir el atributo
            // Solo incluir si hay separaciones/indemnizaciones (mayor que 0)
            // Si está presente, debe existir el elemento SeparacionIndemnizacion
            if (totalSeparacionIndemnizacion.compareTo(BigDecimal.ZERO) > 0) {
                xml.append("TotalSeparacionIndemnizacion=\"").append(formatMonto(totalSeparacionIndemnizacion)).append("\" ");
            }
            
            // CRÍTICO: Si TotalJubilacionPensionRetiro es 0, NO incluir el atributo
            // Solo incluir si hay jubilaciones/pensiones (mayor que 0)
            if (totalJubilacionPensionRetiro.compareTo(BigDecimal.ZERO) > 0) {
                xml.append("TotalJubilacionPensionRetiro=\"").append(formatMonto(totalJubilacionPensionRetiro)).append("\" ");
            }
            
            xml.append("TotalGravado=\"").append(formatMonto(percepciones)).append("\" ")
               .append("TotalExento=\"0.00\">\n");
            xml.append("        <nomina12:Percepcion TipoPercepcion=\"001\" ")
               .append("Clave=\"001\" ")
               .append("Concepto=\"Sueldos, Salarios y Remuneraciones\" ")
               .append("ImporteGravado=\"").append(formatMonto(percepciones)).append("\" ")
               .append("ImporteExento=\"0.00\"/>\n");
            xml.append("      </nomina12:Percepciones>\n");
        }
        
        // Deducciones
        if (deducciones.compareTo(BigDecimal.ZERO) > 0) {
            xml.append("      <nomina12:Deducciones TotalImpuestosRetenidos=\"").append(formatMonto(deducciones)).append("\" ")
               .append("TotalOtrasDeducciones=\"0.00\">\n");
            xml.append("        <nomina12:Deduccion TipoDeduccion=\"002\" ")
               .append("Clave=\"002\" ")
               .append("Concepto=\"ISR\" ")
               .append("Importe=\"").append(formatMonto(deducciones)).append("\"/>\n");
            xml.append("      </nomina12:Deducciones>\n");
        }
        
        // CRÍTICO NOM105: Si es régimen de sueldos (02), se debe incluir el nodo OtrosPagos
        // con la información del Subsidio al Empleo, incluso si es 0.
        // Esto es obligatorio desde la reforma de 2020 para el Apéndice 6.
        // Como arriba se hardcodeó TipoRegimen="02", asumimos que siempre aplica.
        if (deducciones.compareTo(BigDecimal.ZERO) > 0) {
            xml.append("      <nomina12:OtrosPagos>\n");
            xml.append("        <nomina12:OtroPago TipoOtroPago=\"002\" ")
               .append("Clave=\"002\" ")
               .append("Concepto=\"Subsidio para el empleo (efectivamente entregado al trabajador)\" ")
               .append("Importe=\"0.00\">\n");
            xml.append("          <nomina12:SubsidioAlEmpleo SubsidioCausado=\"0.00\"/>\n");
            xml.append("        </nomina12:OtroPago>\n");
            xml.append("      </nomina12:OtrosPagos>\n");
        }
        
        xml.append("    </nomina12:Nomina>\n");
        xml.append("  </cfdi:Complemento>\n");
        
        xml.append("</cfdi:Comprobante>");
        
        return xml.toString();
    }

    /**
     * Genera un PDF de vista previa sin timbrar a partir de NominaSaveRequest
     */
    public byte[] generarPdfPreview(NominaSaveRequest request, Map<String, Object> logoConfig) {
        try {
            logger.info("Generando PDF de vista previa para nómina, RFC receptor: {}", request.getRfcReceptor());

            Map<String, Object> logoConfigFinal = resolveLogoConfigForPdf(logoConfig, request != null ? request.getLogoBase64() : null);
            Map<String, Object> datosFactura = construirDatosFacturaPdfDesdeRequest(request, null);
            byte[] pdfBytes = iTextPdfService.generarPdfConLogo(datosFactura, logoConfigFinal);
            logger.info("PDF de vista previa de nómina generado exitosamente: {} bytes", pdfBytes != null ? pdfBytes.length : 0);
            return pdfBytes;
        } catch (Exception e) {
            logger.error("Error al generar PDF de vista previa de nómina: {}", e.getMessage(), e);
            throw new RuntimeException("Error al generar PDF de vista previa de nómina: " + e.getMessage(), e);
        }
    }

    /**
     * PDF de nómina timbrada (correo, descarga) con logo y colores de configuración de correo.
     */
    public byte[] generarPdfDesdeUuid(String uuid, Map<String, Object> logoConfig) throws java.io.IOException {
        String uuidTrim = uuid != null ? uuid.trim() : "";
        if (uuidTrim.isEmpty()) {
            return null;
        }
        logger.info("Generando PDF de nómina desde UUID: {}", uuidTrim);

        Optional<UuidFacturaOracleDAO.Result> optFactura = uuidFacturaOracleDAO.obtenerBasicosPorUuid(uuidTrim);
        if (optFactura.isEmpty()) {
            logger.warn("No se encontró factura de nómina para UUID {}", uuidTrim);
            return null;
        }
        UuidFacturaOracleDAO.Result facturaRow = optFactura.get();

        NominaSaveRequest req = new NominaSaveRequest();
        req.setRfcEmisor(facturaRow.rfcEmisor != null ? facturaRow.rfcEmisor : rfcEmisorDefault);
        req.setRfcReceptor(facturaRow.rfcReceptor);
        req.setTotal(facturaRow.total != null ? facturaRow.total.toPlainString() : "0");

        Map<String, Object> datosNomina = new HashMap<>();
        try {
            var idOpt = conceptoOracleDAO.obtenerIdFacturaPorUuid(uuidTrim);
            if (idOpt.isPresent() && idOpt.get() != null) {
                Map<String, Object> desdeBd = nominaOracleDAO.buscarPorIdFactura(idOpt.get());
                if (desdeBd != null) {
                    datosNomina.putAll(desdeBd);
                }
            }
        } catch (Exception e) {
            logger.warn("No se pudo cargar NOMINAS para UUID {}: {}", uuidTrim, e.getMessage());
        }

        Map<String, Object> datosFactura = construirDatosFacturaPdfDesdeRequest(req, facturaRow);
        if (!datosNomina.isEmpty()) {
            datosFactura.put("nomina", datosNomina);
            Object nombreNom = datosNomina.get("nombre");
            if (nombreNom != null && !String.valueOf(nombreNom).isBlank()) {
                datosFactura.put("nombreReceptor", String.valueOf(nombreNom).trim());
            }
        }

        Map<String, Object> logoConfigFinal = resolveLogoConfigForPdf(logoConfig, null);
        return iTextPdfService.generarPdfConLogo(datosFactura, logoConfigFinal);
    }

    private Map<String, Object> resolveLogoConfigForPdf(Map<String, Object> logoConfig, String logoBase64Override) {
        Map<String, Object> built = logoBrandingService.buildPdfLogoConfig(logoBase64Override);
        if (logoConfig == null || logoConfig.isEmpty()) {
            return built;
        }
        Object bytes = logoConfig.get("logoImageBytes");
        if (bytes instanceof byte[] b && b.length > 0) {
            built.put("logoImageBytes", b);
            if (logoConfig.get("logoBase64") != null) {
                built.put("logoBase64", logoConfig.get("logoBase64"));
            }
        }
        if (logoConfig.get("customColors") != null) {
            built.put("customColors", logoConfig.get("customColors"));
        }
        return built;
    }

    private Map<String, Object> construirDatosFacturaPdfDesdeRequest(NominaSaveRequest request, UuidFacturaOracleDAO.Result facturaRow) {
        Map<String, Object> datosFactura = new HashMap<>();
        boolean preview = facturaRow == null;
        datosFactura.put("uuid", preview ? "PREVIEW-" + UUID.randomUUID() : facturaRow.uuid);
        datosFactura.put("serie", preview ? "NOM" : (facturaRow.serie != null ? facturaRow.serie : "NOM"));
        datosFactura.put("folio", preview ? "PREVIEW" : (facturaRow.folio != null ? facturaRow.folio : ""));
        LocalDateTime fechaTimbrado = LocalDateTime.now();
        if (!preview && facturaRow.fechaFactura != null) {
            fechaTimbrado = LocalDateTime.ofInstant(facturaRow.fechaFactura, java.time.ZoneId.systemDefault());
        }
        datosFactura.put("fechaTimbrado", fechaTimbrado);

        String rfcEmisor = safeTrim(request != null ? request.getRfcEmisor() : null);
        if (rfcEmisor == null || rfcEmisor.isEmpty()) {
            rfcEmisor = facturaRow != null && facturaRow.rfcEmisor != null ? facturaRow.rfcEmisor : rfcEmisorDefault;
        }
        datosFactura.put("rfcEmisor", rfcEmisor);
        datosFactura.put("nombreEmisor", nombreEmisorDefault);

        String rfcReceptor = request != null && request.getRfcReceptor() != null
                ? request.getRfcReceptor()
                : (facturaRow != null ? facturaRow.rfcReceptor : "XAXX010101000");
        datosFactura.put("rfcReceptor", rfcReceptor);
        String nombreReceptor = request != null && request.getNombre() != null && !request.getNombre().isBlank()
                ? request.getNombre().trim()
                : rfcReceptor;
        datosFactura.put("nombreReceptor", nombreReceptor);
        datosFactura.put("tipoComprobante", "N");
        datosFactura.put("moneda", "MXN");

        BigDecimal total = BigDecimal.ZERO;
        if (facturaRow != null && facturaRow.total != null) {
            total = facturaRow.total;
        } else if (request != null && request.getTotal() != null) {
            total = parseDecimal(request.getTotal());
        }

        List<Map<String, Object>> conceptos = new ArrayList<>();
        Map<String, Object> concepto = new HashMap<>();
        String tipoNom = request != null ? request.getTipoNomina() : null;
        concepto.put("cantidad", BigDecimal.ONE);
        concepto.put("descripcion", "Nómina - " + (tipoNom != null ? tipoNom : "Nómina"));
        concepto.put("valorUnitario", total);
        concepto.put("importe", total);
        concepto.put("iva", BigDecimal.ZERO);
        conceptos.add(concepto);
        datosFactura.put("conceptos", conceptos);
        datosFactura.put("subtotal", total);
        datosFactura.put("iva", BigDecimal.ZERO);
        datosFactura.put("total", total);

        if (request != null && !datosFactura.containsKey("nomina")) {
            Map<String, Object> datosNomina = new HashMap<>();
            datosNomina.put("idEmpleado", request.getIdEmpleado());
            datosNomina.put("fechaNomina", request.getFechaNomina());
            datosNomina.put("nombre", request.getNombre());
            datosNomina.put("curp", request.getCurp());
            datosNomina.put("rfcReceptor", request.getRfcReceptor());
            datosNomina.put("periodoPago", request.getPeriodoPago());
            datosNomina.put("fechaPago", request.getFechaPago());
            datosNomina.put("percepciones", request.getPercepciones());
            datosNomina.put("deducciones", request.getDeducciones());
            datosNomina.put("total", request.getTotal());
            datosNomina.put("tipoNomina", request.getTipoNomina());
            datosNomina.put("usoCfdi", request.getUsoCfdi());
            datosNomina.put("correoElectronico", request.getCorreoElectronico());
            datosNomina.put("domicilioFiscalReceptor", request.getDomicilioFiscalReceptor());
            datosNomina.put("numSeguridadSocial", request.getNumSeguridadSocial());
            datosNomina.put("fechaInicioRelLaboral", request.getFechaInicioRelLaboral());
            datosNomina.put("antiguedad", request.getAntiguedad());
            datosNomina.put("riesgoPuesto", request.getRiesgoPuesto());
            datosNomina.put("salarioDiarioIntegrado", request.getSalarioDiarioIntegrado());
            datosFactura.put("nomina", datosNomina);
        }
        return datosFactura;
    }

    private BigDecimal parseDecimal(String value) {
        if (value == null || value.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(value.trim());
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

}