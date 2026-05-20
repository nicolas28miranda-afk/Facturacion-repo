package com.cibercom.cdp;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.ComponentScan;

@Slf4j
@SpringBootApplication
@ComponentScan(basePackages = "com.cibercom.cdp")
public class CdpApplication extends SpringBootServletInitializer {

    static {
        System.out.println("==========================================");
        System.out.println("CDP Application class loaded");
        System.out.println("==========================================");
    }

    public static void main(String[] args) {
        log.info("=== INICIANDO CDP APPLICATION DESDE MAIN ===");
        SpringApplication app = new SpringApplication(CdpApplication.class);
        app.setLogStartupInfo(true);
        app.run(args);
    }

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        System.out.println("==========================================");
        System.out.println("CDP Application configure() METHOD CALLED");
        System.out.println("Thread: " + Thread.currentThread().getName());
        System.out.println("ClassLoader: " + this.getClass().getClassLoader());
        System.out.println("==========================================");
        
        log.info("=== INICIANDO CDP APPLICATION DESDE SERVLET INITIALIZER ===");
        log.info("Thread: {}", Thread.currentThread().getName());
        
        try {
            SpringApplicationBuilder builder = application.sources(CdpApplication.class);
            builder.logStartupInfo(true);
            log.info("=== SpringApplicationBuilder configurado correctamente ===");
            System.out.println("SpringApplicationBuilder configurado - retornando builder");
            return application;
        } catch (Exception e) {
            System.err.println("==========================================");
            System.err.println("ERROR CRÍTICO al configurar SpringApplicationBuilder");
            System.err.println("Mensaje: " + e.getMessage());
            System.err.println("==========================================");
            e.printStackTrace(System.err);
            log.error("ERROR CRÍTICO al configurar SpringApplicationBuilder", e);
            // Re-lanzar para que Tomcat vea el error
            throw new RuntimeException("Error fatal al inicializar Spring Boot", e);
        }
    }

}
