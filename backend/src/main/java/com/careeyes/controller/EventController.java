package com.careeyes.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careeyes.entity.Cctv;
import com.careeyes.entity.DetectEvent;
import com.careeyes.mapper.EventMapper;
import com.careeyes.service.EventService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class EventController {

	@Autowired
	private EventMapper eventMapper;
	
	private final EventService eventService;
	
	// 알림 문자 메시지 보내기
    @PostMapping("/sendalert")
    public ResponseEntity<String> receiveDetection(@RequestBody DetectEvent event) {
        eventService.processDetection(event);
        return ResponseEntity.ok("이상 객체 알림 전송 완료");
    }
	
	// 알림 내역 가져오기
	@GetMapping("/eventlist")
	public ResponseEntity<List<DetectEvent>> getEventList(){
		return ResponseEntity.ok(eventMapper.getEventList());
	}
	
	// CCTV 목록 가져오기
	@GetMapping("/cctvlist")
	public ResponseEntity<List<Cctv>> getCctvList(){
		return ResponseEntity.ok(eventMapper.getCctvList());
	}
	
	// 이상물체 작업 상태 변경
	@PatchMapping("/event/{eventId}/status")
	public ResponseEntity<?> updateEventStatus(
	        @PathVariable("eventId") int eventId,
	        @RequestBody Map<String, Integer> body
	) {
	    Integer manage = body.get("status");
	    if (manage == null || manage < 0 || manage > 2) {
	        return ResponseEntity.badRequest().body("유효하지 않은 상태값입니다.");
	    }

	    eventMapper.updateManageState(eventId, manage);
	    return ResponseEntity.ok("상태가 성공적으로 변경되었습니다.");
	}
	
	

}
