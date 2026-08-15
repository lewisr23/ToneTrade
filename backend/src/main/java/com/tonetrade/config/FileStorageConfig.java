package com.tonetrade.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.servlet.MultipartConfigElement;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Local-disk storage for listing media (images/audio/video demos).
 *
 * No S3/Cloudinary account for a dissertation prototype, so files just live
 * on disk under `tonetrade.upload.dir` (default: "uploads", relative to
 * wherever the backend process runs — i.e. backend/uploads when started via
 * `mvn spring-boot:run` from the backend/ folder). Served back out at
 * /uploads/**. Fine for local dev and a demo; would need real object storage
 * before this could survive a redeploy in production.
 */
@Configuration
public class FileStorageConfig implements WebMvcConfigurer {

    @Value("${tonetrade.upload.dir:uploads}")
    private String uploadDir;

    @PostConstruct
    public void createUploadDir() throws IOException {
        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(dir);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/**")
            .addResourceLocations("file:" + dir + "/");
    }

    /**
     * Boot's default multipart limit is 1MB per file — nowhere near enough
     * for an audio or video demo clip. Raise it here instead of via
     * application.properties, since that file is gitignored and shouldn't be
     * the only place this limit is set.
     */
    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        factory.setMaxFileSize(DataSize.ofMegabytes(50));
        factory.setMaxRequestSize(DataSize.ofMegabytes(50));
        return factory.createMultipartConfig();
    }
}
