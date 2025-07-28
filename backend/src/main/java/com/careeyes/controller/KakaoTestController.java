package com.careeyes.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.careeyes.config.KakaoApi;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Controller
public class KakaoTestController {
	
	private final KakaoApi kakaoApi;
	
	@GetMapping("/oauth/kakao/url")
	@ResponseBody
	public String getKakaoLoginUrl() {
	    return "https://kauth.kakao.com/oauth/authorize"
	            + "?client_id=" + kakaoApi.getKakaoApiKey()
	            + "&redirect_uri=" + kakaoApi.getKakaoRedirectUri()
	            + "&response_type=code";
	}
	
}
