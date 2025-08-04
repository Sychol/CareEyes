package com.careeyes.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // 🔓 클라이언트 주소 허용 (React 개발 서버 주소)
        config.setAllowedOriginPatterns(List.of("http://localhost:5174", "http://49.50.134.171", "https://localhost:5173"));

        // 🔄 요청 메서드 허용
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        
        // 🧾 모든 헤더 허용
        config.setAllowedHeaders(List.of("*"));

        // ✅ 인증정보 (세션, 쿠키 등) 포함 허용
        config.setAllowCredentials(true);

        // 📍 URL 경로 패턴 지정
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
