package com.cibercom.facturacion_back.service;

import com.cibercom.facturacion_back.dto.FormatoCorreoDto;
import com.cibercom.facturacion_back.model.ConfiguracionMensaje;
import com.cibercom.facturacion_back.repository.ConfiguracionMensajeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Logo y colores de Configuración de correo para PDFs (única fuente de verdad).
 */
@Service
public class LogoBrandingService {

    private static final Logger logger = LoggerFactory.getLogger(LogoBrandingService.class);
    private static final String LOGO_FILE_NAME = "logo-base64.txt";

    @Value("${app.logo.storage-file:}")
    private String configuredStorageFile;

    @Autowired
    private ConfiguracionMensajeRepository configuracionMensajeRepository;

    @Autowired
    private FormatoCorreoService formatoCorreoService;

    private Path resolvedStoragePath;

    @PostConstruct
    public void init() {
        resolvedStoragePath = resolveStoragePathForWrite();
        String sample = readActiveLogoDataUri();
        logger.info("Logo PDF: escritura en {} | logo cargado={} ({} chars)",
                resolvedStoragePath.toAbsolutePath(),
                sample != null,
                sample != null ? sample.length() : 0);
    }

    public Path getStoragePath() {
        if (resolvedStoragePath == null) {
            resolvedStoragePath = resolveStoragePathForWrite();
        }
        return resolvedStoragePath;
    }

    /**
     * Lee el logo guardado en configuración de correo, buscando en todas las rutas conocidas del proyecto.
     */
    public String readActiveLogoDataUri() {
        for (Path p : buildLogoCandidatePaths()) {
            try {
                if (Files.isRegularFile(p) && Files.size(p) > 0) {
                    String content = Files.readString(p, StandardCharsets.UTF_8).trim();
                    if (!content.isEmpty()) {
                        return content;
                    }
                }
            } catch (IOException e) {
                logger.warn("No se pudo leer logo en {}: {}", p.toAbsolutePath(), e.getMessage());
            }
        }
        return null;
    }

    public Path saveActiveLogoDataUri(String dataUri) throws IOException {
        String normalized = normalizeDataUri(dataUri);
        if (normalized == null || normalized.isBlank()) {
            throw new IllegalArgumentException("logoBase64 vacío");
        }
        Path p = getStoragePath();
        if (p.getParent() != null && !Files.exists(p.getParent())) {
            Files.createDirectories(p.getParent());
        }
        Files.writeString(p, normalized, StandardCharsets.UTF_8);
        logger.info("Logo guardado en {} ({} chars)", p.toAbsolutePath(), normalized.length());
        return p;
    }

    /**
     * Resuelve logo: override (request) → archivo en disco → null.
     */
    public String resolveLogoDataUri(String override) {
        if (override != null && !override.trim().isEmpty()) {
            String normalized = normalizeDataUri(override);
            if (normalized != null && decodeLogoImageBytes(normalized) != null) {
                return normalized;
            }
            logger.warn("Logo del request no decodificable; se usará archivo en disco si existe");
        }
        return readActiveLogoDataUri();
    }

