package com.careeyes.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careeyes.entity.DetectItem;
import com.careeyes.entity.DetectEvent;
import com.careeyes.mapper.AiMapper;

@RestController
@RequestMapping("/api/ai")
public class AiController {

	@Autowired
	private AiMapper aiMapper;
	
	@PostMapping("/detect")
	public ResponseEntity<String> detect(@RequestBody DetectEvent event) {
		System.out.println(event);
		
		aiMapper.insertDetectEvent(event);
		int savedEventId = event.getEventId(); // 자동생성된 event_id
		
		// Detect 객체 생성 및 저장
	    for (Map.Entry<String, Integer> entry : event.getObjects().entrySet()) {
	        DetectItem detect = new DetectItem();
	        detect.setEventId(savedEventId);  // 이제 정확하게 설정 가능!
	        detect.setItemType(entry.getKey());
	        detect.setItemCount(entry.getValue());

	        aiMapper.insertDetectItem(detect);  // DB 저장
	    }
		
		return ResponseEntity.ok("이벤트 + 탐지 결과 저장 완료!");
	}
	
}
