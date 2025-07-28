package com.careeyes.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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
	
	@GetMapping("/eventlist")
	public ResponseEntity<List<DetectEvent>> getEventList(){
		return ResponseEntity.ok(eventMapper.getEventList());
	}

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
