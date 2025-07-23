package com.careeyes.controller;

import java.util.Date;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TestController {

	@GetMapping("/data")
	public String test() {
		return "연동 성공! 현재 서버시간은" + new Date() + "입니다.";
	}
}
