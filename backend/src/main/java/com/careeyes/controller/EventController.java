package com.careeyes.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.careeyes.entity.DetectEvent;
import com.careeyes.mapper.EventMapper;

@RestController
@RequestMapping("/api")
public class EventController {

	@Autowired
	private EventMapper eventMapper;
	
	// 알림 내역 가져오기
	@GetMapping("/eventlist")
	public ResponseEntity<List<DetectEvent>> getEventList(){
		return ResponseEntity.ok(eventMapper.getEventList());
	}
	
	// 이상물체 작업 상태 변경
	@PatchMapping("/api/event/{eventId}/status")
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
	
	// 현재 사용 안 하는 코드 . . .
	@GetMapping("/filteredeventlist")
	public List<DetectEvent> getAlertHistory(
			@RequestParam(required = false) String type,
			@RequestParam(required = false) String from,
			@RequestParam(required = false) String to,
			@RequestParam(required = false) Integer manage
)   {
		return eventMapper.getFilteredEvent(type, from, to, manage);
	}
}
