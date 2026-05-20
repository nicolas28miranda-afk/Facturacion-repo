package com.cibercom.facturacion_back.service;

import com.cibercom.facturacion_back.dao.ConceptoOracleDAO;
import com.cibercom.facturacion_back.dao.RetencionOracleDAO;
import com.cibercom.facturacion_back.dao.UuidFacturaOracleDAO;
import com.cibercom.facturacion_back.dto.PacTimbradoRequest;
import com.cibercom.facturacion_back.dto.PacTimbradoResponse;
import com.cibercom.facturacion_back.dto.RetencionRequest;
import com.cibercom.facturacion_back.dto.RetencionResponse;
import com.cibercom.facturacion_back.integration.RetentionsPacClient;
import com.cibercom.facturacion_back.model.ClienteCatalogo;
import com.cibercom.facturacion_back.service.CfdiFirmaService;
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
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@Profile("oracle")
public class RetencionService {

    private static final Logger logger = LoggerFactory.getLogger(RetencionService.class);
    private static final DateTimeFormatter FECHA_HORA = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    
    // Mapeo de tipos de retención a claves del SAT
    private static final Map<String, String> CLAVE_RETENCION_MAP = crearMapaClavesRetencion();
    
    private final ConceptoOracleDAO conceptoOracleDAO;
    private final RetencionOracleDAO retencionOracleDAO;
    private final UuidFacturaOracleDAO uuidFacturaOracleDAO;
    private final ClienteCatalogoService clienteCatalogoService;
    private final RetentionsPacClient retentionsPacClient;
    private final ITextPdfService iTextPdfService;
    private final CorreoService correoService;
    private final FormatoCorreoService formatoCorreoService;
    private final LogoBrandingService logoBrandingService;
    private final Environment environment;
    private final com.cibercom.facturacion_back.service.FacturaService facturaService;
    private final CfdiFirmaService cfdiFirmaService;

    // Inyectar valores de application.yml usando @Value (igual que FacturaService y PagoService)
    @Value("${facturacion.emisor.rfc:IVD920810GU2}")
    private String rfcEmisorDefault;
    
    @Value("${facturacion.emisor.nombre:INNOVACION VALOR Y DESARROLLO SA}")
    private String nombreEmisorDefault;
    
    @Value("${facturacion.emisor.regimen:601}")
    private String regimenFiscalEmisorDefault;
    
    @Value("${facturacion.emisor.cp:58000}")
    private String codigoPostalEmisorDefault;
    
    // Propiedad para indicar si el emisor es una entidad fiduciaria del sector financiero
    // El complemento SectorFinanciero solo se usa cuando es true
    @Value("${facturacion.emisor.esFiduciaria:false}")
    private boolean esEmisorFiduciaria;
    
    @Value("${server.base-url:http://localhost:8080}")
    private String serverBaseUrl;

    public RetencionService(ConceptoOracleDAO conceptoOracleDAO,
                           RetencionOracleDAO retencionOracleDAO,
                           UuidFacturaOracleDAO uuidFacturaOracleDAO,
                           ClienteCatalogoService clienteCatalogoService,
                           RetentionsPacClient retentionsPacClient,
                           ITextPdfService iTextPdfService,
                           CorreoService correoService,
                           FormatoCorreoService formatoCorreoService,
                           LogoBrandingService logoBrandingService,
                           Environment environment,
                           com.cibercom.facturacion_back.service.FacturaService facturaService,
                           org.springframework.beans.factory.ObjectProvider<CfdiFirmaService> cfdiFirmaServiceProvider) {
        this.conceptoOracleDAO = conceptoOracleDAO;
        this.retencionOracleDAO = retencionOracleDAO;
        this.uuidFacturaOracleDAO = uuidFacturaOracleDAO;
        this.clienteCatalogoService = clienteCatalogoService;
        this.retentionsPacClient = retentionsPacClient;
        this.iTextPdfService = iTextPdfService;
        this.correoService = correoService;
        this.formatoCorreoService = formatoCorreoService;
        this.logoBrandingService = logoBrandingService;
        this.environment = environment;
        this.facturaService = facturaService;
        this.cfdiFirmaService = cfdiFirmaServiceProvider.getIfAvailable();
    }

