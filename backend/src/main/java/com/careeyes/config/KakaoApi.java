package com.careeyes.config;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class KakaoApi {
	
    private final String kakaoApiKey;
    private final String kakaoRedirectUri;

    public KakaoApi(
        @Value("${kakao.api_key}") String kakaoApiKey,
        @Value("${kakao.redirect_uri}") String kakaoRedirectUri
    ) {
        this.kakaoApiKey = kakaoApiKey;
        this.kakaoRedirectUri = kakaoRedirectUri;
    }

    public String getKakaoApiKey() {
        return kakaoApiKey;
    }

    public String getKakaoRedirectUri() {
        return kakaoRedirectUri;
    }
    
	public String getAccessToken(String code) {
		String accessToken = "";
		String refreshToken = "";
		String reqUrl = "https://kauth.kakao.com/oauth/token";
		
		try {
			URL url = new URL(reqUrl);
			HttpURLConnection conn = (HttpURLConnection) url.openConnection();
			
			// 필수 헤더 세팅
			conn.setRequestProperty("Content-type", "application/x-www-form-urlencoded;charset=utf-8");
			conn.setDoOutput(true); // OutputStream으로 POST 데이터 넘겨주기
			
			// 문자열 저장 후 출력
			BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(conn.getOutputStream()));
			
			// 문자열 연결
			StringBuilder sb = new StringBuilder();
			
			
			// 필수 쿼리 파라미터 세팅
	        sb.append("grant_type=authorization_code");
	        sb.append("&client_id=").append(kakaoApiKey);
	        sb.append("&redirect_uri=").append(kakaoRedirectUri);
	        sb.append("&code=").append(code);
	        
	        bw.write(sb.toString());
	        bw.flush();
	        
	        // HTTP 상태 코드 저장 (ex. 200 OK / 404 Not Found)
	        int responseCode = conn.getResponseCode();
	        log.info("[KakaoApi.getAccessToken] responseCode = {}", responseCode);
	        
	        BufferedReader br;
	        // 200대면 성공으로 간주
	        if (responseCode >= 200 && responseCode < 300) {
	            br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
	        // 그 외 (400, 500) -> 오류로 간주
	        } else {
	            br = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
	        }
	        
	        String line = ""; // 한 줄씩 읽을 임시 변수
	        StringBuilder responseSb = new StringBuilder(); // 응답 내용을 효율적으로 모으기 위한 객체
	        // 한 줄씩 읽기 -> null이 아닐 때까지만
	        while((line = br.readLine()) != null){
	        	// 읽은 줄을 sb에 추가
	            responseSb.append(line);
	        }
	        // 다 읽은 거 String으로 변환해서 result에 넣기
	        String result = responseSb.toString();
	        log.info("responseBody = {}", result);
	        
	        // Json 문자열 파싱해서 element로 변환
	        JsonElement element = JsonParser.parseString(result);
	        // Json을 객체 형식으로 바꿔서 -> accessToken 꺼내기 -> 문자열로 변환
	        accessToken = element.getAsJsonObject().get("access_token").getAsString();
	        refreshToken = element.getAsJsonObject().get("refresh_token").getAsString();
	        
	        br.close();
	        bw.close();
	        
		} catch (Exception e){
	        e.printStackTrace();
	    }
		
	    return accessToken;
	}

	public HashMap<String, Object> getUserInfo(String accessToken) {
	    HashMap<String, Object> userInfo = new HashMap<>();
	    
	    // 카카오 사용자 정보 조회 API
	    String reqUrl = "https://kapi.kakao.com/v2/user/me";
	    
	    try{ // 카카오 서버와 연결
	        URL url = new URL(reqUrl);
	        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
	        conn.setRequestMethod("POST"); // POST 방식
	        conn.setRequestProperty("Authorization", "Bearer " + accessToken); // HTTP Header에 Token 달기
	        conn.setRequestProperty("Content-type", "application/x-www-form-urlencoded;charset=utf-8");
	        
	        // HTTP 상태 코드 저장 (ex. 200 OK / 404 Not Found)
	        int responseCode = conn.getResponseCode();
	        log.info("[KakaoApi.getUserInfo] responseCode : {}",  responseCode);
	        
	        BufferedReader br;
	        if (responseCode >= 200 && responseCode <= 300) {
	            br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
	        } else {
	            br = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
	        }
	        
	        String line = "";
	        StringBuilder responseSb = new StringBuilder();
	        while((line = br.readLine()) != null){
	            responseSb.append(line);
	        }
	        String result = responseSb.toString();
	        log.info("responseBody = {}", result);
	        
	        JsonElement element = JsonParser.parseString(result);
	        
	        JsonObject properties = element.getAsJsonObject().get("properties").getAsJsonObject();
	        JsonObject kakaoAccount = element.getAsJsonObject().get("kakao_account").getAsJsonObject();
	        
	        String nickname = properties.getAsJsonObject().get("nickname").getAsString();
	        String email = kakaoAccount.getAsJsonObject().get("email").getAsString();
	        
	        userInfo.put("nickname", nickname);
	        userInfo.put("email", email);

	        br.close();
	        
	    } catch (Exception e){
	        e.printStackTrace();
	 }
	    return userInfo;
	
}
}
