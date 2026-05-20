package com.cibercom.facturacion_back.service;

import com.cibercom.facturacion_back.dao.UuidFacturaOracleDAO;
import com.cibercom.facturacion_back.model.Factura;
import com.cibercom.facturacion_back.repository.FacturaMongoRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Envío de factura (PDF y opcionalmente XML) vía WhatsApp Cloud API (Meta).
 */
@Service
public class WhatsAppService {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppService.class);

    private final FacturaService facturaService;
    private final CorreoService correoService;
    private final ObjectMapper objectMapper;
    private final org.springframework.core.env.Environment environment;
    private final ObjectProvider<FacturaMongoRepository> facturaMongoRepositoryProvider;
    private final ObjectProvider<UuidFacturaOracleDAO> uuidFacturaOracleDaoProvider;
    private final RestTemplate restTemplate = new RestTemplate();

    /** Subida /media con multipart explícito (evita problemas de boundary con RestTemplate). */
    private static final HttpClient WHATSAPP_MEDIA_HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(45))
            .build();

    @Value("${whatsapp.access-token:}")
    private String accessToken;

    @Value("${whatsapp.phone-number-id:}")
    private String phoneNumberId;

    @Value("${whatsapp.graph-api-version:v21.0}")
    private String graphApiVersion;

    /** Plantilla Meta antes de texto/PDF; en sandbox suele hacer falta para el primer mensaje al cliente. */
    @Value("${whatsapp.pre-envio-template-enabled:true}")
    private boolean preEnvioTemplateEnabled;

    /**
     * Si true y el destino es 52 + 10 dígitos sin el 1 de móvil (12 dígitos), se usa 521… (típico móvil MX en WhatsApp).
     * Desactívalo si tu lista de prueba de Meta exige el número exacto sin 1 (p. ej. 527331565237).
     */
    @Value("${whatsapp.mexico-insert-one-after-52:false}")
    private boolean mexicoInsertOneAfter52;

    @Value("${whatsapp.pre-envio-template-name:hello_world}")
    private String preEnvioTemplateName;

    @Value("${whatsapp.pre-envio-template-language:en_US}")
    private String preEnvioTemplateLanguage;

    public WhatsAppService(
            FacturaService facturaService,
            CorreoService correoService,
            ObjectMapper objectMapper,
            org.springframework.core.env.Environment environment,
            ObjectProvider<FacturaMongoRepository> facturaMongoRepositoryProvider,
            ObjectProvider<UuidFacturaOracleDAO> uuidFacturaOracleDaoProvider) {
        this.facturaService = facturaService;
        this.correoService = correoService;
        this.objectMapper = objectMapper;
        this.environment = environment;
        this.facturaMongoRepositoryProvider = facturaMongoRepositoryProvider;
        this.uuidFacturaOracleDaoProvider = uuidFacturaOracleDaoProvider;
    }

    public boolean estaConfigurado() {
        return !tokenLimpio().isEmpty()
                && phoneNumberId != null && !phoneNumberId.isBlank();
    }

    /** Token sin espacios; si viene con prefijo "Bearer ", se quita (evita Authorization inválida). */
    private String tokenLimpio() {
        if (accessToken == null) {
            return "";
        }
        String t = accessToken.trim();
        if (t.regionMatches(true, 0, "bearer ", 0, 7)) {
            t = t.substring(7).trim();
        }
        return t;
    }

    /** Evita que el segundo mensaje (PDF) se pierda si Graph aplica rate limit o el cliente refresca tarde. */
    private void pausaEntreMensajesWhatsApp() {
        try {
            Thread.sleep(1500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private void pausaCortaWhatsApp(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public Map<String, Object> enviarFacturaPorWhatsApp(
            String uuidFactura, String numeroDestino, String mensaje, String logoBase64) {
        Map<String, Object> response = new HashMap<>();
        // Usar solo dígitos; el formato debe coincidir con el que Meta tenga en la lista de prueba (p. ej. 527331565237).
        String to = normalizarDestinoWhatsApp(numeroDestino);
        if (to.length() < 10) {
            response.put("success", false);
            response.put("message", "Número de destino inválido (se esperan al menos 10 dígitos).");
            response.put("numeroDestino", numeroDestino);
            return response;
        }
        if (!preEnvioTemplateEnabled) {
            logger.warn("WhatsApp: pre-envio-template desactivado; Meta suele rechazar el PDF como primer mensaje si el cliente no escribió en las últimas 24 h.");
        }
        logger.info("WhatsApp: envío factura UUID={} to={} plantillaPrevia={}", uuidFactura, to, preEnvioTemplateEnabled);

        Factura factura = facturaService.buscarPorUuid(uuidFactura);
        if (factura == null) {
            response.put("success", false);
            response.put("message", "No se encontró la factura con el UUID indicado.");
            response.put("numeroDestino", to);
            return response;
        }

        Map<String, Object> logoConfig = correoService.construirLogoConfigParaPdf(logoBase64);
        byte[] pdfBytes;
        try {
            pdfBytes = facturaService.obtenerPdfComoBytes(uuidFactura, logoConfig);
        } catch (RuntimeException pdfEx) {
            logger.error("WhatsApp: fallo generando PDF con plantilla configurada UUID={}: {}", uuidFactura, pdfEx.getMessage());
            response.put("success", false);
            response.put("message", "No se pudo generar el PDF con su plantilla (logo/color). "
                    + "Guarde logo y color en Configuración de correo y reinicie el backend. Detalle: "
                    + pdfEx.getMessage());
            response.put("numeroDestino", to);
            return response;
        }
        if (pdfBytes == null || pdfBytes.length < 50) {
            response.put("success", false);
            response.put("message", "No se pudo generar el PDF del comprobante (revisa que esté timbrado y guardado en FACTURAS).");
            response.put("numeroDestino", to);
            return response;
        }

        String nombrePdf = nombrePdfWhatsApp(factura, uuidFactura);
        String captionBase = captionDocumentoFactura(factura);

        EnvioResultado plantillaInicial = enviarPlantillaInicial(to);
        if (!plantillaInicial.ok()) {
            logger.warn("Plantilla inicial {} no enviada: {}",
                    preEnvioTemplateName, plantillaInicial.userMessage());
            if (preEnvioTemplateEnabled) {
                response.put("success", false);
                response.put("message",
                        "WhatsApp: no se pudo enviar la plantilla inicial (necesaria para abrir la conversación antes del texto y el PDF). "
                                + (plantillaInicial.userMessage() != null ? plantillaInicial.userMessage() : "error desconocido")
                                + " Revisa en Meta el nombre e idioma de la plantilla (whatsapp.pre-envio-template-name / "
                                + "whatsapp.pre-envio-template-language), que esté aprobada y que el número esté en la lista de prueba si la app está en desarrollo.");
                response.put("numeroDestino", to);
                return response;
            }
        } else if (preEnvioTemplateEnabled) {
            pausaEntreMensajesWhatsApp();
        }

        // Texto de sesión tras la plantilla: el caption solo acompaña al documento; si el PDF falla, el usuario no ve nada del sistema/modal.
        String lineaChat = textoTrasPlantilla(mensaje);
        EnvioResultado tx = enviarTextoPlano(to, lineaChat);
        if (!tx.ok()) {
            logger.warn("WhatsApp: mensaje de texto no enviado: {}", tx.userMessage());
            if (!preEnvioTemplateEnabled) {
                response.put("success", false);
                response.put("message",
                        "WhatsApp rechazó el mensaje de texto. Sin plantilla inicial, Meta suele bloquear el primer contacto "
                                + "(el cliente debe escribir primero al número de negocio o activar whatsapp.pre-envio-template-enabled). "
                                + "Detalle: " + (tx.userMessage() != null ? tx.userMessage() : "error desconocido"));
                response.put("numeroDestino", to);
                return response;
            }
        } else {
            pausaCortaWhatsApp(600);
        }

        logger.info("WhatsApp: subiendo PDF a /media para UUID {}", uuidFactura);
        MediaUploadResult pdfUpload = subirMedia(pdfBytes, nombrePdf, "application/pdf");
        if (pdfUpload.mediaId() == null) {
            response.put("success", false);
            response.put("message", pdfUpload.userMessage() != null
                    ? "No se pudo subir el PDF a WhatsApp: " + pdfUpload.userMessage()
                    : "No se pudo subir el PDF a WhatsApp (revisa token, phone-number-id y permisos de la app).");
            response.put("numeroDestino", to);
            return response;
        }

        logger.info("WhatsApp: enviando mensaje documento PDF a to={}", to);
        EnvioResultado envioPdf = enviarDocumento(to, pdfUpload.mediaId(), nombrePdf, captionBase);
        if (!envioPdf.ok()) {
            response.put("success", false);
            response.put("message", envioPdf.userMessage() != null
                    ? "No se pudo enviar el PDF: " + envioPdf.userMessage()
                    : "No se pudo enviar el documento PDF por WhatsApp.");
            response.put("numeroDestino", to);
            return response;
        }

        byte[] xmlBytes = obtenerXmlPorUuid(uuidFactura, factura);
        if (xmlBytes != null && xmlBytes.length > 0) {
            // Meta no acepta application/xml. Spring además infiere ese MIME por extensión .xml en multipart.
            // Subimos como .txt + text/plain; el nombre al enviar el documento sigue siendo .xml para el cliente.
            MediaUploadResult xmlUpload = subirMedia(xmlBytes, "Factura-" + uuidFactura + ".txt", "text/plain");
            if (xmlUpload.mediaId() != null) {
                enviarDocumento(to, xmlUpload.mediaId(), "Factura-" + uuidFactura + ".xml", "XML CFDI");
            } else {
                logger.warn("PDF enviado pero falló la subida del XML para UUID {}", uuidFactura);
            }
        }

        response.put("success", true);
        response.put("message", "Factura enviada por WhatsApp correctamente.");
        response.put("numeroDestino", to);
        response.put("whatsappTo", to);
        return response;
    }

    private String normalizarDestinoWhatsApp(String numeroDestino) {
        if (numeroDestino == null) {
            return "";
        }
        String digits = numeroDestino.replaceAll("[^0-9]", "");
        if (mexicoInsertOneAfter52 && digits.startsWith("52") && digits.length() == 12 && digits.charAt(2) != '1') {
            return "521" + digits.substring(2);
        }
        return digits;
    }

    private String graphBase() {
        String ver = graphApiVersion == null || graphApiVersion.isBlank() ? "v21.0" : graphApiVersion.trim();
        if (!ver.startsWith("v")) {
            ver = "v" + ver;
        }
        return "https://graph.facebook.com/" + ver + "/" + phoneNumberId.trim();
    }

    private HttpHeaders bearerJsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(tokenLimpio());
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    /** Leyenda corta en el PDF; el cuerpo del modal va en el mensaje de texto. */
    private String captionDocumentoFactura(Factura factura) {
        String etiqueta = etiquetaTipoComprobante(factura);
        if (factura != null && factura.getSerie() != null && factura.getFolio() != null) {
            return etiqueta + " " + factura.getSerie() + factura.getFolio();
        }
        return etiqueta;
    }

    private String etiquetaTipoComprobante(Factura factura) {
        if (factura == null || factura.getTipoFactura() == null) {
            return "Comprobante";
        }
        return switch (factura.getTipoFactura()) {
            case 3 -> "Carta porte";
            case 4 -> "Nómina";
            case 5 -> "Complemento de pago";
            case 6 -> "Retención de pagos";
            default -> "Factura";
        };
    }

    private String nombrePdfWhatsApp(Factura factura, String uuid) {
        String prefijo = "Factura";
        if (factura != null && factura.getTipoFactura() != null) {
            prefijo = switch (factura.getTipoFactura()) {
                case 3 -> "CartaPorte";
                case 4 -> "Nomina";
                case 5 -> "ComplementoPago";
                case 6 -> "Retencion";
                default -> "Factura";
            };
        }
        if (factura != null && factura.getSerie() != null && factura.getFolio() != null) {
            return prefijo + "-" + factura.getSerie() + factura.getFolio() + ".pdf";
        }
        return prefijo + "-" + uuid + ".pdf";
    }

    /**
     * Mismo cuerpo que el curl de Meta: plantilla fija (p. ej. hello_world). No incluye el texto del modal;
     * ese texto se envía después con {@link #enviarTextoPlano}.
     */
    private EnvioResultado enviarPlantillaInicial(String to) {
        if (!preEnvioTemplateEnabled) {
            return new EnvioResultado(true, null);
        }
        String nombre = preEnvioTemplateName != null ? preEnvioTemplateName.trim() : "";
        if (nombre.isEmpty()) {
            return new EnvioResultado(true, null);
        }
        try {
            Map<String, Object> language = new HashMap<>();
            language.put("code", preEnvioTemplateLanguage != null && !preEnvioTemplateLanguage.isBlank()
                    ? preEnvioTemplateLanguage.trim()
                    : "en_US");
            Map<String, Object> template = new HashMap<>();
            template.put("name", nombre);
            template.put("language", language);
            Map<String, Object> payload = new HashMap<>();
            payload.put("messaging_product", "whatsapp");
            payload.put("to", to);
            payload.put("type", "template");
            payload.put("template", template);

            String json = objectMapper.writeValueAsString(payload);
            HttpEntity<String> entity = new HttpEntity<>(json, bearerJsonHeaders());
            ResponseEntity<String> resp = restTemplate.postForEntity(graphBase() + "/messages", entity, String.class);

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                logger.error("Error enviando plantilla inicial: {} - {}", resp.getStatusCode(), resp.getBody());
                return new EnvioResultado(false, resumirErrorGraph(resp.getBody(), resp.getStatusCode().value()));
            }
            JsonNode root = objectMapper.readTree(resp.getBody());
            if (root.has("error")) {
                logger.error("Graph API error plantilla inicial: {}", resp.getBody());
                return new EnvioResultado(false, resumirErrorDesdeNodo(root.get("error"), resp.getStatusCode().value()));
            }
            if (root.has("messages") && root.get("messages").isArray() && root.get("messages").size() > 0) {
                JsonNode first = root.get("messages").get(0);
                if (first.has("id")) {
                    logger.info("WhatsApp: plantilla inicial '{}' enviada a to={} wamid={}",
                            nombre, to, first.get("id").asText());
                }
            } else {
                logger.warn("WhatsApp: plantilla inicial sin 'messages' en respuesta: {}", resp.getBody());
            }
            return new EnvioResultado(true, null);
        } catch (RestClientResponseException e) {
            String body = e.getResponseBodyAsString(StandardCharsets.UTF_8);
            logger.error("HTTP {} plantilla inicial: {}", e.getStatusCode().value(), body);
            return new EnvioResultado(false, resumirErrorGraph(body, e.getStatusCode().value()));
        } catch (Exception e) {
            logger.error("Excepción plantilla inicial: {}", e.getMessage(), e);
            return new EnvioResultado(false, e.getMessage());
        }
    }

    private record MediaUploadResult(String mediaId, String userMessage) {}

    private record EnvioResultado(boolean ok, String userMessage) {}

    /**
     * Mismo texto que {@code WHATSAPP_MENSAJE_BASE_FACTURA} en el front; la plantilla hello_world de Meta no admite cuerpo libre.
     */
    private static final String MENSAJE_TEXTO_DEFECTO_FACTURA_WHATSAPP =
            "Estimado(a) cliente,\n\n"
                    + "Por este medio le hacemos llegar su factura electrónica.\n\n"
                    + "Agradecemos su preferencia.\n\n"
                    + "Atentamente,\n"
                    + "Equipo de Facturación";

    private String textoTrasPlantilla(String mensaje) {
        if (mensaje != null && !mensaje.isBlank()) {
            return mensaje.trim();
        }
        return MENSAJE_TEXTO_DEFECTO_FACTURA_WHATSAPP;
    }

    /**
     * Mensaje de texto de sesión (no plantilla). Va después de la plantilla inicial para que el usuario vea el texto del modal.
     */
    private EnvioResultado enviarTextoPlano(String to, String bodyText) {
        if (bodyText == null || bodyText.isBlank()) {
            return new EnvioResultado(true, null);
        }
        String t = bodyText.length() > 4096 ? bodyText.substring(0, 4096) : bodyText;
        try {
            Map<String, Object> text = new HashMap<>();
            text.put("preview_url", false);
            text.put("body", t);
            Map<String, Object> payload = new HashMap<>();
            payload.put("messaging_product", "whatsapp");
            payload.put("recipient_type", "individual");
            payload.put("to", to);
            payload.put("type", "text");
            payload.put("text", text);

            String json = objectMapper.writeValueAsString(payload);
            HttpEntity<String> entity = new HttpEntity<>(json, bearerJsonHeaders());
            ResponseEntity<String> resp = restTemplate.postForEntity(graphBase() + "/messages", entity, String.class);
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                return new EnvioResultado(false, resumirErrorGraph(resp.getBody(), resp.getStatusCode().value()));
            }
            JsonNode root = objectMapper.readTree(resp.getBody());
            if (root.has("error")) {
                return new EnvioResultado(false, resumirErrorDesdeNodo(root.get("error"), resp.getStatusCode().value()));
            }
            logger.info("WhatsApp: texto enviado a to={}", to);
            return new EnvioResultado(true, null);
        } catch (RestClientResponseException e) {
            String body = e.getResponseBodyAsString(StandardCharsets.UTF_8);
            return new EnvioResultado(false, resumirErrorGraph(body, e.getStatusCode().value()));
        } catch (Exception e) {
            return new EnvioResultado(false, e.getMessage());
        }
    }

    private static String nombreArchivoSeguroMultipart(String filename) {
        if (filename == null || filename.isBlank()) {
            return "archivo.bin";
        }
        String s = filename.replace("\"", "_").replace("\r", "_").replace("\n", "_").replace("\\", "_");
        return s.length() > 200 ? s.substring(0, 200) : s;
    }

    private static byte[] construirCuerpoMultipartMedia(String boundary, String filename, String mimeType, byte[] fileBytes)
            throws java.io.IOException {
        var utf8 = StandardCharsets.UTF_8;
        String dash = "--" + boundary;
        ByteArrayOutputStream bos = new ByteArrayOutputStream(fileBytes.length + 1024);
        bos.write(dash.getBytes(utf8));
        bos.write("\r\n".getBytes(utf8));
        bos.write("Content-Disposition: form-data; name=\"messaging_product\"\r\n\r\n".getBytes(utf8));
        bos.write("whatsapp".getBytes(utf8));
        bos.write("\r\n".getBytes(utf8));
        bos.write(dash.getBytes(utf8));
        bos.write("\r\n".getBytes(utf8));
        bos.write("Content-Disposition: form-data; name=\"type\"\r\n\r\n".getBytes(utf8));
        bos.write(mimeType.getBytes(utf8));
        bos.write("\r\n".getBytes(utf8));
        bos.write(dash.getBytes(utf8));
        bos.write("\r\n".getBytes(utf8));
        String fn = nombreArchivoSeguroMultipart(filename);
        bos.write(("Content-Disposition: form-data; name=\"file\"; filename=\"" + fn + "\"\r\n").getBytes(utf8));
        bos.write(("Content-Type: " + mimeType + "\r\n\r\n").getBytes(utf8));
        bos.write(fileBytes);
        bos.write("\r\n".getBytes(utf8));
        bos.write((dash + "--\r\n").getBytes(utf8));
        return bos.toByteArray();
    }

    private MediaUploadResult subirMedia(byte[] data, String filename, String mimeType) {
        String boundary = "wpmfb" + UUID.randomUUID().toString().replace("-", "");
        try {
            byte[] body = construirCuerpoMultipartMedia(boundary, filename, mimeType, data);
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(graphBase() + "/media"))
                    .timeout(Duration.ofMinutes(2))
                    .header("Authorization", "Bearer " + tokenLimpio())
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .build();
            HttpResponse<String> resp = WHATSAPP_MEDIA_HTTP.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            int status = resp.statusCode();
            String respBody = resp.body();
            if (status < 200 || status >= 300 || respBody == null) {
                logger.error("Error subiendo media HTTP {}: {}", status, respBody);
                return new MediaUploadResult(null, resumirErrorGraph(respBody, status));
            }
            JsonNode root = objectMapper.readTree(respBody);
            if (root.has("error")) {
                String detail = resumirErrorDesdeNodo(root.get("error"), status);
                logger.error("Graph API error al subir media: {}", respBody);
                return new MediaUploadResult(null, detail);
            }
            if (root.has("id") && root.get("id").isTextual()) {
                String mid = root.get("id").asText();
                logger.info("WhatsApp: media subida OK id={} filename={}", mid, filename);
                return new MediaUploadResult(mid, null);
            }
            logger.error("Respuesta de media sin id: {}", respBody);
            return new MediaUploadResult(null, resumirErrorGraph(respBody, status));
        } catch (Exception e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            logger.error("Excepción al subir media: {}", e.getMessage(), e);
            return new MediaUploadResult(null, e.getMessage());
        }
    }

    private EnvioResultado enviarDocumento(String to, String mediaId, String filename, String caption) {
        try {
            Map<String, Object> document = new HashMap<>();
            document.put("id", mediaId);
            document.put("filename", filename);
            if (caption != null && !caption.isBlank()) {
                document.put("caption", caption.length() > 1024 ? caption.substring(0, 1024) : caption);
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("messaging_product", "whatsapp");
            payload.put("recipient_type", "individual");
            payload.put("to", to);
            payload.put("type", "document");
            payload.put("document", document);

            String json = objectMapper.writeValueAsString(payload);
            HttpEntity<String> entity = new HttpEntity<>(json, bearerJsonHeaders());
            ResponseEntity<String> resp = restTemplate.postForEntity(graphBase() + "/messages", entity, String.class);

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                logger.error("Error enviando documento: {} - {}", resp.getStatusCode(), resp.getBody());
                return new EnvioResultado(false, resumirErrorGraph(resp.getBody(), resp.getStatusCode().value()));
            }
            JsonNode root = objectMapper.readTree(resp.getBody());
            if (root.has("error")) {
                logger.error("Graph API error al enviar documento: {}", resp.getBody());
                return new EnvioResultado(false, resumirErrorDesdeNodo(root.get("error"), resp.getStatusCode().value()));
            }
            if (root.has("messages") && root.get("messages").isArray() && root.get("messages").size() > 0) {
                JsonNode first = root.get("messages").get(0);
                if (first.has("id")) {
                    logger.info("WhatsApp: Graph aceptó envío de documento a to={} wamid={}", to, first.get("id").asText());
                    return new EnvioResultado(true, null);
                }
                logger.warn("WhatsApp: respuesta sin id de mensaje. Cuerpo={}", resp.getBody());
                return new EnvioResultado(false, "Graph respondió sin id de mensaje: " + truncarParaUi(resp.getBody()));
            }
            logger.warn("WhatsApp: HTTP 200 pero sin arreglo 'messages'. Cuerpo={}", resp.getBody());
            return new EnvioResultado(false, "Graph respondió sin messages[] (el PDF podría no haberse encolado): " + truncarParaUi(resp.getBody()));
        } catch (RestClientResponseException e) {
            String body = e.getResponseBodyAsString(StandardCharsets.UTF_8);
            logger.error("Error enviando documento: {} - {}", e.getStatusCode().value(), body);
            return new EnvioResultado(false, resumirErrorGraph(body, e.getStatusCode().value()));
        } catch (Exception e) {
            logger.error("Excepción al enviar documento: {}", e.getMessage(), e);
            return new EnvioResultado(false, e.getMessage());
        }
    }

    private String resumirErrorGraph(String body, int httpStatus) {
        if (body == null || body.isBlank()) {
            if (httpStatus == 401) {
                return "HTTP 401 — Meta rechazó el token (caducado, revocado o incorrecto). "
                        + "Genera un token nuevo en Meta (WhatsApp > Configuración de la API) y actualiza "
                        + "WHATSAPP_ACCESS_TOKEN o whatsapp.access-token en application.yml; reinicia el backend.";
            }
            if (httpStatus == 403) {
                return "HTTP 403 — sin permiso para esta operación. Revisa permisos de la app, modo Desarrollo/Live "
                        + "y que el phone-number-id sea del mismo activo de negocio que el token.";
            }
            return "HTTP " + httpStatus;
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            if (root.has("error")) {
                return resumirErrorDesdeNodo(root.get("error"), httpStatus);
            }
        } catch (Exception ignored) {
            // cuerpo no JSON
        }
        return truncarParaUi(body);
    }

    private String resumirErrorDesdeNodo(JsonNode errorNode, int httpStatus) {
        if (errorNode == null || errorNode.isMissingNode()) {
            return "HTTP " + httpStatus;
        }
        String msg = errorNode.has("message") && errorNode.get("message").isTextual()
                ? errorNode.get("message").asText()
                : errorNode.toString();
        int code = errorNode.has("code") && errorNode.get("code").isIntegralNumber()
                ? errorNode.get("code").asInt()
                : httpStatus;
        String base = "(" + code + ") " + truncarParaUi(msg);
        if (code == 131030 || (msg != null && msg.contains("allowed list"))) {
            base += " Solución: en developers.facebook.com abre tu app → WhatsApp → Configuración de la API y añade el número de destino a la lista de teléfonos de prueba (en desarrollo solo llegan a esos números; máx. ~5). Para enviar a cualquier cliente hace falta pasar la app a producción según las reglas de Meta.";
        }
        if (code == 131047) {
            base += " Suele indicar que no hay conversación abierta: activa whatsapp.pre-envio-template-enabled (plantilla aprobada antes del PDF) o pide al cliente que escriba primero al número de negocio.";
        }
        if (code == 131026) {
            base += " Mensaje no entregable (revisa formato del número, que exista en WhatsApp y la lista de prueba de Meta).";
        }
        if (code == 131056) {
            base += " Límite de frecuencia: espera unos segundos entre mensajes al mismo número (Meta: ~1 mensaje cada 6 s por destinatario).";
        }
        if (code == 133010) {
            base += " El número podría no tener cuenta de WhatsApp o no coincidir con el formato esperado (México móvil: suele usarse 521 + lada + número).";
        }
        return base;
    }

    private String truncarParaUi(String s) {
        if (s == null) {
            return "";
        }
        String t = s.replace('\n', ' ').trim();
        return t.length() > 280 ? t.substring(0, 277) + "..." : t;
    }

    private byte[] obtenerXmlPorUuid(String uuidFactura, Factura factura) {
        try {
            if (factura != null && factura.getXmlContent() != null && !factura.getXmlContent().trim().isEmpty()) {
                return factura.getXmlContent().getBytes(StandardCharsets.UTF_8);
            }

            String activeProfile = (environment != null && environment.getActiveProfiles().length > 0)
                    ? environment.getActiveProfiles()[0]
                    : "oracle";
            String xmlContent = null;

            if ("mongo".equalsIgnoreCase(activeProfile)) {
                FacturaMongoRepository mongoRepo = facturaMongoRepositoryProvider.getIfAvailable();
                if (mongoRepo != null) {
                    var facturaMongo = mongoRepo.findByUuid(uuidFactura);
                    xmlContent = (facturaMongo != null) ? facturaMongo.getXmlContent() : null;
                }
            } else {
                UuidFacturaOracleDAO dao = uuidFacturaOracleDaoProvider.getIfAvailable();
                if (dao != null) {
                    var opt = dao.obtenerBasicosPorUuid(uuidFactura);
                    xmlContent = (opt.isPresent()) ? opt.get().xmlContent : null;
                }
            }

            if (xmlContent != null && !xmlContent.trim().isEmpty()) {
                return xmlContent.getBytes(StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            logger.warn("No se pudo obtener XML para UUID {}: {}", uuidFactura, e.getMessage());
        }
        return null;
    }
}
