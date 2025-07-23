package com.careeyes.controller;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

//websocket 환경설정 클래스
@Configuration // spring application이 미리 읽어서 객체를 생성
@EnableWebSocket // websocket 사용을 명시
public class WebSocketConfig implements WebSocketConfigurer {

	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		// 레지스트리 : 컴퓨터의 환셩설정을 하는 공간
		registry.addHandler(new WebSocketHandler(), "/websocket")
		.setAllowedOrigins("*"); // 실제 배포시에는 제외
		// setAllowedOrigins : 동일 출처 정책에 대한 설정 (다른 출처에서 가져온 resource 공유를 제한)
		// 		출처 : http://localhost:8087  <= http://localhost:8081 등에서 요청하면 제한됨 
		// .setAllowedOrigins("*") => 출처가 동일하지 않아도 전부 승인

	}

}