    /**
     * Decodifica data URI / base64 a bytes de imagen (PNG/JPEG).
     */
    public byte[] decodeLogoImageBytes(String dataUri) {
        if (dataUri == null || dataUri.isBlank()) {
            return null;
        }
        try {
            String payload = dataUri.trim();
            if (payload.contains(",")) {
                payload = payload.substring(payload.indexOf(',') + 1);
            }
            payload = payload.replaceAll("\\s+", "");
            if (payload.isEmpty()) {
                return null;
            }
            return Base64.getDecoder().decode(payload);
        } catch (Exception e) {
            logger.warn("No se pudo decodificar logo configurado: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Mapa para {@link ITextPdfService#generarPdfConLogo}: color + logo del usuario.
     */
    public Map<String, Object> buildPdfLogoConfig(String logoBase64Override) {
        Map<String, Object> logoConfig = new java.util.HashMap<>();
        logoConfig.put("skipDefaultLogoFallback", Boolean.TRUE);

        String colorPrimario = resolveColorPrimario();
        Map<String, Object> customColors = new java.util.HashMap<>();
        customColors.put("primary", colorPrimario);
        logoConfig.put("customColors", customColors);

        String dataUri = resolveLogoDataUri(logoBase64Override);
        byte[] imageBytes = decodeLogoImageBytes(dataUri);

        if (imageBytes == null || imageBytes.length == 0) {
            dataUri = readActiveLogoDataUri();
            imageBytes = decodeLogoImageBytes(dataUri);
        }

        if (imageBytes == null || imageBytes.length == 0) {
            imageBytes = loadClasspathLogoBytes();
            if (imageBytes != null && imageBytes.length > 0) {
                dataUri = "data:image/png;base64," + Base64.getEncoder().encodeToString(imageBytes);
                logoConfig.put("skipDefaultLogoFallback", Boolean.FALSE);
                logger.info("PDF branding: usando logo classpath ({} bytes)", imageBytes.length);
            }
        }

        if (dataUri != null && !dataUri.isBlank()) {
            logoConfig.put("logoBase64", dataUri);
            if (imageBytes != null && imageBytes.length > 0) {
                logoConfig.put("logoImageBytes", imageBytes);
                logger.info("PDF branding: logo en PDF ({} bytes), color {}", imageBytes.length, colorPrimario);
            } else {
                logger.warn("PDF branding: data URI presente pero imagen no decodificable");
            }
        } else {
            logger.warn("PDF branding: sin logo; guarde el logo en Configuración de correo");
        }
        return logoConfig;
    }

    public byte[] resolveActiveLogoPngOrImageBytes() {
        byte[] fromConfig = decodeLogoImageBytes(resolveLogoDataUri(null));
        if (fromConfig != null && fromConfig.length > 0) {
            return fromConfig;
        }
        return loadClasspathLogoBytes();
    }

    private byte[] loadClasspathLogoBytes() {
        String[] resources = {
                "static/images/Logo Cibercom.png",
                "static/images/logo.png"
        };
        for (String res : resources) {
            try (InputStream in = getClass().getClassLoader().getResourceAsStream(res)) {
                if (in != null) {
                    return in.readAllBytes();
                }
            } catch (IOException e) {
                logger.warn("No se pudo cargar {}: {}", res, e.getMessage());
            }
        }
        return null;
    }

    private String resolveColorPrimario() {
        try {
            Optional<ConfiguracionMensaje> configuracionOpt =
                    configuracionMensajeRepository.findMostRecentActiveConfiguration();
            if (configuracionOpt.isPresent()) {
                String color = configuracionOpt.get().getColorTexto();
                if (color != null && !color.isBlank()) {
                    return color.trim();
                }
            }
            FormatoCorreoDto archivo = formatoCorreoService.obtenerConfiguracionActiva();
            if (archivo != null && archivo.getColorTexto() != null && !archivo.getColorTexto().isBlank()) {
                return archivo.getColorTexto().trim();
            }
        } catch (Exception e) {
            logger.warn("No se pudo obtener color de formato: {}", e.getMessage());
        }
        return "#1d4ed8";
    }

    private String normalizeDataUri(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.startsWith("data:image/")) {
            return trimmed;
        }
        if (!trimmed.contains(",")) {
            return "data:image/png;base64," + trimmed;
        }
        return trimmed;
    }

    private List<Path> buildLogoCandidatePaths() {
        Set<Path> seen = new LinkedHashSet<>();
        List<Path> candidates = new ArrayList<>();

        if (configuredStorageFile != null && !configuredStorageFile.isBlank()) {
            addCandidate(candidates, seen, Paths.get(configuredStorageFile.trim()));
        }

        String tomcatBase = System.getProperty("catalina.base");
        if (tomcatBase != null && !tomcatBase.isEmpty()) {
            addCandidate(candidates, seen, Paths.get(tomcatBase, "conf", LOGO_FILE_NAME));
        }

        String userDir = System.getProperty("user.dir");
        if (userDir != null && !userDir.isBlank()) {
            Path base = Paths.get(userDir).toAbsolutePath().normalize();
            Path cursor = base;
            for (int i = 0; i < 7 && cursor != null; i++) {
                addCandidate(candidates, seen, cursor.resolve("config").resolve(LOGO_FILE_NAME));
                addCandidate(candidates, seen,
                        cursor.resolve("facturacion-back").resolve("facturacion-back").resolve("config").resolve(LOGO_FILE_NAME));
                addCandidate(candidates, seen,
                        cursor.resolve("facturacion-back").resolve("config").resolve(LOGO_FILE_NAME));
                cursor = cursor.getParent();
            }
        }

        return candidates;
    }

    private void addCandidate(List<Path> candidates, Set<Path> seen, Path path) {
        if (path == null) {
            return;
        }
        Path abs = path.toAbsolutePath().normalize();
        if (seen.add(abs)) {
            candidates.add(abs);
        }
    }

    /** Ruta donde se persiste el logo al guardar desde configuración de correo. */
    private Path resolveStoragePathForWrite() {
        for (Path p : buildLogoCandidatePaths()) {
            try {
                if (Files.isRegularFile(p) && Files.size(p) > 0) {
                    return p;
                }
            } catch (IOException ignored) {
                // siguiente candidato
            }
        }
        String userDir = System.getProperty("user.dir", ".");
        Path modulePath = Paths.get(userDir, "facturacion-back", "facturacion-back", "config", LOGO_FILE_NAME)
                .toAbsolutePath().normalize();
        if (Files.exists(modulePath.getParent())) {
            return modulePath;
        }
        Path localConfig = Paths.get(userDir, "config", LOGO_FILE_NAME).toAbsolutePath().normalize();
        return localConfig;
    }
}
