package com.cibercom.cdp.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Configuration
@EnableConfigurationProperties(CorsProperties.class)
public class WebConfig implements WebMvcConfigurer {

    private final CorsProperties corsProperties;

    public WebConfig(CorsProperties corsProperties) {
        log.info("=== INICIALIZANDO WebConfig ===");
        if (corsProperties == null) {
            log.warn("CorsProperties es null, usando configuración por defecto");
            this.corsProperties = new CorsProperties();
            // Configuración por defecto para desarrollo y producción
            this.corsProperties.setAllowedOrigins(Arrays.asList(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://174.136.25.157:5173",
                "http://174.136.25.157:5174"
            ));
        } else {
            this.corsProperties = corsProperties;
            log.info("CorsProperties cargado con {} orígenes permitidos", 
                corsProperties.getAllowedOrigins() != null ? corsProperties.getAllowedOrigins().size() : 0);
        }
        log.info("=== WebConfig inicializado correctamente ===");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        log.info("=== Configurando CORS mappings ===");
        List<String> origins = corsProperties != null ? corsProperties.getAllowedOrigins() : null;
        
        if (origins == null || origins.isEmpty()) {
            log.warn("No hay orígenes CORS configurados, usando configuración por defecto");
            registry.addMapping("/api/**")
                    .allowedOrigins("*")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(false);
        } else {
            log.info("Configurando CORS para {} orígenes", origins.size());
            registry.addMapping("/api/**")
                    .allowedOrigins(origins.toArray(new String[0]))
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
        }
    }

    @Bean
    @ConditionalOnBean(CorsProperties.class)
    public CorsConfigurationSource corsConfigurationSource() {
        log.info("=== Creando CorsConfigurationSource bean ===");
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = corsProperties != null ? corsProperties.getAllowedOrigins() : null;
        
        if (origins != null && !origins.isEmpty()) {
            configuration.setAllowedOrigins(origins);
            configuration.setAllowCredentials(true);
        } else {
            configuration.addAllowedOriginPattern("*");
            configuration.setAllowCredentials(false);
        }
        
        configuration.addAllowedMethod("*");
        configuration.addAllowedHeader("*");
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        log.info("=== CorsConfigurationSource creado correctamente ===");
        return source;
    }
}
