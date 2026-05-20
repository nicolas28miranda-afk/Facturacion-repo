package com.cibercom.cdp.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.WebApplicationInitializer;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;

@Slf4j
public class ApplicationInitializer implements WebApplicationInitializer {

    @Override
    public void onStartup(ServletContext servletContext) throws ServletException {
        System.out.println("==========================================");
        System.out.println("ApplicationInitializer.onStartup() called");
        System.out.println("ServletContext: " + servletContext.getServletContextName());
        System.out.println("==========================================");
        
        log.info("=== ApplicationInitializer.onStartup() EJECUTADO ===");
        log.info("ServletContext name: {}", servletContext.getServletContextName());
        log.info("Context path: {}", servletContext.getContextPath());
        
        try {
            // Registrar atributos para verificar que se ejecuta
            servletContext.setAttribute("cdp.initialized", true);
            servletContext.setAttribute("cdp.startup.time", System.currentTimeMillis());
            log.info("=== ApplicationInitializer completado exitosamente ===");
        } catch (Exception e) {
            System.err.println("ERROR en ApplicationInitializer: " + e.getMessage());
            e.printStackTrace();
            log.error("ERROR en ApplicationInitializer", e);
            throw new ServletException("Error inicializando aplicación CDP", e);
        }
    }
}
