package com.careeyes.controller;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import jakarta.websocket.server.ServerEndpoint;

@Controller
@ServerEndpoint("/websocket") // 웹소켓 사용 시, 요청하면 소켓으로 들어올 url매핑값
public class WebSocketHandler extends TextWebSocketHandler {
	
	private Logger logger = LoggerFactory.getLogger(getClass());
	
	// 소켓을 통해 접속한 사용자들에 대한 정보를 저장할 자료구조 생성
	private static ConcurrentHashMap<String, WebSocketSession> clients = new ConcurrentHashMap<>(); 
	
	// 선형 구조 : 일렬로 저장되는 구조
	// 비선형 구조 : 계층적 특징을 나타내는 구조. Tree, map
	
	// MAP : (key, value)로 구성된 자료구조
	// 		*key는 중복이 되면 안 됨
	// ConcurrentHashMap : 멀티스레드 환경에 특화되어 있는 자료구조
	// 		- 멀티 스레드 : 한 컴퓨터에서 동시에 여러개의 프로그램(어플, 프로세스) 실행 (다중작업)
	
	// 상속받은 기능들을 원하는 형식으로 변경해서 사용(오버라이드)
	// session : 기존에 사용하던 세션(HttpSession)과는 다른 세션
	// 	-> client의 고유 세션 키값을 받아옴
	
	// 1. 웹 소켓이 열렸을 때, 실행되는 메서드
	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		logger.info("connection 로그 >> " + session);
		// 웹 소켓이 연결되면 들어온 사용자를 Clients 자료구조에 추가
		clients.put(session.getId(), session);
		// 소켓에 제대로 접속완료가 되었다면, 사용자에게 데이터 전송
		// 데이터 전송방법 : 접속한 사용자 본인에게 메세지 보네기
		session.sendMessage(new TextMessage("success"));
	}

	// 2. 웹 소켓이 텍스트 데이터를 전달받았을 때, 실행되는 메서드
	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
		logger.info("handle 로그 >> " + session);
		// payLoad : 전송되는 데이터
		logger.info("message 확인 >> " + message.getPayload());
		// 메세지를 보낸 사람을 제외하고 나머지 인원들에게 메세지 전송
		// java 람다식 구조 -> 매서드(함수)를 간략하게 생성
		// entrySet : map구조에서 모든 key-value쌍을 가져와서 한 쌍으로 이뤄진 객체 반환
		clients.entrySet().forEach(data -> {
			logger.info("받아온 데이터 >> {}" + data);
			if(!data.getValue().getId().equals(session.getId())) {
				// 받아온 데이터의 id값과 웹 소켓의 id가 동일하지 않다면
				// -> 작성자가 아닌 경우, 데이터 전송
				try {
					data.getValue().sendMessage(message);
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		});
	}

	// 3. 웹 소켓이 닫혔을 때, 실행되는 메서드
	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		logger.info("close 로그 >> " + session);
		// 사용자의 모든 정보가 들어있는 clients 자료구조에서 해당 사용자 삭제
		clients.remove(session.getId());
	}

	
}