    public RetencionResponse registrarRetencion(RetencionRequest request, Long usuario) {
        RetencionResponse response = new RetencionResponse();
        List<String> errores = new ArrayList<>();
        response.setErrors(errores);

        if (request == null) {
            errores.add("Solicitud vacía.");
            response.setSuccess(false);
            response.setMessage("Solicitud inválida.");
            return response;
        }

        // CRÍTICO: Obtener RFC del emisor OBLIGATORIAMENTE del certificado (.cer)
        // Finkok requiere que el RFC del emisor coincida exactamente con el del certificado
        // Método copiado de PagoService que ya funciona correctamente
        String rfcEmisor = null;
        try {
            if (cfdiFirmaService != null) {
                java.security.cert.X509Certificate certificado = cfdiFirmaService.cargarCertificado();
                if (certificado != null) {
                    String subjectDN = certificado.getSubjectX500Principal().getName();
                    logger.info("═══════════════════════════════════════════════════════════════");
                    logger.info("📋 OBTENIENDO RFC DEL CERTIFICADO (.cer)");
                    logger.info("  SubjectDN completo: {}", subjectDN);
                    logger.info("  Serial Number: {}", certificado.getSerialNumber());
                    logger.info("═══════════════════════════════════════════════════════════════");
                    
                    // Extraer RFC del SubjectDN usando el mismo método que PagoService (que ya funciona)
                    String rfcCertificado = extraerRFCDeSubjectDN(subjectDN);
                    if (rfcCertificado != null && !rfcCertificado.trim().isEmpty()) {
                        rfcEmisor = rfcCertificado.trim().toUpperCase();
                        logger.info("✓✓✓ RFC del emisor extraído del certificado: {}", rfcEmisor);
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("No se pudo obtener RFC del certificado: {}", e.getMessage());
        }
        
        // Si no se obtuvo del certificado, usar el de application.yml o del request
        if (rfcEmisor == null || rfcEmisor.isEmpty()) {
            rfcEmisor = defaultString(request.getRfcEmisor(), rfcEmisorDefault);
            logger.info("✓ RFC del emisor obtenido de configuración/request: {}", rfcEmisor);
        }
        
        // Validar que el RFC sea válido
        if (rfcEmisor == null || rfcEmisor.isEmpty() || rfcEmisor.length() < 12 || rfcEmisor.length() > 13) {
            logger.error("✗✗✗ ERROR: RFC del emisor no es válido: '{}'", rfcEmisor);
            errores.add("El RFC del emisor no es válido: " + rfcEmisor);
            response.setSuccess(false);
            response.setMessage("RFC del emisor inválido.");
            return response;
        }
        
        logger.info("═══════════════════════════════════════════════════════════════");
        logger.info("✓ RFC DEL EMISOR CONFIRMADO: {}", rfcEmisor);
        logger.info("═══════════════════════════════════════════════════════════════");
        String rfcReceptor = safeTrim(request.getRfcReceptor());
        String tipoRetencion = safeTrim(request.getTipoRetencion());
        BigDecimal montoBase = request.getMontoBase();
        String correoReceptor = safeTrim(request.getCorreoReceptor());
        String periodoMes = safeTrim(request.getPeriodoMes());
        String periodoAnio = safeTrim(request.getPeriodoAnio());
        String fechaPago = safeTrim(request.getFechaPago());
        String concepto = safeTrim(request.getConcepto());

        if (rfcEmisor == null || rfcReceptor == null || tipoRetencion == null || 
            montoBase == null || montoBase.compareTo(BigDecimal.ZERO) <= 0) {
            errores.add("Datos incompletos: RFC emisor, RFC receptor, tipo de retención y monto base son obligatorios.");
            response.setSuccess(false);
            response.setMessage("Datos incompletos.");
            return response;
        }

        if (correoReceptor == null || !correoReceptor.contains("@")) {
            errores.add("El correo del receptor es obligatorio y debe tener un formato válido.");
            response.setSuccess(false);
            response.setMessage("Correo del receptor inválido.");
            return response;
        }

        // Calcular montos retenidos
        BigDecimal isrRetenido = request.getIsrRetenido() != null ? request.getIsrRetenido() : BigDecimal.ZERO;
        BigDecimal ivaRetenido = request.getIvaRetenido() != null ? request.getIvaRetenido() : BigDecimal.ZERO;
        BigDecimal montoRetenido = isrRetenido.add(ivaRetenido);
        
        // Validar que los montos retenidos sean válidos
        if (isrRetenido.compareTo(BigDecimal.ZERO) < 0) {
            errores.add("El ISR retenido no puede ser negativo.");
            response.setSuccess(false);
            response.setMessage("ISR retenido inválido.");
            return response;
        }
        if (ivaRetenido.compareTo(BigDecimal.ZERO) < 0) {
            errores.add("El IVA retenido no puede ser negativo.");
            response.setSuccess(false);
            response.setMessage("IVA retenido inválido.");
            return response;
        }
        
        if (montoRetenido.compareTo(BigDecimal.ZERO) <= 0) {
            errores.add("El monto retenido debe ser mayor a cero.");
            response.setSuccess(false);
            response.setMessage("Monto retenido inválido.");
            return response;
        }
        
        // Validar que al menos uno de los impuestos tenga monto > 0
        if (isrRetenido.compareTo(BigDecimal.ZERO) <= 0 && ivaRetenido.compareTo(BigDecimal.ZERO) <= 0) {
            errores.add("Debe haber al menos un impuesto retenido (ISR o IVA) con monto mayor a cero.");
            response.setSuccess(false);
            response.setMessage("Impuestos retenidos inválidos.");
            return response;
        }
        
        logger.info("═══════════════════════════════════════════════════════════════");
        logger.info("📋 VALIDACIÓN DE IMPUESTOS RETENIDOS:");
        logger.info("  ISR Retenido: {}", formatMonto(isrRetenido));
        logger.info("  IVA Retenido: {}", formatMonto(ivaRetenido));
        logger.info("  Monto Total Retenido: {}", formatMonto(montoRetenido));
        logger.info("═══════════════════════════════════════════════════════════════");

        // Determinar impuesto principal
        String impuesto = determinarImpuesto(tipoRetencion, isrRetenido, ivaRetenido);
        
        // CRÍTICO: Usar la clave de retención directamente del formulario si está presente
        // Si no está presente, usar el mapeo basado en tipoRetencion
        String claveRetencion;
        if (request.getCveRetenc() != null && !request.getCveRetenc().trim().isEmpty()) {
            claveRetencion = request.getCveRetenc().trim();
            logger.info("📋 Usando CveRetenc del formulario: {}", claveRetencion);
        } else {
            claveRetencion = CLAVE_RETENCION_MAP.getOrDefault(tipoRetencion, "25");
            logger.info("📋 Usando CveRetenc del mapeo (tipoRetencion={}): {}", tipoRetencion, claveRetencion);
        }
        
        // Validar que la clave de retención sea válida (01-28 según catRetenciones.xsd.xml)
        try {
            int claveInt = Integer.parseInt(claveRetencion);
            if (claveInt < 1 || claveInt > 28) {
                logger.error("✗✗✗ ERROR: Clave de retención inválida: {}. Debe estar entre 01 y 28", claveRetencion);
                errores.add("Clave de retención inválida: " + claveRetencion + ". Debe estar entre 01 y 28.");
                response.setSuccess(false);
                response.setMessage("Clave de retención inválida.");
                return response;
            }
            // Asegurar formato de 2 dígitos
            claveRetencion = String.format("%02d", claveInt);
        } catch (NumberFormatException e) {
            logger.error("✗✗✗ ERROR: Clave de retención no es numérica: {}", claveRetencion);
            errores.add("Clave de retención no es numérica: " + claveRetencion);
            response.setSuccess(false);
            response.setMessage("Clave de retención inválida.");
            return response;
        }
        
        logger.info("✓ Clave de retención validada: {}", claveRetencion);

        // Parsear fechas y períodos
        LocalDate fechaPagoDate = parseFecha(fechaPago).orElse(LocalDate.now());
        Integer periodoMesInt = parseInteger(periodoMes);
        Integer periodoAnioInt = parseInteger(periodoAnio);
        
        if (periodoMesInt == null || periodoAnioInt == null) {
            errores.add("El período (mes y año) es obligatorio.");
            response.setSuccess(false);
            response.setMessage("Período inválido.");
            return response;
        }

        Long usuarioRegistro = parseUsuario(request.getUsuarioRegistro());

        // Resolver ID del receptor
        String razonSocialReceptor = construirRazonSocial(request);
        Long idReceptor = resolverIdReceptorPorRfc(rfcReceptor, razonSocialReceptor, correoReceptor);

        // Generar serie y folio
        String serieRetencion = "RET";
        String folioRetencion = generarFolioRetencion();
        
        // Construir XML de retención
        // CRÍTICO: Usar nombre del emisor desde @Value (application.yml) - igual que FacturaService y PagoService
        // El nombre debe coincidir EXACTAMENTE con el registrado en Finkok (demo) o SAT (producción)
        String nombreEmisorFinal = nombreEmisorDefault != null && !nombreEmisorDefault.trim().isEmpty() 
                ? nombreEmisorDefault.trim() 
                : rfcEmisor;
        String regimenEmisorFinal = regimenFiscalEmisorDefault != null && !regimenFiscalEmisorDefault.trim().isEmpty()
                ? regimenFiscalEmisorDefault.trim()
                : "601";
        
        logger.info("═══════════════════════════════════════════════════════════════");
        logger.info("📋 DATOS DEL EMISOR PARA RETENCIÓN:");
        logger.info("  RFC: {} (obtenido del certificado)", rfcEmisor);
        logger.info("  Nombre: '{}' (desde application.yml)", nombreEmisorFinal);
        logger.info("  Régimen Fiscal: {}", regimenEmisorFinal);
        logger.info("═══════════════════════════════════════════════════════════════");
        
        // CRÍTICO: Obtener código postal del receptor del request
        // Debe ser un código postal válido del catálogo c_CodigoPostal del SAT (5 dígitos)
        String codigoPostalReceptor = safeTrim(request.getCodigoPostalReceptor());
        if (codigoPostalReceptor == null || codigoPostalReceptor.trim().isEmpty()) {
            // Intentar obtener del catálogo de clientes si existe
            try {
                Optional<ClienteCatalogo> clienteOpt = clienteCatalogoService.buscarPorRfc(rfcReceptor.trim().toUpperCase());
                if (clienteOpt.isPresent() && clienteOpt.get().getDomicilioFiscal() != null) {
                    // Extraer código postal del domicilio fiscal si está disponible
                    String domicilio = clienteOpt.get().getDomicilioFiscal();
                    // Buscar código postal (5 dígitos) en el domicilio
                    java.util.regex.Pattern cpPattern = java.util.regex.Pattern.compile("\\b([0-9]{5})\\b");
                    java.util.regex.Matcher matcher = cpPattern.matcher(domicilio);
                    if (matcher.find()) {
                        codigoPostalReceptor = matcher.group(1);
                        logger.info("✓ Código postal obtenido del catálogo de clientes: {}", codigoPostalReceptor);
                    }
                }
            } catch (Exception e) {
                logger.warn("No se pudo obtener código postal del catálogo de clientes: {}", e.getMessage());
            }
        }
        
        // Si aún no hay código postal, usar el del emisor como fallback
        if (codigoPostalReceptor == null || codigoPostalReceptor.trim().isEmpty()) {
            codigoPostalReceptor = codigoPostalEmisorDefault != null && !codigoPostalEmisorDefault.trim().isEmpty()
                    ? codigoPostalEmisorDefault.trim()
                    : "58000"; // Código postal por defecto (Morelia, Michoacán)
            logger.warn("⚠️ Usando código postal del emisor como fallback: {}", codigoPostalReceptor);
        }
        
        // Normalizar código postal (solo 5 dígitos numéricos)
        codigoPostalReceptor = codigoPostalReceptor.trim().replaceAll("\\D", ""); // Solo dígitos
        if (codigoPostalReceptor.length() > 5) {
            codigoPostalReceptor = codigoPostalReceptor.substring(0, 5);
        } else if (codigoPostalReceptor.length() < 5) {
            codigoPostalReceptor = String.format("%05d", Integer.parseInt(codigoPostalReceptor.isEmpty() ? "0" : codigoPostalReceptor));
        }
        
        logger.info("═══════════════════════════════════════════════════════════════");
        logger.info("📋 CÓDIGO POSTAL DEL RECEPTOR:");
        logger.info("  Código Postal: '{}' (normalizado)", codigoPostalReceptor);
        logger.info("═══════════════════════════════════════════════════════════════");
        
        // Construir XML de retención según XSD retencionpagov2.xsd.xml
        String xmlRetencion = construirXmlRetencion(
                rfcEmisor,
                nombreEmisorFinal,
                regimenEmisorFinal,
                rfcReceptor,
                razonSocialReceptor,
                correoReceptor,
                tipoRetencion,
                claveRetencion,
                montoBase,
                impuesto,
                isrRetenido,
                ivaRetenido,
                montoRetenido,
                periodoMesInt,
                periodoAnioInt,
                fechaPagoDate,
                concepto,
                serieRetencion,
                folioRetencion,
                codigoPostalReceptor
        );
        
        logger.info("═══════════════════════════════════════════════════════════════");
        logger.info("📋 XML RETENCIÓN GENERADO (antes de firmar)");
        // Log del XML completo para depuración
        logger.info("═══════════════════════════════════════════════════════════════");
        logger.info("📄 XML COMPLETO GENERADO:");
        logger.info("{}", xmlRetencion);
        logger.info("═══════════════════════════════════════════════════════════════");
        
        // Verificar que ImpRetenidos tenga ImpuestoRet
        if (xmlRetencion.contains("<retenciones:ImpRetenidos")) {
            int index = xmlRetencion.indexOf("<retenciones:ImpRetenidos");
            String impRetenidosSection = xmlRetencion.substring(index, Math.min(index + 200, xmlRetencion.length()));
            logger.info("🔍 SECCIÓN ImpRetenidos EN XML:");
            logger.info("{}", impRetenidosSection);
            
            if (!impRetenidosSection.contains("ImpuestoRet")) {
                logger.error("✗✗✗ ERROR CRÍTICO: ImpRetenidos NO contiene ImpuestoRet");
            } else {
                logger.info("✓ ImpRetenidos contiene ImpuestoRet");
            }
        }
        logger.info("  Serie: {}, Folio: {}", serieRetencion, folioRetencion);
        logger.info("  RFC Emisor: {} (del certificado)", rfcEmisor);
        logger.info("  RFC Receptor: {}", rfcReceptor);
        logger.info("  Clave Retención: {}", claveRetencion);
        logger.info("  Monto Retenido: {}", montoRetenido);
        logger.info("═══════════════════════════════════════════════════════════════");
        
        // Verificar que el RFC del emisor esté en el XML ANTES de firmar
        logger.info("═══════════════════════════════════════════════════════════════");
        logger.info("🔍 VERIFICANDO RFC EN XML ANTES DE FIRMAR");
        logger.info("  RFC esperado en XML: {}", rfcEmisor);
        logger.info("  XML contiene RfcE: {}", xmlRetencion.contains("RfcE="));
        if (xmlRetencion.contains("RfcE=\"")) {
            // Extraer el RFC del XML para comparar
            int inicioRfc = xmlRetencion.indexOf("RfcE=\"") + 6;
            int finRfc = xmlRetencion.indexOf("\"", inicioRfc);
            if (finRfc > inicioRfc) {
                String rfcEnXml = xmlRetencion.substring(inicioRfc, finRfc);
                logger.info("  RFC encontrado en XML: '{}'", rfcEnXml);
                logger.info("  RFC coincide: {}", rfcEnXml.equals(rfcEmisor));
            }
        }
        logger.info("═══════════════════════════════════════════════════════════════");
        
        // Verificar que el RFC del emisor esté en el XML ANTES de firmar
        logger.info("═══════════════════════════════════════════════════════════════");
        logger.info("🔍 VERIFICANDO RFC EN XML ANTES DE FIRMAR");
        logger.info("  RFC esperado en XML: '{}'", rfcEmisor);
        logger.info("  RFC esperado (longitud): {}", rfcEmisor != null ? rfcEmisor.length() : 0);
        logger.info("  XML contiene RfcE: {}", xmlRetencion.contains("RfcE="));
        if (xmlRetencion.contains("RfcE=\"")) {
            // Extraer el RFC del XML para comparar
            int inicioRfc = xmlRetencion.indexOf("RfcE=\"") + 6;
            int finRfc = xmlRetencion.indexOf("\"", inicioRfc);
            if (finRfc > inicioRfc) {
                String rfcEnXml = xmlRetencion.substring(inicioRfc, finRfc);
                logger.info("  RFC encontrado en XML: '{}'", rfcEnXml);
                logger.info("  RFC encontrado (longitud): {}", rfcEnXml.length());
                logger.info("  RFC coincide: {}", rfcEnXml.equals(rfcEmisor));
                if (!rfcEnXml.equals(rfcEmisor)) {
                    logger.error("✗✗✗ ERROR: RFC en XML no coincide con RFC del certificado");
                    logger.error("✗✗✗ RFC en XML: '{}'", rfcEnXml);
                    logger.error("✗✗✗ RFC del certificado: '{}'", rfcEmisor);
                }
            }
        }
        // CRÍTICO: Verificar que ImpRetenidos tenga ImpuestoRet antes de firmar
        logger.info("═══════════════════════════════════════════════════════════════");
        logger.info("🔍 VERIFICANDO ImpRetenidos EN XML ANTES DE FIRMAR");
        if (xmlRetencion.contains("<retenciones:ImpRetenidos")) {
            // Extraer todas las secciones ImpRetenidos
            String[] partes = xmlRetencion.split("<retenciones:ImpRetenidos");
            for (int i = 1; i < partes.length; i++) {
                String seccion = partes[i].substring(0, Math.min(200, partes[i].length()));
                logger.info("  ImpRetenidos {}: {}", i, seccion);
                if (!seccion.contains("ImpuestoRet")) {
                    logger.error("✗✗✗ ERROR CRÍTICO: ImpRetenidos {} NO contiene ImpuestoRet", i);
                } else {
                    // Extraer el valor de ImpuestoRet
                    int inicio = seccion.indexOf("ImpuestoRet=\"") + 13;
                    int fin = seccion.indexOf("\"", inicio);
                    if (fin > inicio) {
                        String impuestoRet = seccion.substring(inicio, fin);
                        logger.info("  ✓ ImpRetenidos {} contiene ImpuestoRet=\"{}\"", i, impuestoRet);
                    }
                }
                if (!seccion.contains("TipoPagoRet")) {
                    logger.error("✗✗✗ ERROR CRÍTICO: ImpRetenidos {} NO contiene TipoPagoRet", i);
                } else {
                    // Extraer el valor de TipoPagoRet
                    int inicio = seccion.indexOf("TipoPagoRet=\"") + 12;
                    int fin = seccion.indexOf("\"", inicio);
                    if (fin > inicio) {
                        String tipoPagoRet = seccion.substring(inicio, fin);
                        logger.info("  ✓ ImpRetenidos {} contiene TipoPagoRet=\"{}\"", i, tipoPagoRet);
                    }
                }
            }
        } else {
            logger.error("✗✗✗ ERROR CRÍTICO: XML NO contiene <retenciones:ImpRetenidos");
        }
        logger.info("═══════════════════════════════════════════════════════════════");
        
        if (!xmlRetencion.contains("RfcE=\"" + rfcEmisor + "\"")) {
            logger.error("✗✗✗ ERROR CRÍTICO: El RFC del emisor no está en el XML generado");
            logger.error("✗✗✗ RFC esperado: '{}'", rfcEmisor);
            logger.error("✗✗✗ XML (primeros 1000 caracteres): {}", xmlRetencion.substring(0, Math.min(1000, xmlRetencion.length())));
            errores.add("El RFC del emisor no se incluyó correctamente en el XML.");
            response.setSuccess(false);
            response.setMessage("Error al generar XML: RFC del emisor no incluido.");
            return response;
        }
        logger.info("✓ RFC del emisor verificado en el XML: '{}'", rfcEmisor);

        // Preparar request para timbrado con Finkok
        // CRÍTICO: El RFC del emisor DEBE ser el del certificado para que Finkok lo valide
        // El RetentionsPacClient se encargará de firmar el XML antes de enviarlo a Finkok
        logger.info("═══════════════════════════════════════════════════════════════");
        logger.info("📋 PREPARANDO REQUEST PARA FINKOK");
        logger.info("  RFC Emisor: {} (OBLIGATORIO - del certificado)", rfcEmisor);
        logger.info("  RFC Receptor: {}", rfcReceptor);
        logger.info("  Tipo: RETENCION");
        logger.info("═══════════════════════════════════════════════════════════════");
        
        PacTimbradoRequest pacRequest = PacTimbradoRequest.builder()
                .xmlContent(xmlRetencion)
                .rfcEmisor(rfcEmisor)  // CRÍTICO: Debe ser el RFC del certificado
                .rfcReceptor(rfcReceptor)
                .total(montoRetenido.setScale(2, RoundingMode.HALF_UP).doubleValue())
                .tipo("RETENCION")
                .fechaFactura(LocalDateTime.now().toString())
                .publicoGeneral(false)
                .serie(serieRetencion)
                .folio(folioRetencion)
                .medioPago("99")
                .formaPago("99")
                .usoCFDI("G03")
                .relacionadosUuids(null)
                .build();

        logger.info("Enviando retención a Finkok para timbrado...");
        PacTimbradoResponse pacResp = retentionsPacClient.solicitarTimbrado(pacRequest);
        if (pacResp == null || Boolean.FALSE.equals(pacResp.getOk())) {
            errores.add(pacResp != null && pacResp.getMessage() != null
                    ? pacResp.getMessage()
                    : "PAC no disponible para timbrado.");
            response.setSuccess(false);
            response.setMessage("Error al timbrar retención.");
            return response;
        }

        String uuidRetencion = safeTrim(pacResp.getUuid());
        if (uuidRetencion == null) {
            uuidRetencion = UUID.randomUUID().toString().toUpperCase();
        }
        response.setUuidRetencion(uuidRetencion);

        LocalDateTime fechaTimbrado = pacResp != null && pacResp.getFechaTimbrado() != null
                ? pacResp.getFechaTimbrado()
                : LocalDateTime.now();

        // Obtener XML timbrado del PAC (ya incluye sello, certificado, etc.)
        String xmlTimbrado = pacResp.getXmlTimbrado();
        if (xmlTimbrado == null || xmlTimbrado.isBlank()) {
            // Si el PAC no devolvió XML timbrado, usar el XML original firmado
            // (el XML ya debería estar firmado antes de enviarlo al PAC)
            xmlTimbrado = xmlRetencion;
            logger.warn("El PAC no devolvió XML timbrado, usando XML original firmado");
        }
        response.setXmlTimbrado(xmlTimbrado);
        response.setSerieRetencion(serieRetencion);
        response.setFolioRetencion(folioRetencion);
        response.setFechaTimbrado(fechaTimbrado.format(FECHA_HORA));
        response.setMontoRetenido(montoRetenido.setScale(2, RoundingMode.HALF_UP));
        response.setBaseRetencion(montoBase.setScale(2, RoundingMode.HALF_UP));
        response.setCorreoReceptor(correoReceptor);
        response.setRfcReceptor(rfcReceptor);
        response.setRfcEmisor(rfcEmisor);

        // Insertar en FACTURAS (tipo_factura = 6 para retenciones)
        // Estado EMITIDA = "0" cuando Finkok la devuelve timbrada
        String estadoEmitida = com.cibercom.facturacion_back.model.EstadoFactura.EMITIDA.getCodigo(); // "0"
        String estadoDescripcion = com.cibercom.facturacion_back.model.EstadoFactura.EMITIDA.getDescripcion(); // "EMITIDA"
        boolean insercionFactura = uuidFacturaOracleDAO.insertarBasicoConIdReceptor(
                uuidRetencion,
                xmlTimbrado,
                serieRetencion,
                folioRetencion,
                montoBase,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                montoRetenido,
                "99",
                "G03",
                estadoEmitida, // "0" = EMITIDA
                estadoDescripcion, // "EMITIDA"
                "99",
                rfcReceptor,
                rfcEmisor,
                correoReceptor,
                idReceptor,
                Integer.valueOf(6), // tipo_factura = 6 para retenciones
                usuario // usuario que emitió la retención
        );

        if (!insercionFactura) {
            String detalle = uuidFacturaOracleDAO.getLastInsertError();
            errores.add("FACTURAS: no se pudo insertar la retención. " + (detalle != null ? detalle : ""));
            response.setSuccess(false);
            response.setMessage("Error al registrar la retención en FACTURAS.");
            return response;
        }

        // Obtener ID_FACTURA recién insertado
        Optional<Long> facturaIdOpt = conceptoOracleDAO.obtenerIdFacturaPorUuid(uuidRetencion);
        Long facturaId = facturaIdOpt.orElse(null);
        
        if (facturaId == null) {
            errores.add("No se pudo obtener el ID_FACTURA de la retención insertada.");
            response.setSuccess(false);
            response.setMessage("Error al obtener ID_FACTURA.");
            return response;
        }

        response.setFacturaId(facturaId);

        // Insertar en RETENCIONES
        RetencionOracleDAO.RetencionRegistro registro = new RetencionOracleDAO.RetencionRegistro(
                facturaId,
                tipoRetencion,
                claveRetencion,
                montoBase.setScale(2, RoundingMode.HALF_UP),
                impuesto,
                montoRetenido.setScale(2, RoundingMode.HALF_UP),
                periodoMesInt,
                periodoMesInt, // PERIODO_MES_FIN igual a PERIODO_MES_INI si es un solo mes
                periodoAnioInt,
                uuidRetencion,
                fechaPagoDate,
                concepto,
                usuarioRegistro
        );

        Optional<Long> idRetencionOpt = retencionOracleDAO.insertarRetencion(registro);
        if (idRetencionOpt.isEmpty()) {
            String detalle = retencionOracleDAO.getLastInsertError();
            errores.add("RETENCIONES: no se pudo insertar. " + (detalle != null ? detalle : ""));
            response.setSuccess(false);
            response.setMessage("Error al registrar en RETENCIONES.");
            return response;
        }

        response.setIdRetencion(idRetencionOpt.get());
        response.setSuccess(true);
        response.setMessage("Retención timbrada y registrada correctamente. UUID: " + uuidRetencion);

        return response;
    }

    // Métodos auxiliares
    private String safeTrim(String s) {
        return s != null ? s.trim() : null;
    }

    private String defaultString(String s, String def) {
        return s != null && !s.isBlank() ? s : def;
    }

    private Optional<LocalDate> parseFecha(String fechaStr) {
        if (fechaStr == null || fechaStr.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(LocalDate.parse(fechaStr));
        } catch (Exception e) {
            logger.warn("Error al parsear fecha: {}", fechaStr);
            return Optional.empty();
        }
    }

    private Integer parseInteger(String str) {
        if (str == null || str.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(str);
        } catch (Exception e) {
            return null;
        }
    }

    private Long parseUsuario(String usuarioStr) {
        if (usuarioStr == null || usuarioStr.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(usuarioStr);
        } catch (Exception e) {
            return null;
        }
    }

    private String determinarImpuesto(String tipoRetencion, BigDecimal isrRetenido, BigDecimal ivaRetenido) {
        if (tipoRetencion != null && tipoRetencion.startsWith("ISR_")) {
            return "ISR";
        } else if ("IVA".equals(tipoRetencion)) {
            return "IVA";
        } else if (isrRetenido != null && isrRetenido.compareTo(BigDecimal.ZERO) > 0) {
            return "ISR";
        } else if (ivaRetenido != null && ivaRetenido.compareTo(BigDecimal.ZERO) > 0) {
            return "IVA";
        }
        return "ISR"; // Por defecto
    }

    private String construirRazonSocial(RetencionRequest request) {
        if ("moral".equalsIgnoreCase(request.getTipoPersona())) {
            return defaultString(request.getRazonSocial(), "");
        } else {
            // Persona física: nombre + paterno + materno
            String nombre = defaultString(request.getNombre(), "");
            String paterno = defaultString(request.getPaterno(), "");
            String materno = defaultString(request.getMaterno(), "");
            return (nombre + " " + paterno + " " + materno).trim();
        }
    }

    private Long resolverIdReceptorPorRfc(String rfc, String razonSocial, String correo) {
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
            nuevo.setRazonSocial(razonSocial != null ? razonSocial : rfc);
            nuevo.setCorreoElectronico(correo);
            ClienteCatalogo guardado = clienteCatalogoService.guardar(nuevo);
            return guardado != null ? guardado.getIdCliente() : null;
        } catch (Exception e) {
            logger.error("Error al resolver ID receptor por RFC {}: {}", rfc, e.getMessage(), e);
            return null;
        }
    }

    private String generarFolioRetencion() {
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

    private String construirXmlRetencion(String rfcEmisor, String nombreEmisor, String regimenFiscalEmisor,
                                        String rfcReceptor, String razonSocialReceptor,
                                        String correoReceptor, String tipoRetencion, String claveRetencion,
                                        BigDecimal montoBase, String impuesto, BigDecimal isrRetenido,
                                        BigDecimal ivaRetenido, BigDecimal montoRetenido,
                                        Integer periodoMes, Integer periodoAnio, LocalDate fechaPago,
                                        String concepto, String serie, String folio, String codigoPostalReceptor) {
        // Construir XML básico de retención (CFDI de Retenciones e Información de Pagos 2.0)
        // Este es un esqueleto que debe completarse según el formato exacto del SAT
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        // LugarExpRetenc: Código postal del lugar de expedición (obligatorio)
        String lugarExpRetenc = codigoPostalEmisorDefault != null && !codigoPostalEmisorDefault.trim().isEmpty() 
                ? codigoPostalEmisorDefault.trim() 
                : "58000";
        
        // CRÍTICO: Determinar primero si se requiere un complemento para declarar su namespace en el elemento raíz
        // El XSLT principal declara los namespaces de los complementos en el elemento raíz, por lo que el XML también debe hacerlo
        String complementoXml = construirComplementoSiEsRequerido(claveRetencion, montoBase, montoRetenido, fechaPago);
        String namespaceComplemento = "";
        String schemaLocationComplemento = "";
        
        if (complementoXml != null && !complementoXml.trim().isEmpty()) {
            // Determinar qué namespace y schemaLocation se necesita según la clave de retención
            namespaceComplemento = obtenerNamespaceComplemento(claveRetencion);
            schemaLocationComplemento = obtenerSchemaLocationComplemento(claveRetencion);
        }
        
        // Construir el elemento raíz con los namespaces necesarios
        // Siempre incluir el namespace principal de retenciones
        xml.append("<retenciones:Retenciones xmlns:retenciones=\"http://www.sat.gob.mx/esquemas/retencionpago/2\" ")
           .append("xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" ");
        
        // Agregar el namespace del complemento si es necesario
        if (!namespaceComplemento.isEmpty()) {
            xml.append(namespaceComplemento).append(" ");
        }
        
        // Construir schemaLocation: siempre incluir el principal
        StringBuilder schemaLocation = new StringBuilder();
        schemaLocation.append("http://www.sat.gob.mx/esquemas/retencionpago/2 http://www.sat.gob.mx/esquemas/retencionpago/2/retencionpagov2.xsd");
        
        // Agregar el schemaLocation del complemento si es necesario
        if (!schemaLocationComplemento.isEmpty()) {
            schemaLocation.append(" ").append(schemaLocationComplemento);
        }
        
        // CRÍTICO: El orden de los atributos DEBE coincidir con el orden del XSLT para generar la cadena original correctamente
        // Orden según XSLT: Version, NoCertificado, FolioInt, FechaExp, LugarExpRetenc, CveRetenc, DescRetenc
        // Nota: NoCertificado se agregará después en el proceso de firma, pero el orden de los demás atributos debe ser correcto
        
        // CRÍTICO: DescRetenc debe coincidir con la clave de retención para evitar error Reten20107 de Finkok
        // Usar la descripción oficial del tipo de retención en lugar del concepto directo
        String descRetenc = obtenerDescripcionTipoRetencion(tipoRetencion);
        // Si la descripción es muy larga o no está disponible, usar el concepto como fallback
        if (descRetenc == null || descRetenc.trim().isEmpty() || descRetenc.equals(tipoRetencion)) {
            descRetenc = (concepto != null && !concepto.trim().isEmpty()) ? concepto : tipoRetencion;
        }
        // Limitar la longitud a 100 caracteres según el XSD
        if (descRetenc.length() > 100) {
            descRetenc = descRetenc.substring(0, 100);
        }
        
        logger.info("📋 DescRetenc asignada: '{}' para clave {} (tipoRetencion: {})", descRetenc, claveRetencion, tipoRetencion);
        
        xml.append("xsi:schemaLocation=\"").append(schemaLocation.toString()).append("\" ")
           .append("Version=\"2.0\" ")
           .append("FolioInt=\"").append(folio).append("\" ")
           .append("FechaExp=\"").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"))).append("\" ")
           .append("LugarExpRetenc=\"").append(lugarExpRetenc).append("\" ")
           .append("CveRetenc=\"").append(claveRetencion).append("\" ")
           .append("DescRetenc=\"").append(escapeXml(descRetenc)).append("\">\n");
        
        // CRÍTICO: El RFC del emisor DEBE ser el del certificado (.cer)
        // Finkok valida que el RFC en el XML coincida con el del certificado usado para firmar
        logger.info("═══════════════════════════════════════════════════════════════");
        logger.info("📋 INCLUYENDO RFC DEL EMISOR EN XML");
        logger.info("  RFC Emisor (del certificado): '{}'", rfcEmisor);
        logger.info("  RFC Emisor (longitud): {}", rfcEmisor != null ? rfcEmisor.length() : 0);
        logger.info("  Nombre Emisor: '{}'", nombreEmisor);
        logger.info("  Régimen Fiscal: '{}'", regimenFiscalEmisor);
        logger.info("═══════════════════════════════════════════════════════════════");
        
        // Validar que el RFC no sea null o vacío antes de incluirlo
        if (rfcEmisor == null || rfcEmisor.trim().isEmpty()) {
            logger.error("✗✗✗ ERROR CRÍTICO: El RFC del emisor es null o vacío");
            throw new IllegalStateException("El RFC del emisor no puede ser null o vacío");
        }
        
        // Asegurar que el RFC esté en mayúsculas y sin espacios
        String rfcEmisorLimpio = rfcEmisor.trim().toUpperCase();
        logger.info("  RFC Emisor (limpio): '{}'", rfcEmisorLimpio);
        
        xml.append("  <retenciones:Emisor RfcE=\"").append(rfcEmisorLimpio).append("\" ")
           .append("NomDenRazSocE=\"").append(escapeXml(nombreEmisor)).append("\" ")
           .append("RegimenFiscalE=\"").append(regimenFiscalEmisor).append("\"/>\n");
        
        // Verificar que el RFC esté en el XML generado
        String xmlStr = xml.toString();
        if (!xmlStr.contains("RfcE=\"" + rfcEmisorLimpio + "\"")) {
            logger.error("✗✗✗ ERROR CRÍTICO: El RFC del emisor no se incluyó en el XML");
            logger.error("✗✗✗ RFC esperado: '{}'", rfcEmisorLimpio);
            logger.error("✗✗✗ XML generado (primeros 500 caracteres): {}", xmlStr.substring(0, Math.min(500, xmlStr.length())));
            throw new IllegalStateException("El RFC del emisor no se incluyó correctamente en el XML");
        }
        logger.info("✓ RFC del emisor verificado en el XML generado: '{}'", rfcEmisorLimpio);
        
        // CRÍTICO: Según XSD, Receptor debe tener un nodo Nacional o Extranjero dentro
        // NacionalidadR es un atributo del Receptor, no del nodo Nacional
        // Por defecto asumimos receptor nacional (puede extenderse para soportar extranjeros)
        // CRÍTICO: DomicilioFiscalR debe ser un código postal válido del catálogo c_CodigoPostal (5 dígitos)
        // No usar "00000" ya que Finkok rechaza con Reten20118
        String domicilioFiscalReceptor = codigoPostalReceptor != null && !codigoPostalReceptor.trim().isEmpty()
                ? codigoPostalReceptor.trim()
                : codigoPostalEmisorDefault != null && !codigoPostalEmisorDefault.trim().isEmpty()
                    ? codigoPostalEmisorDefault.trim()
                    : "58000"; // Fallback a código postal válido
        
        // Validar que el código postal tenga exactamente 5 dígitos
        domicilioFiscalReceptor = domicilioFiscalReceptor.replaceAll("\\D", ""); // Solo dígitos
        if (domicilioFiscalReceptor.length() != 5) {
            logger.error("✗✗✗ ERROR: Código postal del receptor debe tener 5 dígitos. Valor recibido: '{}'", codigoPostalReceptor);
            throw new IllegalStateException("El código postal del receptor debe tener exactamente 5 dígitos numéricos");
        }
        
        logger.info("═══════════════════════════════════════════════════════════════");
        logger.info("📋 INCLUYENDO CÓDIGO POSTAL DEL RECEPTOR EN XML");
        logger.info("  Código Postal (DomicilioFiscalR): '{}'", domicilioFiscalReceptor);
        logger.info("═══════════════════════════════════════════════════════════════");
        
        xml.append("  <retenciones:Receptor NacionalidadR=\"Nacional\">\n");
        xml.append("    <retenciones:Nacional RfcR=\"").append(rfcReceptor).append("\" ")
           .append("NomDenRazSocR=\"").append(escapeXml(razonSocialReceptor != null ? razonSocialReceptor : rfcReceptor)).append("\" ")
           .append("DomicilioFiscalR=\"").append(domicilioFiscalReceptor).append("\"/>\n");
        xml.append("  </retenciones:Receptor>\n");
        
        // CRÍTICO: Según XSD, el atributo debe ser "Ejercicio", no "Ejerc"
        xml.append("  <retenciones:Periodo MesIni=\"").append(String.format("%02d", periodoMes)).append("\" ")
           .append("MesFin=\"").append(String.format("%02d", periodoMes)).append("\" ")
           .append("Ejercicio=\"").append(periodoAnio).append("\"/>\n");
        
        // Totales según esquema oficial de retenciones
        // MontoTotOperacion: Monto total de la operación (base de retención)
        // MontoTotGrav: Monto total gravado
        // MontoTotExent: Monto total exento
        // MontoTotRet: Monto total retenido (ISR + IVA)
        BigDecimal montoTotGrav = montoBase != null ? montoBase : BigDecimal.ZERO;
        BigDecimal montoTotExent = BigDecimal.ZERO;
        BigDecimal montoTotRet = montoRetenido != null ? montoRetenido : BigDecimal.ZERO;
        
        xml.append("  <retenciones:Totales ")
           .append("MontoTotOperacion=\"").append(formatMonto(montoBase)).append("\" ")
           .append("MontoTotGrav=\"").append(formatMonto(montoTotGrav)).append("\" ")
           .append("MontoTotExent=\"").append(formatMonto(montoTotExent)).append("\" ")
           .append("MontoTotRet=\"").append(formatMonto(montoTotRet)).append("\">\n");
        
        // ImpRetenidos: Para cada tipo de impuesto retenido
        // CRÍTICO: El orden de los atributos DEBE coincidir con el XSLT: BaseRet, ImpuestoRet, MontoRet, TipoPagoRet
        // CRÍTICO: Validación Reten20135 - TipoPagoRet debe ser válido según ImpuestoRet:
        //   - IVA (002): SOLO puede usar TipoPagoRet="01" (Definitivo) - el IVA siempre es definitivo
        //   - ISR (001): Puede usar 01 (Definitivo), 02 (Provisional), 03 (A cuenta de definitivo), 04 (A cuenta de provisional)
        //   - IEPS (003): Similar a ISR
        // CRÍTICO: Aunque ImpuestoRet es opcional en el XSD, Finkok lo requiere para validar TipoPagoRet (Reten20135)
        // Por lo tanto, SIEMPRE debe incluirse ImpuestoRet cuando hay un monto retenido
        
        // Validar que haya al menos un impuesto retenido
        if ((isrRetenido == null || isrRetenido.compareTo(BigDecimal.ZERO) <= 0) && 
            (ivaRetenido == null || ivaRetenido.compareTo(BigDecimal.ZERO) <= 0)) {
            logger.error("✗✗✗ ERROR: Debe haber al menos un impuesto retenido (ISR o IVA)");
            throw new IllegalStateException("Debe haber al menos un impuesto retenido (ISR o IVA)");
        }
        
        if (isrRetenido != null && isrRetenido.compareTo(BigDecimal.ZERO) > 0) {
            // ISR: Puede usar cualquier TipoPagoRet (01-04), pero por defecto usamos 01 (Definitivo)
            // Para sueldos y salarios (clave 09), normalmente es definitivo
            String tipoPagoRetIsr = "01"; // Definitivo por defecto para ISR
            
            // CRÍTICO: SOLUCIÓN PARA RETEN20135
            // Finkok está rechazando cuando ImpuestoRet está presente para claves que no requieren complemento
            // Según el XSD, ImpuestoRet es OPCIONAL, no requerido
            // Para claves que no requieren complemento (01-13, 17, 20-22, 24-26), 
            // Finkok parece esperar que NO se incluya ImpuestoRet cuando el tipo de impuesto es obvio por la CveRetenc
            // SOLUCIÓN: Omitir ImpuestoRet para todas las claves que NO requieren complemento
            // Claves que SÍ requieren complemento (y por lo tanto SÍ deben incluir ImpuestoRet): 14, 15, 16, 18, 19, 23, 27, 28
            
            // Lista de claves que NO requieren complemento (y deben omitir ImpuestoRet)
            Set<String> clavesSinComplemento = Set.of(
                "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", // 01-13
                "17", // Remanente distribuible
                "20", "21", "22", // Otros ingresos
                "24", "25", "26"  // Enajenación de bienes, ISR Servicios profesionales, ISR Regalías
            );
            
            boolean incluirImpuestoRet = !clavesSinComplemento.contains(claveRetencion);
            
            logger.info("═══════════════════════════════════════════════════════════════");
            logger.info("🔍 VALIDACIÓN DE COMBINACIÓN PARA ISR:");
            logger.info("  CveRetenc: {}", claveRetencion);
            logger.info("  ImpuestoRet: {} (ISR)", incluirImpuestoRet ? "001 - INCLUIDO" : "OMITIDO (opcional para claves sin complemento)");
            logger.info("  TipoPagoRet: {} (Definitivo)", tipoPagoRetIsr);
            logger.info("  Razón: Para claves sin complemento (01-13, 17, 20-22, 24-26), Finkok rechaza Reten20135 si ImpuestoRet está presente");
            logger.info("═══════════════════════════════════════════════════════════════");
            
            // Construir el elemento ImpRetenidos con el orden correcto de atributos
            xml.append("    <retenciones:ImpRetenidos");
            
            // 1. BaseRet: Incluir solo si hay base válida y mayor a cero (es opcional según XSD)
            if (montoBase != null && montoBase.compareTo(BigDecimal.ZERO) > 0) {
                xml.append(" BaseRet=\"").append(formatMonto(montoBase)).append("\"");
            }
            
            // 2. ImpuestoRet: OPCIONAL según XSD
            // Para claves sin complemento (01-13, 17, 20-22, 24-26), omitir para evitar Reten20135 de Finkok
            if (incluirImpuestoRet) {
                xml.append(" ImpuestoRet=\"001\"");  // 001 = ISR
            }
            
            // 3. MontoRet: Requerido según XSD
            xml.append(" MontoRet=\"").append(formatMonto(isrRetenido)).append("\"")
            
            // 4. TipoPagoRet: Requerido según XSD
               .append(" TipoPagoRet=\"").append(tipoPagoRetIsr).append("\"/>\n");
            
            logger.info("📋 ImpRetenido ISR generado: BaseRet={}, ImpuestoRet={}, MontoRet={}, TipoPagoRet={}", 
                    montoBase != null && montoBase.compareTo(BigDecimal.ZERO) > 0 ? formatMonto(montoBase) : "omitido",
                    incluirImpuestoRet ? "001" : "omitido (opcional para claves sin complemento)",
                    formatMonto(isrRetenido), tipoPagoRetIsr);
            
            // Verificar que el XML generado es correcto
            String xmlStrIsr = xml.toString();
            if (incluirImpuestoRet && !xmlStrIsr.contains("ImpuestoRet=\"001\"")) {
                logger.error("✗✗✗ ERROR CRÍTICO: El XML generado NO contiene ImpuestoRet=\"001\" cuando debería");
                logger.error("✗✗✗ XML generado (últimos 500 caracteres): {}", 
                        xmlStrIsr.substring(Math.max(0, xmlStrIsr.length() - 500)));
            } else if (!incluirImpuestoRet && xmlStrIsr.contains("ImpuestoRet=\"001\"")) {
                logger.error("✗✗✗ ERROR CRÍTICO: El XML generado contiene ImpuestoRet=\"001\" cuando NO debería (CveRetenc={} - clave sin complemento)", claveRetencion);
            } else {
                logger.info("✓ Verificado: XML generado correctamente (ImpuestoRet {} para CveRetenc={})", 
                        incluirImpuestoRet ? "incluido" : "omitido", claveRetencion);
            }
        }
        if (ivaRetenido != null && ivaRetenido.compareTo(BigDecimal.ZERO) > 0) {
            // CRÍTICO: IVA SOLO puede usar TipoPagoRet="01" (Definitivo)
            // El IVA siempre es definitivo según las reglas del SAT
            // Si se usa otro valor, Finkok rechaza con Reten20135
            String tipoPagoRetIva = "01"; // Definitivo - ÚNICA opción válida para IVA
            
            // CRÍTICO: Para evitar Reten20135, asegurar que ImpuestoRet esté presente
            // CRÍTICO: El orden de los atributos DEBE ser: BaseRet (opcional), ImpuestoRet (requerido), MontoRet (requerido), TipoPagoRet (requerido)
            xml.append("    <retenciones:ImpRetenidos");
            
            // BaseRet: Incluir solo si hay base válida y mayor a cero (es opcional según XSD)
            if (montoBase != null && montoBase.compareTo(BigDecimal.ZERO) > 0) {
                xml.append(" BaseRet=\"").append(formatMonto(montoBase)).append("\"");
            }
            
            // CRÍTICO: ImpuestoRet SIEMPRE debe estar presente para evitar Reten20135
            // Aunque es opcional en el XSD, Finkok lo requiere para validar TipoPagoRet
            xml.append(" ImpuestoRet=\"002\"")  // 002 = IVA
               .append(" MontoRet=\"").append(formatMonto(ivaRetenido)).append("\"")
               .append(" TipoPagoRet=\"").append(tipoPagoRetIva).append("\"/>\n");
            
            logger.info("📋 ImpRetenido IVA: BaseRet={}, ImpuestoRet=002, MontoRet={}, TipoPagoRet={} (solo 01 válido para IVA)", 
                    montoBase != null && montoBase.compareTo(BigDecimal.ZERO) > 0 ? formatMonto(montoBase) : "omitido", 
                    formatMonto(ivaRetenido), tipoPagoRetIva);
        }
        xml.append("  </retenciones:Totales>\n");
        
        // CRÍTICO: El complemento ya fue determinado arriba para declarar su namespace en el elemento raíz
        // Ahora solo lo incluimos en el XML si existe
        if (complementoXml != null && !complementoXml.trim().isEmpty()) {
            // Si el método construirComplementoSiEsRequerido retorna algo, significa que la clave requiere complemento
            // Todos los complementos construidos ahora tienen atributos requeridos según los XSDs
            // Incluir el complemento en el XML
            logger.info("═══════════════════════════════════════════════════════════════");
            logger.info("📋 INCLUYENDO COMPLEMENTO REQUERIDO PARA CLAVE: {}", claveRetencion);
            logger.info("📋 COMPLEMENTO GENERADO:");
            logger.info("{}", complementoXml);
            logger.info("═══════════════════════════════════════════════════════════════");
            xml.append("  <retenciones:Complemento>\n");
            xml.append(complementoXml);
            xml.append("  </retenciones:Complemento>\n");
            
            // Verificar que el complemento se incluyó en el XML
            String xmlStrVerif = xml.toString();
            if (!xmlStrVerif.contains("<retenciones:Complemento>")) {
                logger.error("✗✗✗ ERROR CRÍTICO: El nodo Complemento NO se incluyó en el XML");
            } else {
                logger.info("✓ Verificado: Nodo Complemento incluido en el XML");
                
                // Verificar que el complemento específico está presente según la clave
                if (claveRetencion.equals("14")) {
                    if (!xmlStrVerif.contains("sectorfinanciero:SectorFinanciero")) {
                        logger.error("✗✗✗ ERROR CRÍTICO: El complemento SectorFinanciero NO está presente en el XML");
                    } else {
                        logger.info("✓ Verificado: Complemento SectorFinanciero presente en el XML");
                        
                        // Extraer y mostrar la sección del complemento para verificación
                        int startIndex = xmlStrVerif.indexOf("<retenciones:Complemento>");
                        int endIndex = xmlStrVerif.indexOf("</retenciones:Complemento>", startIndex);
                        if (startIndex != -1 && endIndex != -1) {
                            String complementoSection = xmlStrVerif.substring(startIndex, endIndex + "</retenciones:Complemento>".length());
                            logger.info("═══════════════════════════════════════════════════════════════");
                            logger.info("📋 SECCIÓN COMPLEMENTO EN XML (antes de firmar):");
                            logger.info("{}", complementoSection);
                            logger.info("═══════════════════════════════════════════════════════════════");
                        }
                    }
                }
            }
        } else {
            // La clave NO requiere complemento, NO incluir el nodo Complemento
            logger.info("✓ Clave {} no requiere complemento, omitiendo nodo Complemento", claveRetencion);
            
            // ADVERTENCIA ESPECIAL para claves que requieren complementos
            try {
                int claveInt = Integer.parseInt(claveRetencion);
                if (claveInt == 14) {
                    logger.error("✗✗✗ ERROR CRÍTICO: Clave 14 (IVA) REQUIERE complemento SectorFinanciero");
                    logger.error("✗✗✗ El complemento NO se generó. Esto causará Reten20107 en Finkok");
                }
            } catch (NumberFormatException e) {
                // Ignorar si no es numérica
            }
            
            // ADVERTENCIA ESPECIAL para claves que requieren complementos
            try {
                int claveInt = Integer.parseInt(claveRetencion);
                if (claveInt == 25) {
                    logger.warn("⚠️ ADVERTENCIA: Clave {} (ISR Servicios Profesionales). Finkok puede rechazar con Reten20107.", 
                            claveRetencion);
                    logger.warn("⚠️ Si Finkok rechaza, verificar:");
                    logger.warn("   1. Que DescRetenc coincida con el tipo de retención");
                    logger.warn("   2. Que se requiera el complemento PlataformasTecnologicas10");
                    logger.warn("   3. Consultar documentación de Finkok para esta clave");
                } else if (claveInt == 27) {
                    logger.warn("⚠️ ADVERTENCIA: Clave {} (Servicios mediante plataformas tecnológicas).", 
                            claveRetencion);
                    logger.warn("⚠️ Esta clave REQUIERE el complemento PlataformasTecnologicas10.");
                    logger.warn("⚠️ NO usar esta clave para 'ISR - Sueldos y salarios' (usar clave 01)");
                }
            } catch (NumberFormatException e) {
                // Ignorar si no es numérica
            }
        }
        
        xml.append("</retenciones:Retenciones>");
        
        String xmlFinal = xml.toString();
        
        // LOGGING CRÍTICO: Verificar que el complemento esté presente para clave 14
        if (claveRetencion.equals("14")) {
            logger.info("═══════════════════════════════════════════════════════════════");
            logger.info("🔍 VERIFICACIÓN CRÍTICA PARA CLAVE 14 (IVA):");
            logger.info("═══════════════════════════════════════════════════════════════");
            boolean tieneComplemento = xmlFinal.contains("<retenciones:Complemento>");
            boolean tieneSectorFinanciero = xmlFinal.contains("sectorfinanciero:SectorFinanciero");
            boolean tieneNamespace = xmlFinal.contains("xmlns:sectorfinanciero=");
            boolean tieneSchemaLocation = xmlFinal.contains("sectorfinanciero.xsd");
            
            logger.info("  ¿Tiene nodo <retenciones:Complemento>? {}", tieneComplemento);
            logger.info("  ¿Tiene sectorfinanciero:SectorFinanciero? {}", tieneSectorFinanciero);
            logger.info("  ¿Tiene namespace xmlns:sectorfinanciero? {}", tieneNamespace);
            logger.info("  ¿Tiene schemaLocation sectorfinanciero.xsd? {}", tieneSchemaLocation);
            
            if (!tieneComplemento || !tieneSectorFinanciero || !tieneNamespace || !tieneSchemaLocation) {
                logger.error("✗✗✗ ERROR CRÍTICO: El complemento SectorFinanciero NO está completo en el XML");
                logger.error("✗✗✗ Esto causará Reten20107 en Finkok");
                
                // Mostrar sección relevante del XML
                int startIndex = Math.max(0, xmlFinal.indexOf("<retenciones:Retenciones"));
                int endIndex = Math.min(xmlFinal.length(), startIndex + 500);
                logger.error("✗✗✗ Inicio del XML (primeros 500 caracteres):");
                logger.error("{}", xmlFinal.substring(startIndex, endIndex));
            } else {
                logger.info("✓✓✓ Verificación exitosa: El complemento SectorFinanciero está completo");
            }
            logger.info("═══════════════════════════════════════════════════════════════");
        }
        
        logger.info("═══════════════════════════════════════════════════════════════");
        logger.info("📋 XML DE RETENCIÓN GENERADO");
        logger.info("  RFC Emisor: {}", rfcEmisor);
        logger.info("  Clave Retención: {}", claveRetencion);
        logger.info("  Tamaño XML: {} caracteres", xmlFinal.length());
        logger.info("═══════════════════════════════════════════════════════════════");
        
        return xmlFinal;
    }

    // Método deprecado - ahora usamos directamente el XML timbrado del PAC
    // Se mantiene por compatibilidad pero ya no se usa
    @Deprecated
    private String actualizarXmlConDatosPac(String xmlOriginal, PacTimbradoResponse pacResp,
                                           String uuid, LocalDateTime fechaTimbrado) {
        // El XML ya viene timbrado del PAC con todos los datos necesarios
        if (pacResp != null && pacResp.getXmlTimbrado() != null && !pacResp.getXmlTimbrado().isBlank()) {
            return pacResp.getXmlTimbrado();
        }
        return xmlOriginal;
    }

    private String formatMonto(BigDecimal monto) {
        return monto != null ? monto.setScale(2, RoundingMode.HALF_UP).toPlainString() : "0.00";
    }
    
    /**
     * Formatea un monto con hasta 6 decimales (para complementos que requieren t_Importe)
     */
    private String formatMonto6Decimales(BigDecimal monto) {
        return monto != null ? monto.setScale(6, RoundingMode.HALF_UP).toPlainString() : "0.000000";
    }
    
    /**
     * Obtiene el nombre del mes en español a partir del número de mes (01-12)
     */
    private String obtenerNombreMes(String mes) {
        if (mes == null || mes.trim().isEmpty()) {
            return mes;
        }
        try {
            int mesInt = Integer.parseInt(mes.trim());
            String[] meses = {
                "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
            };
            if (mesInt >= 1 && mesInt <= 12) {
                return meses[mesInt];
            }
        } catch (NumberFormatException e) {
            // Si no es un número válido, devolver el valor original
        }
        return mes;
    }

    public RetencionResponse enviarRetencionPorCorreo(com.cibercom.facturacion_back.dto.RetencionEnvioRequest request) {
        RetencionResponse response = new RetencionResponse();
        List<String> errores = new ArrayList<>();
        response.setErrors(errores);

        if (request == null) {
            errores.add("Solicitud vacía.");
            response.setSuccess(false);
            response.setMessage("Solicitud inválida.");
            return response;
        }

        String uuidRetencion = safeTrim(request.getUuidRetencion());
        if (uuidRetencion == null) {
            errores.add("El UUID de la retención es obligatorio.");
            response.setSuccess(false);
            response.setMessage("UUID de retención inválido.");
            return response;
        }

        String correo = safeTrim(request.getCorreoReceptor());
        if (correo == null || !correo.contains("@")) {
            errores.add("El correo receptor es obligatorio y debe tener un formato válido.");
            response.setSuccess(false);
            response.setMessage("Correo del receptor inválido.");
            return response;
        }

        try {
            // Obtener configuración de logo y color para el PDF
            Map<String, Object> logoConfig = obtenerLogoConfig();

            // Obtener PDF usando FacturaService (que ya maneja diferentes tipos de facturas)
            byte[] pdfBytes = facturaService.obtenerPdfComoBytes(uuidRetencion, logoConfig);
            
            if (pdfBytes == null || pdfBytes.length < 100) {
                errores.add("No se pudo generar el PDF de la retención.");
                response.setSuccess(false);
                response.setMessage("Error al generar PDF.");
                return response;
            }
            
            // Obtener XML de la retención desde la base de datos
            byte[] xmlBytes = null;
            String nombreXml = "Retencion-" + uuidRetencion + ".xml";
            try {
                Optional<UuidFacturaOracleDAO.Result> optRetencion = uuidFacturaOracleDAO.obtenerBasicosPorUuid(uuidRetencion);
                if (optRetencion.isPresent() && optRetencion.get().xmlContent != null && !optRetencion.get().xmlContent.trim().isEmpty()) {
                    xmlBytes = optRetencion.get().xmlContent.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    logger.info("XML de la retención obtenido desde BD. Tamaño: {} bytes", xmlBytes.length);
                } else {
                    logger.warn("No se encontró XML de la retención {} en la base de datos", uuidRetencion);
                }
            } catch (Exception e) {
                logger.error("Error al obtener XML de la retención desde BD: {}", e.getMessage(), e);
            }
            
            String asunto = "CFDI de Retención de Pagos - " + uuidRetencion;
            
            // Mensaje principal simple, igual que los otros tipos de factura
            String mensajePrincipal = "Se ha generado su comprobante fiscal digital de Retención de Pagos.";
            
            // Preparar templateVars con datos de la factura
            Map<String, String> templateVars = new HashMap<>();
            templateVars.put("serie", defaultString(request.getSerieRetencion(), ""));
            templateVars.put("folio", defaultString(request.getFolioRetencion(), ""));
            templateVars.put("uuid", uuidRetencion != null ? uuidRetencion : "");
            templateVars.put("rfcEmisor", defaultString(request.getRfcEmisor(), ""));
            templateVars.put("rfcReceptor", defaultString(request.getRfcReceptor(), ""));
            
            // Enviar correo con PDF y XML como adjuntos
            if (xmlBytes != null && xmlBytes.length > 0) {
                correoService.enviarCorreoConAdjuntosDirecto(
                    correo,
                    asunto,
                    mensajePrincipal,
                    templateVars,
                    pdfBytes,
                    "Retencion-" + uuidRetencion + ".pdf",
                    xmlBytes,
                    nombreXml
                );
                logger.info("Correo enviado con PDF y XML adjuntos");
            } else {
                // Si no hay XML, enviar solo PDF
                correoService.enviarCorreoConPdfDirecto(correo, asunto, mensajePrincipal, templateVars, pdfBytes, "Retencion-" + uuidRetencion + ".pdf");
                logger.warn("Correo enviado solo con PDF (XML no disponible)");
            }

            response.setSuccess(true);
            response.setMessage("Retención enviada por correo correctamente.");
            response.setUuidRetencion(uuidRetencion);
            response.setCorreoReceptor(correo);
            response.setRfcReceptor(defaultString(request.getRfcReceptor(), "XAXX010101000"));
            response.setRfcEmisor(defaultString(request.getRfcEmisor(), "AAA010101AAA"));
        } catch (Exception e) {
            logger.error("Error al enviar retención por correo", e);
            errores.add(e.getMessage());
            response.setSuccess(false);
            response.setMessage("Error al enviar retención por correo: " + e.getMessage());
        }

        return response;
    }

    private Map<String, Object> obtenerLogoConfig() {
        return logoBrandingService.buildPdfLogoConfig(null);
    }

    private String obtenerDescripcionTipoRetencion(String tipoRetencion) {
        if (tipoRetencion == null || tipoRetencion.isBlank()) {
            return "N/A";
        }
        
        Map<String, String> descripciones = new HashMap<>();
        descripciones.put("ISR_SERVICIOS", "ISR - Servicios profesionales (honorarios)");
        descripciones.put("ISR_ARRENDAMIENTO", "ISR - Arrendamiento");
        descripciones.put("ISR_ENAJENACION", "ISR - Enajenación de bienes");
        descripciones.put("ISR_REGALIAS", "ISR - Regalías");
        descripciones.put("ISR_SUELDOS", "ISR - Sueldos y salarios");
        descripciones.put("IVA", "IVA - Retención de IVA");
        descripciones.put("DIVIDENDOS", "Pagos - Dividendos o utilidades distribuidas");
        descripciones.put("INTERESES", "Pagos - Intereses");
        descripciones.put("FIDEICOMISOS", "Pagos - Fideicomisos");
        descripciones.put("REMANENTE", "Pagos - Remanente distribuible");
        descripciones.put("PLANES_RETIRO", "Pagos - Planes de retiro");
        descripciones.put("ENAJENACION_ACCIONES", "Pagos - Enajenación de acciones");
        descripciones.put("OTROS", "Otros ingresos regulados");
        
        return descripciones.getOrDefault(tipoRetencion.trim(), tipoRetencion);
    }

    /**
     * Mapeo de tipos de retención a claves válidas del catálogo SAT (c_CveRetenc)
     * Según catRetenciones.xsd.xml, las claves válidas son del 01 al 28
     * IMPORTANTE: Algunas claves requieren complementos específicos en el XML
     */
    private static Map<String, String> crearMapaClavesRetencion() {
        Map<String, String> mapa = new HashMap<>();
        // ISR - Servicios profesionales (honorarios) - Clave 08 (NO requiere complemento, funciona como la 09)
        // NOTA: Cambiado de 25 a 08 para evitar problemas con complementos
        // La clave 25 puede requerir complemento PlataformasTecnologicas10 en algunos casos
        mapa.put("ISR_SERVICIOS", "08");
        // ISR - Arrendamiento - Clave 23 (puede requerir complemento arrendamientoenfideicomiso)
        mapa.put("ISR_ARRENDAMIENTO", "23");
        // ISR - Enajenación de bienes - Clave 24 (puede requerir complemento enajenaciondeacciones)
        mapa.put("ISR_ENAJENACION", "24");
        // ISR - Regalías - Clave 26
        mapa.put("ISR_REGALIAS", "26");
        // ISR - Sueldos y salarios - Clave 09 (NO usar 27, que es para "Servicios mediante plataformas tecnológicas" y requiere complemento)
        // CRÍTICO: La clave 01 es para "Pagos a residentes en el extranjero", NO para sueldos y salarios
        mapa.put("ISR_SUELDOS", "09");
        // IVA - Retención de IVA - Clave 14
        mapa.put("IVA", "14");
        // Dividendos o utilidades distribuidas - Clave 28 (requiere complemento dividendos)
        mapa.put("DIVIDENDOS", "28");
        // Intereses - Clave 15 (puede requerir complemento intereses)
        mapa.put("INTERESES", "15");
        // Fideicomisos - Clave 16 (puede requerir complemento fideicomisonoempresarial)
        mapa.put("FIDEICOMISOS", "16");
        // Remanente distribuible - Clave 17
        mapa.put("REMANENTE", "17");
        // Planes de retiro - Clave 18 (requiere complemento planesderetiro11)
        mapa.put("PLANES_RETIRO", "18");
        // Enajenación de acciones - Clave 19 (requiere complemento enajenaciondeacciones)
        mapa.put("ENAJENACION_ACCIONES", "19");
        // Otros ingresos - Clave 25 (por defecto)
        mapa.put("OTROS", "25");
        return mapa;
    }

    /**
     * Determina si una clave de retención requiere un complemento específico
     * y construye el XML del complemento si es necesario
     * 
     * @param claveRetencion Clave de retención (01-28)
     * @param montoBase Monto base de la retención
     * @param montoRetenido Monto total retenido
     * @param fechaPago Fecha de pago
     * @return XML del complemento si es requerido, null si no se requiere
     */
    private String construirComplementoSiEsRequerido(String claveRetencion, BigDecimal montoBase, 
                                                       BigDecimal montoRetenido, LocalDate fechaPago) {
        if (claveRetencion == null || claveRetencion.trim().isEmpty()) {
            return null;
        }
        
        try {
            int claveInt = Integer.parseInt(claveRetencion);
            
            // Claves que REQUIEREN complemento obligatorio
            switch (claveInt) {
                case 18: // Planes de retiro
                    return construirComplementoPlanesRetiro(montoBase, montoRetenido, fechaPago);
                    
                case 19: // Enajenación de acciones
                    return construirComplementoEnajenacionAcciones(montoBase, montoRetenido, fechaPago);
                    
                case 28: // Dividendos o utilidades distribuidas
                    return construirComplementoDividendos(montoBase, montoRetenido, fechaPago);
                    
                case 23: // Arrendamiento (requiere complemento arrendamientoenfideicomiso)
                    return construirComplementoArrendamiento(montoBase, montoRetenido, fechaPago);
                    
                case 15: // Intereses (requiere complemento intereses)
                    return construirComplementoIntereses(montoBase, montoRetenido, fechaPago);
                    
                case 16: // Fideicomisos (requiere complemento fideicomisonoempresarial)
                    return construirComplementoFideicomiso(montoBase, montoRetenido, fechaPago);
                    
                case 14: // IVA - Retención de IVA
                    // PROBLEMA IDENTIFICADO:
                    // Finkok está rechazando con Reten20107 aunque el complemento SectorFinanciero esté presente.
                    // 
                    // ANÁLISIS:
                    // 1. El complemento SectorFinanciero es "para uso exclusivo de entidades fiduciarias"
                    // 2. El XML generado tiene el complemento correctamente formado
                    // 3. El namespace y schemaLocation están correctos
                    // 4. Todos los atributos requeridos están presentes
                    // 5. La cadena original incluye el complemento correctamente
                    // 
                    // PERO: Finkok sigue rechazando con Reten20107
                    // 
                    // CONCLUSIÓN PROBABLE:
                    // Finkok puede estar validando que el emisor sea realmente una entidad fiduciaria,
                    // o puede haber un problema con cómo Finkok está detectando el complemento en el XML firmado.
                    // 
                    // SOLUCIÓN: Mantener el complemento pero agregar logging adicional para diagnóstico.
                    logger.info("📋 Clave 14 detectada - Construyendo complemento SectorFinanciero");
                    logger.warn("⚠️ NOTA: El complemento SectorFinanciero es técnicamente solo para entidades fiduciarias");
                    logger.warn("⚠️ Si Finkok rechaza con Reten20107, puede ser que:");
                    logger.warn("   1. Finkok valide que el emisor sea realmente fiduciaria");
                    logger.warn("   2. Haya un problema con la detección del complemento en el XML firmado");
                    logger.warn("   3. Finkok tenga una validación incorrecta");
                    // Construir el complemento SectorFinanciero
                    return construirComplementoSectorFinanciero(montoBase, montoRetenido, fechaPago);
                    
                case 25: // ISR - Servicios profesionales (honorarios) / Otro tipo de retenciones
                    // NOTA CRÍTICA: Según documentación del SAT, la clave 25 puede requerir 
                    // el complemento PlataformasTecnologicas10 si se trata de servicios mediante plataformas tecnológicas.
                    // Sin embargo, para ISR servicios profesionales tradicionales, NO se requiere complemento.
                    // Finkok puede rechazar con Reten20107 si espera un complemento.
                    // Si el error persiste, considerar usar otra clave o agregar el complemento PlataformasTecnologicas10.
                    logger.warn("⚠️ Clave 25 (ISR Servicios Profesionales) - Verificar si requiere complemento PlataformasTecnologicas10");
                    logger.warn("⚠️ Si Finkok rechaza con Reten20107, puede ser necesario agregar el complemento PlataformasTecnologicas10");
                    // Por ahora no construimos el complemento, pero si Finkok lo requiere, descomentar la siguiente línea:
                    // return construirComplementoPlataformasTecnologicas(montoBase, montoRetenido, fechaPago);
                    return null;
                    
                case 27: // Servicios mediante plataformas tecnológicas (NO para ISR Sueldos)
                    // NOTA CRÍTICA: Según documentación del SAT, la clave 27 es EXCLUSIVAMENTE para 
                    // "Servicios mediante plataformas tecnológicas" y REQUIERE el complemento PlataformasTecnologicas10.
                    // Para "ISR - Sueldos y salarios" se debe usar la clave 01 (que NO requiere complemento).
                    // Finkok rechaza con Reten20107 si se usa la clave 27 sin el complemento correcto.
                    logger.info("📋 Clave 27 detectada - Construyendo complemento PlataformasTecnologicas10 (requerido)");
                    logger.info("⚠️ NOTA: La clave 27 es SOLO para 'Servicios mediante plataformas tecnológicas'");
                    logger.info("⚠️ Para 'ISR - Sueldos y salarios' usar clave 01 (no requiere complemento)");
                    // Construir el complemento PlataformasTecnologicas10 (obligatorio para clave 27)
                    return construirComplementoPlataformasTecnologicas(montoBase, montoRetenido, fechaPago);
                    
                default:
                    // Claves que NO requieren complemento: 01-13, 17, 20-22, 24-26
                    // Nota: Las claves 14, 15, 16, 18, 19, 23, 27 y 28 SÍ requieren complemento obligatorio
                    return null;
            }
        } catch (NumberFormatException e) {
            logger.warn("⚠️ Clave de retención no es numérica: {}", claveRetencion);
            return null;
        }
    }
    
    /**
     * Obtiene el namespace del complemento requerido para una clave de retención
     * 
     * @param claveRetencion Clave de retención (01-28)
     * @return String con el namespace xmlns:prefijo="uri" o cadena vacía si no requiere complemento
     */
    private String obtenerNamespaceComplemento(String claveRetencion) {
        if (claveRetencion == null || claveRetencion.trim().isEmpty()) {
            return "";
        }
        
        try {
            int claveInt = Integer.parseInt(claveRetencion);
            
            switch (claveInt) {
                case 14: // IVA - Sector Financiero (siempre requerido por Finkok para validación)
                    return "xmlns:sectorfinanciero=\"http://www.sat.gob.mx/esquemas/retencionpago/1/sectorfinanciero\"";
                case 15: // Intereses
                    return "xmlns:intereses=\"http://www.sat.gob.mx/esquemas/retencionpago/1/intereses\"";
                case 16: // Fideicomisos
                    return "xmlns:fideicomisonoempresarial=\"http://www.sat.gob.mx/esquemas/retencionpago/1/fideicomisonoempresarial\"";
                case 18: // Planes de retiro
                    return "xmlns:planesderetiro11=\"http://www.sat.gob.mx/esquemas/retencionpago/1/planesderetiro11\"";
                case 19: // Enajenación de acciones
                    return "xmlns:enajenaciondeacciones=\"http://www.sat.gob.mx/esquemas/retencionpago/1/enajenaciondeacciones\"";
                case 23: // Arrendamiento
                    return "xmlns:arrendamientoenfideicomiso=\"http://www.sat.gob.mx/esquemas/retencionpago/1/arrendamientoenfideicomiso\"";
                case 28: // Dividendos
                    return "xmlns:dividendos=\"http://www.sat.gob.mx/esquemas/retencionpago/1/dividendos\"";
                case 25: // ISR Servicios profesionales - Puede requerir PlataformasTecnologicas10
                case 27: // Servicios mediante plataformas tecnológicas - Requiere PlataformasTecnologicas10 (NO para ISR Sueldos)
                    return "xmlns:plataformasTecnologicas=\"http://www.sat.gob.mx/esquemas/retencionpago/1/PlataformasTecnologicas10\"";
                default:
                    return ""; // No requiere complemento
            }
        } catch (NumberFormatException e) {
            return "";
        }
    }
    
    /**
     * Obtiene el schemaLocation del complemento requerido para una clave de retención
     * 
     * @param claveRetencion Clave de retención (01-28)
     * @return String con el schemaLocation "namespace uri" o cadena vacía si no requiere complemento
     */
    private String obtenerSchemaLocationComplemento(String claveRetencion) {
        if (claveRetencion == null || claveRetencion.trim().isEmpty()) {
            return "";
        }
        
        try {
            int claveInt = Integer.parseInt(claveRetencion);
            
            switch (claveInt) {
                case 14: // IVA - Sector Financiero (siempre requerido por Finkok para validación)
                    return "http://www.sat.gob.mx/esquemas/retencionpago/1/sectorfinanciero http://www.sat.gob.mx/esquemas/retencionpago/1/sectorfinanciero/sectorfinanciero.xsd";
                case 15: // Intereses
                    return "http://www.sat.gob.mx/esquemas/retencionpago/1/intereses http://www.sat.gob.mx/esquemas/retencionpago/1/intereses/intereses.xsd";
                case 16: // Fideicomisos
                    return "http://www.sat.gob.mx/esquemas/retencionpago/1/fideicomisonoempresarial http://www.sat.gob.mx/esquemas/retencionpago/1/fideicomisonoempresarial/fideicomisonoempresarial.xsd";
                case 18: // Planes de retiro
                    return "http://www.sat.gob.mx/esquemas/retencionpago/1/planesderetiro11 http://www.sat.gob.mx/esquemas/retencionpago/1/planesderetiro11/Planesderetiro11.xsd";
                case 19: // Enajenación de acciones
                    return "http://www.sat.gob.mx/esquemas/retencionpago/1/enajenaciondeacciones http://www.sat.gob.mx/esquemas/retencionpago/1/enajenaciondeacciones/enajenaciondeacciones.xsd";
                case 23: // Arrendamiento
                    return "http://www.sat.gob.mx/esquemas/retencionpago/1/arrendamientoenfideicomiso http://www.sat.gob.mx/esquemas/retencionpago/1/arrendamientoenfideicomiso/arrendamientoenfideicomiso.xsd";
                case 28: // Dividendos
                    return "http://www.sat.gob.mx/esquemas/retencionpago/1/dividendos http://www.sat.gob.mx/esquemas/retencionpago/1/dividendos/dividendos.xsd";
                case 25: // ISR Servicios profesionales - Puede requerir PlataformasTecnologicas10
                case 27: // Servicios mediante plataformas tecnológicas - Requiere PlataformasTecnologicas10 (NO para ISR Sueldos)
                    return "http://www.sat.gob.mx/esquemas/retencionpago/1/PlataformasTecnologicas10 http://www.sat.gob.mx/esquemas/retencionpago/1/PlataformasTecnologicas10/ServiciosPlataformasTecnologicas10.xsd";
                default:
                    return ""; // No requiere complemento
            }
        } catch (NumberFormatException e) {
            return "";
        }
    }
    
    /**
     * Construye el complemento de Planes de Retiro (clave 18)
     * Namespace: http://www.sat.gob.mx/esquemas/retencionpago/1/planesderetiro11
     * Requiere: SistemaFinanc, y al menos un AportacionesODepositos con TipoAportacionODeposito y MontAportODep
     */
    private String construirComplementoPlanesRetiro(BigDecimal montoBase, BigDecimal montoRetenido, LocalDate fechaPago) {
        logger.info("📋 Construyendo complemento de Planes de Retiro (clave 18)");
        
        BigDecimal montAportODep = montoBase != null ? montoBase : BigDecimal.ZERO;
        
        StringBuilder complemento = new StringBuilder();
        // El namespace ya está declarado en el elemento raíz Retenciones
        complemento.append("      <planesderetiro11:Planesderetiro ")
                   .append("Version=\"1.1\" ")
                   .append("SistemaFinanc=\"SI\">\n");
        complemento.append("        <planesderetiro11:AportacionesODepositos ")
                   .append("TipoAportacionODeposito=\"01\" ")
                   .append("MontAportODep=\"").append(formatMonto6Decimales(montAportODep)).append("\"/>\n");
        complemento.append("      </planesderetiro11:Planesderetiro>\n");
        return complemento.toString();
    }
    
    /**
     * Construye el complemento de Enajenación de Acciones (clave 19)
     * Namespace: http://www.sat.gob.mx/esquemas/retencionpago/1/enajenaciondeacciones
     * Requiere: ContratoIntermediacion, Ganancia, Perdida
     */
    private String construirComplementoEnajenacionAcciones(BigDecimal montoBase, BigDecimal montoRetenido, LocalDate fechaPago) {
        logger.info("📋 Construyendo complemento de Enajenación de Acciones (clave 19)");
        
        String contratoIntermediacion = "Contrato de intermediación para enajenación de acciones";
        BigDecimal ganancia = montoBase != null && montoBase.compareTo(BigDecimal.ZERO) > 0 ? montoBase : BigDecimal.ZERO;
        BigDecimal perdida = BigDecimal.ZERO; // Por defecto sin pérdida
        
        StringBuilder complemento = new StringBuilder();
        // El namespace ya está declarado en el elemento raíz Retenciones
        complemento.append("      <enajenaciondeacciones:EnajenaciondeAcciones ")
                   .append("Version=\"1.0\" ")
                   .append("ContratoIntermediacion=\"").append(escapeXml(contratoIntermediacion)).append("\" ")
                   .append("Ganancia=\"").append(formatMonto6Decimales(ganancia)).append("\" ")
                   .append("Perdida=\"").append(formatMonto6Decimales(perdida)).append("\"/>\n");
        return complemento.toString();
    }
    
    /**
     * Construye el complemento de Dividendos (clave 28)
     * Namespace: http://www.sat.gob.mx/esquemas/retencionpago/1/dividendos
     * El complemento tiene elementos opcionales, pero si se incluye DividOUtil requiere varios atributos
     */
    private String construirComplementoDividendos(BigDecimal montoBase, BigDecimal montoRetenido, LocalDate fechaPago) {
        logger.info("📋 Construyendo complemento de Dividendos (clave 28)");
        
        // El complemento de dividendos puede estar vacío o tener elementos opcionales
        // Incluimos el nodo DividOUtil con valores mínimos requeridos
        BigDecimal montISRAcredRetMexico = montoRetenido != null ? montoRetenido : BigDecimal.ZERO;
        BigDecimal montISRAcredRetExtranjero = BigDecimal.ZERO;
        
        StringBuilder complemento = new StringBuilder();
        // El namespace ya está declarado en el elemento raíz Retenciones
        complemento.append("      <dividendos:Dividendos ")
                   .append("Version=\"1.0\">\n");
        complemento.append("        <dividendos:DividOUtil ")
                   .append("CveTipDivOUtil=\"01\" ")
                   .append("MontISRAcredRetMexico=\"").append(formatMonto6Decimales(montISRAcredRetMexico)).append("\" ")
                   .append("MontISRAcredRetExtranjero=\"").append(formatMonto6Decimales(montISRAcredRetExtranjero)).append("\" ")
                   .append("TipoSocDistrDiv=\"Sociedad Nacional\"/>\n");
        complemento.append("      </dividendos:Dividendos>\n");
        return complemento.toString();
    }
    
    /**
     * Construye el complemento de Intereses (clave 15)
     * Namespace: http://www.sat.gob.mx/esquemas/retencionpago/1/intereses
     * Requiere: SistFinanciero, RetiroAORESRetInt, OperFinancDerivad, MontIntNominal, MontIntReal, Perdida
     */
    private String construirComplementoIntereses(BigDecimal montoBase, BigDecimal montoRetenido, LocalDate fechaPago) {
        logger.info("📋 Construyendo complemento de Intereses (clave 15)");
        
        // Valores por defecto: usar el monto base como interés nominal, calcular real y pérdida
        BigDecimal montIntNominal = montoBase != null ? montoBase : BigDecimal.ZERO;
        BigDecimal montIntReal = montIntNominal.multiply(new BigDecimal("0.95")); // Aproximación del 95%
        BigDecimal perdida = BigDecimal.ZERO; // Por defecto sin pérdida
        
        StringBuilder complemento = new StringBuilder();
        // El namespace ya está declarado en el elemento raíz Retenciones
        complemento.append("      <intereses:Intereses ")
                   .append("Version=\"1.0\" ")
                   .append("SistFinanciero=\"SI\" ")
                   .append("RetiroAORESRetInt=\"SI\" ")
                   .append("OperFinancDerivad=\"NO\" ")
                   .append("MontIntNominal=\"").append(formatMonto6Decimales(montIntNominal)).append("\" ")
                   .append("MontIntReal=\"").append(formatMonto6Decimales(montIntReal)).append("\" ")
                   .append("Perdida=\"").append(formatMonto6Decimales(perdida)).append("\"/>\n");
        return complemento.toString();
    }
    
    /**
     * Construye el complemento de Fideicomisos (clave 16)
     * Namespace: http://www.sat.gob.mx/esquemas/retencionpago/1/fideicomisonoempresarial
     * Requiere: IngresosOEntradas, DeduccOSalidas, RetEfectFideicomiso con múltiples atributos
     */
    private String construirComplementoFideicomiso(BigDecimal montoBase, BigDecimal montoRetenido, LocalDate fechaPago) {
        logger.info("📋 Construyendo complemento de Fideicomisos (clave 16)");
        
        // Valores basados en el monto base y retenido
        BigDecimal montTotEntradasPeriodo = montoBase != null ? montoBase : BigDecimal.ZERO;
        BigDecimal partPropAcumDelFideicom = montTotEntradasPeriodo;
        BigDecimal propDelMontTot = new BigDecimal("1.000000"); // 100% de participación
        
        BigDecimal montTotEgresPeriodo = BigDecimal.ZERO;
        BigDecimal partPropDelFideicom = BigDecimal.ZERO;
        BigDecimal propDelMontTotEgres = new BigDecimal("1.000000");
        
        BigDecimal montRetRelPagFideic = montoRetenido != null ? montoRetenido : BigDecimal.ZERO;
        String descRetRelPagFideic = "Retención efectuada al fideicomiso";
        
        StringBuilder complemento = new StringBuilder();
        // El namespace ya está declarado en el elemento raíz Retenciones
        complemento.append("      <fideicomisonoempresarial:Fideicomisonoempresarial ")
                   .append("Version=\"1.0\">\n");
        complemento.append("        <fideicomisonoempresarial:IngresosOEntradas ")
                   .append("MontTotEntradasPeriodo=\"").append(formatMonto6Decimales(montTotEntradasPeriodo)).append("\" ")
                   .append("PartPropAcumDelFideicom=\"").append(formatMonto6Decimales(partPropAcumDelFideicom)).append("\" ")
                   .append("PropDelMontTot=\"").append(formatMonto6Decimales(propDelMontTot)).append("\">\n");
        complemento.append("          <fideicomisonoempresarial:IntegracIngresos ")
                   .append("Concepto=\"Ingresos del fideicomiso\"/>\n");
        complemento.append("        </fideicomisonoempresarial:IngresosOEntradas>\n");
        complemento.append("        <fideicomisonoempresarial:DeduccOSalidas ")
                   .append("MontTotEgresPeriodo=\"").append(formatMonto6Decimales(montTotEgresPeriodo)).append("\" ")
                   .append("PartPropDelFideicom=\"").append(formatMonto6Decimales(partPropDelFideicom)).append("\" ")
                   .append("PropDelMontTot=\"").append(formatMonto6Decimales(propDelMontTotEgres)).append("\">\n");
        complemento.append("          <fideicomisonoempresarial:IntegracEgresos ")
                   .append("ConceptoS=\"Egresos del fideicomiso\"/>\n");
        complemento.append("        </fideicomisonoempresarial:DeduccOSalidas>\n");
        complemento.append("        <fideicomisonoempresarial:RetEfectFideicomiso ")
                   .append("MontRetRelPagFideic=\"").append(formatMonto6Decimales(montRetRelPagFideic)).append("\" ")
                   .append("DescRetRelPagFideic=\"").append(escapeXml(descRetRelPagFideic)).append("\"/>\n");
        complemento.append("      </fideicomisonoempresarial:Fideicomisonoempresarial>\n");
        return complemento.toString();
    }
    
    /**
     * Construye el complemento de Arrendamiento (clave 23)
     * Namespace: http://www.sat.gob.mx/esquemas/retencionpago/1/arrendamientoenfideicomiso
     * Requiere: PagProvEfecPorFiduc, RendimFideicom, DeduccCorresp
     */
    private String construirComplementoArrendamiento(BigDecimal montoBase, BigDecimal montoRetenido, LocalDate fechaPago) {
        logger.info("📋 Construyendo complemento de Arrendamiento (clave 23)");
        
        // Valores basados en el monto base y retenido
        BigDecimal pagProvEfecPorFiduc = montoBase != null ? montoBase : BigDecimal.ZERO;
        BigDecimal rendimFideicom = montoBase != null ? montoBase : BigDecimal.ZERO;
        BigDecimal deduccCorresp = BigDecimal.ZERO; // Sin deducciones por defecto
        
        StringBuilder complemento = new StringBuilder();
        // El namespace ya está declarado en el elemento raíz Retenciones
        complemento.append("      <arrendamientoenfideicomiso:Arrendamientoenfideicomiso ")
                   .append("Version=\"1.0\" ")
                   .append("PagProvEfecPorFiduc=\"").append(formatMonto6Decimales(pagProvEfecPorFiduc)).append("\" ")
                   .append("RendimFideicom=\"").append(formatMonto6Decimales(rendimFideicom)).append("\" ")
                   .append("DeduccCorresp=\"").append(formatMonto6Decimales(deduccCorresp)).append("\"/>\n");
        return complemento.toString();
    }
    
    /**
     * Construye el complemento de Sector Financiero (clave 14 - IVA)
     * Namespace: http://www.sat.gob.mx/esquemas/retencionpago/1/sectorfinanciero
     * Requiere: IdFideicom, DescripFideicom (NomFideicom es opcional)
     */
    private String construirComplementoSectorFinanciero(BigDecimal montoBase, BigDecimal montoRetenido, LocalDate fechaPago) {
        logger.info("📋 Construyendo complemento de Sector Financiero (clave 14 - IVA)");
        
        // Valores por defecto basados en el monto de la retención
        // IdFideicom: Identificador del fideicomiso (requerido, máximo 20 caracteres)
        String idFideicom = "FID-" + (montoRetenido != null ? montoRetenido.toPlainString().replace(".", "") : "000000");
        if (idFideicom.length() > 20) {
            idFideicom = idFideicom.substring(0, 20);
        }
        
        // NomFideicom: Nombre del fideicomiso (opcional, máximo 100 caracteres)
        // Aunque es opcional, Finkok puede requerirlo para validación
        String nomFideicom = "Fideicomiso IVA " + (montoRetenido != null ? formatMonto(montoRetenido) : "000000");
        if (nomFideicom.length() > 100) {
            nomFideicom = nomFideicom.substring(0, 100);
        }
        
        // DescripFideicom: Descripción del fideicomiso (requerido, máximo 300 caracteres)
        String descripFideicom = "Fideicomiso relacionado con retención de IVA por monto de " + formatMonto(montoRetenido);
        if (descripFideicom.length() > 300) {
            descripFideicom = descripFideicom.substring(0, 300);
        }
        
        logger.info("  IdFideicom: {}", idFideicom);
        logger.info("  NomFideicom: {}", nomFideicom);
        logger.info("  DescripFideicom: {}", descripFideicom);
        
        StringBuilder complemento = new StringBuilder();
        // El namespace ya está declarado en el elemento raíz Retenciones
        // CRÍTICO: El orden de los atributos DEBE coincidir con el orden del XSLT para generar la cadena original correctamente
        // Orden según XSLT (sectorfinanciero.xslt): Version, IdFideicom, NomFideicom (opcional), DescripFideicom
        // Incluimos NomFideicom aunque sea opcional para cumplir con validaciones estrictas de Finkok
        complemento.append("      <sectorfinanciero:SectorFinanciero ")
                   .append("Version=\"1.0\" ")
                   .append("IdFideicom=\"").append(escapeXml(idFideicom)).append("\" ")
                   .append("NomFideicom=\"").append(escapeXml(nomFideicom)).append("\" ")
                   .append("DescripFideicom=\"").append(escapeXml(descripFideicom)).append("\"/>\n");
        
        String complementoStr = complemento.toString();
        logger.info("📋 Complemento SectorFinanciero generado:");
        logger.info("{}", complementoStr);
        
        return complementoStr;
    }

    /**
     * Construye el complemento de Plataformas Tecnológicas (clave 25 y 27)
     * Namespace: http://www.sat.gob.mx/esquemas/retencionpago/1/PlataformasTecnologicas10
     * NOTA: Este complemento es requerido para la clave 27 según el SAT.
     * Estructura basada en el XSLT oficial: ServiciosPlataformasTecnologicas10.xslt
     * 
     * CRÍTICO: El orden de los atributos DEBE coincidir con el orden del XSLT para generar la cadena original correctamente
     * Orden según XSLT: Version, Periodicidad, NumServ, MonTotServSIVA, TotalIVATrasladado, 
     * TotalIVARetenido, TotalISRRetenido, DifIVAEntregadoPrestServ, MonTotalporUsoPlataforma, 
     * MonTotalContribucionGubernamental (opcional)
     */
    private String construirComplementoPlataformasTecnologicas(BigDecimal montoBase, BigDecimal montoRetenido, LocalDate fechaPago) {
        logger.info("📋 Construyendo complemento de Plataformas Tecnológicas (clave 25/27)");
        
        // Valores por defecto basados en los datos disponibles
        BigDecimal monTotServSIVA = montoBase != null ? montoBase : BigDecimal.ZERO;
        BigDecimal totalIVATrasladado = BigDecimal.ZERO; // Se calcula si hay IVA
        BigDecimal totalIVARetenido = BigDecimal.ZERO; // Se calcula si hay retención de IVA
        BigDecimal totalISRRetenido = montoRetenido != null ? montoRetenido : BigDecimal.ZERO;
        BigDecimal difIVAEntregadoPrestServ = BigDecimal.ZERO; // Diferencia de IVA entregado
        BigDecimal monTotalporUsoPlataforma = BigDecimal.ZERO; // Comisión por uso de plataforma
        
        // Calcular IVA si el monto base tiene IVA (asumiendo 16%)
        if (monTotServSIVA.compareTo(BigDecimal.ZERO) > 0) {
            totalIVATrasladado = monTotServSIVA.multiply(new BigDecimal("0.16")).setScale(2, RoundingMode.HALF_UP);
        }
        
        // Periodicidad: 05 = Mensual (según catálogo c_Periodicidad)
        String periodicidad = "05";
        // Número de servicios: 1 por defecto
        String numServ = "1";
        // Fecha del servicio
        String fechaServ = fechaPago != null ? fechaPago.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) : LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        
        StringBuilder complemento = new StringBuilder();
        // El namespace ya está declarado en el elemento raíz Retenciones
        // CRÍTICO: El orden de los atributos DEBE coincidir con el orden del XSLT
        complemento.append("      <plataformasTecnologicas:ServiciosPlataformasTecnologicas ")
                   .append("Version=\"1.0\" ")
                   .append("Periodicidad=\"").append(periodicidad).append("\" ")
                   .append("NumServ=\"").append(numServ).append("\" ")
                   .append("MonTotServSIVA=\"").append(formatMonto(monTotServSIVA)).append("\" ")
                   .append("TotalIVATrasladado=\"").append(formatMonto(totalIVATrasladado)).append("\" ")
                   .append("TotalIVARetenido=\"").append(formatMonto(totalIVARetenido)).append("\" ")
                   .append("TotalISRRetenido=\"").append(formatMonto(totalISRRetenido)).append("\" ")
                   .append("DifIVAEntregadoPrestServ=\"").append(formatMonto(difIVAEntregadoPrestServ)).append("\" ")
                   .append("MonTotalporUsoPlataforma=\"").append(formatMonto(monTotalporUsoPlataforma)).append("\">\n");
        
        // Elemento Servicios con DetallesDelServicio
        // CRÍTICO: El orden de los atributos DEBE coincidir con el XSLT: FormaPagoServ, TipoDeServ, SubTipServ (opcional), 
        // RFCTerceroAutorizado (opcional), FechaServ, PrecioServSinIVA
        complemento.append("        <plataformasTecnologicas:Servicios>\n");
        complemento.append("          <plataformasTecnologicas:DetallesDelServicio ")
                   .append("FormaPagoServ=\"03\" ") // 03 = Transferencia electrónica (catálogo c_FormaPago)
                   .append("TipoDeServ=\"01\" ") // 01 = Servicio de transporte (catálogo c_TipoDeServicio)
                   // SubTipServ y RFCTerceroAutorizado son opcionales, se omiten por ahora
                   .append("FechaServ=\"").append(fechaServ).append("\" ")
                   .append("PrecioServSinIVA=\"").append(formatMonto(monTotServSIVA)).append("\">\n");
        
        // ImpuestosTrasladadosdelServicio (IVA) - Requerido según XSLT si hay IVA
        // CRÍTICO: El orden de los atributos DEBE coincidir con el XSLT: Base, Impuesto, TipoFactor, TasaCuota, Importe
        if (totalIVATrasladado.compareTo(BigDecimal.ZERO) > 0) {
            complemento.append("            <plataformasTecnologicas:ImpuestosTrasladadosdelServicio ")
                       .append("Base=\"").append(formatMonto(monTotServSIVA)).append("\" ")
                       .append("Impuesto=\"002\" ") // 002 = IVA
                       .append("TipoFactor=\"Tasa\" ") // Tasa, Cuota o Exento
                       .append("TasaCuota=\"0.160000\" ") // 16% = 0.16
                       .append("Importe=\"").append(formatMonto(totalIVATrasladado)).append("\"/>\n");
        } else {
            // Si no hay IVA trasladado, aún así puede ser necesario incluir el elemento con valores en cero
            // según el XSLT, es opcional, pero Finkok puede requerirlo
            logger.warn("⚠️ No hay IVA trasladado, omitiendo ImpuestosTrasladadosdelServicio");
        }
        
        // ComisionDelServicio - Opcional según XSLT, pero recomendado
        // CRÍTICO: El orden de los atributos DEBE coincidir con el XSLT: Base (opcional), Porcentaje (opcional), Importe (requerido)
        complemento.append("            <plataformasTecnologicas:ComisionDelServicio ");
        if (monTotalporUsoPlataforma.compareTo(BigDecimal.ZERO) > 0 && monTotServSIVA.compareTo(BigDecimal.ZERO) > 0) {
            // Calcular porcentaje si hay comisión y base
            BigDecimal porcentaje = monTotalporUsoPlataforma.divide(monTotServSIVA, 6, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
            complemento.append("Base=\"").append(formatMonto(monTotServSIVA)).append("\" ")
                       .append("Porcentaje=\"").append(formatMonto6Decimales(porcentaje)).append("\" ");
        }
        complemento.append("Importe=\"").append(formatMonto(monTotalporUsoPlataforma)).append("\"/>\n");
        
        complemento.append("          </plataformasTecnologicas:DetallesDelServicio>\n");
        complemento.append("        </plataformasTecnologicas:Servicios>\n");
        complemento.append("      </plataformasTecnologicas:ServiciosPlataformasTecnologicas>\n");
        
        logger.info("✓ Complemento PlataformasTecnologicas10 construido con estructura oficial del SAT");
        
        return complemento.toString();
    }

    /**
     * Extrae el RFC del SubjectDN del certificado
     * Método copiado de PagoService que ya funciona correctamente
     */
    private String extraerRFCDeSubjectDN(String subjectDN) {
        if (subjectDN == null || subjectDN.isEmpty()) {
            return null;
        }
        
        // Buscar RFC en formato 2.5.4.45 (RFC del SAT)
        java.util.regex.Pattern pattern1 = java.util.regex.Pattern.compile("2\\.5\\.4\\.45=#([0-9A-Fa-f]+)");
        java.util.regex.Matcher matcher1 = pattern1.matcher(subjectDN);
        if (matcher1.find()) {
            String hexRfc = matcher1.group(1);
            // Convertir de hexadecimal a ASCII
            try {
                StringBuilder rfc = new StringBuilder();
                for (int i = 0; i < hexRfc.length(); i += 2) {
                    String hex = hexRfc.substring(i, Math.min(i + 2, hexRfc.length()));
                    int charCode = Integer.parseInt(hex, 16);
                    if (charCode >= 32 && charCode <= 126) { // Caracteres imprimibles ASCII
                        rfc.append((char) charCode);
                    }
                }
                String rfcStr = rfc.toString().trim();
                // Extraer RFC (normalmente está al inicio y tiene 12-13 caracteres)
                java.util.regex.Pattern rfcPattern = java.util.regex.Pattern.compile("([A-Z&Ñ]{3,4}\\d{6}[A-Z0-9]{3})");
                java.util.regex.Matcher rfcMatcher = rfcPattern.matcher(rfcStr);
                if (rfcMatcher.find()) {
                    return rfcMatcher.group(1);
                }
                return rfcStr;
            } catch (Exception e) {
                logger.debug("Error al convertir hex a ASCII para RFC: {}", e.getMessage());
            }
        }
        
        // Buscar RFC en formato estándar (RFC=...)
        java.util.regex.Pattern pattern2 = java.util.regex.Pattern.compile("RFC=([A-Z&Ñ0-9]{12,13})", java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher matcher2 = pattern2.matcher(subjectDN);
        if (matcher2.find()) {
            return matcher2.group(1).toUpperCase();
        }
        
        // Buscar RFC en formato CN o OU (puede estar como XIA190128J61)
        java.util.regex.Pattern pattern3 = java.util.regex.Pattern.compile("([A-Z&Ñ]{3,4}\\d{6}[A-Z0-9]{3})");
        java.util.regex.Matcher matcher3 = pattern3.matcher(subjectDN);
        if (matcher3.find()) {
            return matcher3.group(1).toUpperCase();
        }
        
        return null;
    }

    /**
     * Genera un PDF de vista previa sin timbrar a partir de RetencionRequest
     */
    public byte[] generarPdfPreview(RetencionRequest request, Map<String, Object> logoConfig) {
        try {
            logger.info("Generando PDF de vista previa para retención, RFC receptor: {}", request.getRfcReceptor());

            // Obtener logoConfig si no se proporcionó
            Map<String, Object> logoConfigFinal = logoConfig;
            if (logoConfigFinal == null) {
                logoConfigFinal = obtenerLogoConfig();
            }

            // Construir datos de la retención para el PDF
            Map<String, Object> datosFactura = new HashMap<>();
            datosFactura.put("uuid", "PREVIEW-" + UUID.randomUUID().toString());
            datosFactura.put("serie", "RET");
            datosFactura.put("folio", "PREVIEW");
            datosFactura.put("fechaTimbrado", LocalDateTime.now());
            datosFactura.put("rfcEmisor", request.getRfcEmisor() != null ? request.getRfcEmisor() : rfcEmisorDefault);
            datosFactura.put("nombreEmisor", request.getNombreEmisor() != null ? request.getNombreEmisor() : nombreEmisorDefault);
            datosFactura.put("rfcReceptor", request.getRfcReceptor() != null ? request.getRfcReceptor() : "XAXX010101000");
            
            // Determinar nombre del receptor
            String nombreReceptor = "";
            if (request.getTipoPersona() != null && "moral".equals(request.getTipoPersona())) {
                nombreReceptor = request.getRazonSocial() != null ? request.getRazonSocial() : "";
            } else {
                StringBuilder nombreBuilder = new StringBuilder();
                if (request.getNombre() != null) nombreBuilder.append(request.getNombre());
                if (request.getPaterno() != null) nombreBuilder.append(" ").append(request.getPaterno());
                if (request.getMaterno() != null) nombreBuilder.append(" ").append(request.getMaterno());
                nombreReceptor = nombreBuilder.toString().trim();
            }
            datosFactura.put("nombreReceptor", nombreReceptor.isEmpty() ? datosFactura.get("rfcReceptor") : nombreReceptor);
            datosFactura.put("tipoComprobante", "R"); // R para Retención
            datosFactura.put("moneda", "MXN");
            
            // Construir conceptos con información detallada de la retención
            List<Map<String, Object>> conceptos = new ArrayList<>();
            Map<String, Object> concepto = new HashMap<>();
            BigDecimal montoBase = request.getMontoBase() != null ? request.getMontoBase() : BigDecimal.ZERO;
            BigDecimal montoTotGravado = request.getMontoTotGravado() != null ? request.getMontoTotGravado() : BigDecimal.ZERO;
            BigDecimal montoTotExento = request.getMontoTotExento() != null ? request.getMontoTotExento() : BigDecimal.ZERO;
            
            // Construir descripción detallada del concepto con toda la información de la retención
            StringBuilder descripcionBuilder = new StringBuilder();
            
            // Título principal: Tipo de retención
            String tipoRetencion = request.getTipoRetencion() != null && !request.getTipoRetencion().trim().isEmpty()
                ? request.getTipoRetencion().trim()
                : null;
            String cveRetenc = request.getCveRetenc() != null && !request.getCveRetenc().trim().isEmpty()
                ? request.getCveRetenc().trim()
                : null;
            
            if (tipoRetencion != null) {
                String descripcionTipo = obtenerDescripcionTipoRetencion(tipoRetencion);
                descripcionBuilder.append(descripcionTipo);
                if (cveRetenc != null) {
                    descripcionBuilder.append(" (Clave: ").append(cveRetenc).append(")");
                }
            } else if (cveRetenc != null) {
                descripcionBuilder.append("Retención - Clave: ").append(cveRetenc);
            } else {
                descripcionBuilder.append("Retención de Pagos");
            }
            
            // Concepto del usuario (si está disponible)
            String conceptoUsuario = request.getConcepto() != null && !request.getConcepto().trim().isEmpty() 
                ? request.getConcepto().trim() 
                : null;
            if (conceptoUsuario != null) {
                descripcionBuilder.append("\nConcepto: ").append(conceptoUsuario);
            }
            
            // Montos: Base, Gravado, Exento
            descripcionBuilder.append("\nMonto Base: $").append(formatMonto(montoBase));
            if (montoTotGravado.compareTo(BigDecimal.ZERO) > 0) {
                descripcionBuilder.append(" | Gravado: $").append(formatMonto(montoTotGravado));
            }
            if (montoTotExento.compareTo(BigDecimal.ZERO) > 0) {
                descripcionBuilder.append(" | Exento: $").append(formatMonto(montoTotExento));
            }
            
            // Período (si está disponible)
            String periodoMes = request.getPeriodoMes() != null ? request.getPeriodoMes().trim() : null;
            String periodoAnio = request.getPeriodoAnio() != null ? request.getPeriodoAnio().trim() : null;
            if (periodoMes != null && periodoAnio != null) {
                descripcionBuilder.append("\nPeríodo: ").append(obtenerNombreMes(periodoMes)).append(" ").append(periodoAnio);
            }
            
            // Fecha de pago
            String fechaPago = request.getFechaPago() != null ? request.getFechaPago().trim() : null;
            if (fechaPago != null && !fechaPago.isEmpty()) {
                try {
                    LocalDate fecha = LocalDate.parse(fechaPago);
                    descripcionBuilder.append(" | Fecha de Pago: ").append(fecha.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
                } catch (Exception e) {
                    descripcionBuilder.append(" | Fecha de Pago: ").append(fechaPago);
                }
            }
            
            // Impuestos retenidos con detalles
            BigDecimal isrRetenido = request.getIsrRetenido() != null ? request.getIsrRetenido() : BigDecimal.ZERO;
            BigDecimal ivaRetenido = request.getIvaRetenido() != null ? request.getIvaRetenido() : BigDecimal.ZERO;
            BigDecimal montoRetenidoTotal = request.getMontoRetenido() != null ? request.getMontoRetenido() : BigDecimal.ZERO;
            
            if (montoRetenidoTotal.compareTo(BigDecimal.ZERO) > 0) {
                descripcionBuilder.append("\nImpuestos Retenidos:");
                if (isrRetenido.compareTo(BigDecimal.ZERO) > 0) {
                    descripcionBuilder.append(" ISR: $").append(formatMonto(isrRetenido));
                }
                if (ivaRetenido.compareTo(BigDecimal.ZERO) > 0) {
                    descripcionBuilder.append(" IVA: $").append(formatMonto(ivaRetenido));
                }
                descripcionBuilder.append(" | Total Retenido: $").append(formatMonto(montoRetenidoTotal));
            }
            
            // Detalles de impuestos retenidos si están disponibles
            if (request.getImpRetenidos() != null && !request.getImpRetenidos().isEmpty()) {
                descripcionBuilder.append("\nDetalle de Retenciones:");
                for (RetencionRequest.ImpRetenidoInfo imp : request.getImpRetenidos()) {
                    String impuestoNombre = "";
                    if ("001".equals(imp.getImpuestoRet())) {
                        impuestoNombre = "ISR";
                    } else if ("002".equals(imp.getImpuestoRet())) {
                        impuestoNombre = "IVA";
                    } else if ("003".equals(imp.getImpuestoRet())) {
                        impuestoNombre = "IEPS";
                    } else {
                        impuestoNombre = "Impuesto " + imp.getImpuestoRet();
                    }
                    
                    String tipoPago = "";
                    if ("01".equals(imp.getTipoPagoRet())) {
                        tipoPago = "Definitivo";
                    } else if ("02".equals(imp.getTipoPagoRet())) {
                        tipoPago = "Provisional";
                    } else if ("03".equals(imp.getTipoPagoRet())) {
                        tipoPago = "A cuenta de definitivo";
                    } else if ("04".equals(imp.getTipoPagoRet())) {
                        tipoPago = "A cuenta de provisional";
                    }
                    
                    descripcionBuilder.append("\n  - ").append(impuestoNombre);
                    if (imp.getBaseRet() != null && !imp.getBaseRet().trim().isEmpty()) {
                        try {
                            BigDecimal base = new BigDecimal(imp.getBaseRet());
                            descripcionBuilder.append(" (Base: $").append(formatMonto(base)).append(")");
                        } catch (Exception e) {
                            descripcionBuilder.append(" (Base: ").append(imp.getBaseRet()).append(")");
                        }
                    }
                    if (imp.getMontoRet() != null && !imp.getMontoRet().trim().isEmpty()) {
                        try {
                            BigDecimal monto = new BigDecimal(imp.getMontoRet());
                            descripcionBuilder.append(" Monto: $").append(formatMonto(monto));
                        } catch (Exception e) {
                            descripcionBuilder.append(" Monto: ").append(imp.getMontoRet());
                        }
                    }
                    if (!tipoPago.isEmpty()) {
                        descripcionBuilder.append(" [").append(tipoPago).append("]");
                    }
                }
            }
            
            String descripcionConcepto = descripcionBuilder.toString();
            
            // Guardar información estructurada de la retención para el diseño específico
            Map<String, Object> datosRetencion = new HashMap<>();
            datosRetencion.put("tipoRetencion", tipoRetencion);
            datosRetencion.put("cveRetenc", cveRetenc);
            datosRetencion.put("descripcionTipo", tipoRetencion != null ? obtenerDescripcionTipoRetencion(tipoRetencion) : "");
            datosRetencion.put("concepto", conceptoUsuario);
            datosRetencion.put("montoBase", montoBase);
            datosRetencion.put("montoTotGravado", montoTotGravado);
            datosRetencion.put("montoTotExento", montoTotExento);
            datosRetencion.put("periodoMes", periodoMes);
            datosRetencion.put("periodoAnio", periodoAnio);
            datosRetencion.put("fechaPago", fechaPago);
            datosRetencion.put("isrRetenido", isrRetenido);
            datosRetencion.put("ivaRetenido", ivaRetenido);
            datosRetencion.put("montoRetenido", montoRetenidoTotal);
            datosRetencion.put("impRetenidos", request.getImpRetenidos());
            datosFactura.put("datosRetencion", datosRetencion);
            
            // También mantener conceptos para compatibilidad
            concepto.put("cantidad", BigDecimal.ONE);
            concepto.put("descripcion", conceptoUsuario != null && !conceptoUsuario.isEmpty() ? conceptoUsuario : "Retención de Pagos");
            concepto.put("valorUnitario", montoBase);
            concepto.put("importe", montoBase);
            concepto.put("iva", BigDecimal.ZERO);
            conceptos.add(concepto);
            datosFactura.put("conceptos", conceptos);
            
            // Para retenciones: Subtotal = monto base, Total = monto retenido
            BigDecimal subtotal = montoBase;
            BigDecimal montoRetenido = request.getMontoRetenido() != null ? request.getMontoRetenido() : BigDecimal.ZERO;
            
            datosFactura.put("subtotal", subtotal);
            datosFactura.put("iva", BigDecimal.ZERO);
            datosFactura.put("total", montoRetenido);
            
            // Generar PDF usando ITextPdfService
            byte[] pdfBytes = iTextPdfService.generarPdfConLogo(datosFactura, logoConfigFinal != null ? logoConfigFinal : new HashMap<>());
            logger.info("PDF de vista previa de retención generado exitosamente: {} bytes", pdfBytes != null ? pdfBytes.length : 0);
            return pdfBytes;
        } catch (Exception e) {
            logger.error("Error al generar PDF de vista previa de retención: {}", e.getMessage(), e);
            throw new RuntimeException("Error al generar PDF de vista previa de retención: " + e.getMessage(), e);
        }
    }

}

