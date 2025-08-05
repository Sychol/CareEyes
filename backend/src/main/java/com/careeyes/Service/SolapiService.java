package com.careeyes.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class SolapiService {

    @Value("${solapi.apiKey}")
    private String apiKey;

    @Value("${solapi.apiSecret}")
    private String apiSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendSMS(String to, String text) throws Exception {
        String url = "https://api.solapi.com/messages/v4/send-many";

        String salt = UUID.randomUUID().toString(); // 요청마다 다른 UUID 생성 (보안용)
        String date = String.valueOf(System.currentTimeMillis());

        Map<String, Object> message = new HashMap<>();
        message.put("to", to);
        message.put("from", "01034583625"); // 등록된 발신번호로 교체
        message.put("text", text);
        message.put("type", "SMS");

        Map<String, Object> bodyMap = new HashMap<>();
        bodyMap.put("messages", List.of(message));

        ObjectMapper objectMapper = new ObjectMapper();
        String bodyJson = objectMapper.writeValueAsString(bodyMap);

        String signature = makeSignature("POST", "/messages/v4/send-many", date, salt, apiSecret);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", String.format(
                "HMAC-SHA256 apiKey=%s, date=%s, salt=%s, signature=%s",
                apiKey, date, salt, signature));

        HttpEntity<String> request = new HttpEntity<>(bodyJson, headers);

        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("문자 전송 실패: " + response.getBody());
        }
    }
    
    // SOLAPI -> 각 요청마다 HMAC-SHA256 서명 요구 -> 그거 만드는 메서드
    private String makeSignature(String method, String url, String date, String salt, String secret) throws Exception {
        String message = method + " " + url + "\n" + date + salt;

        Mac hasher = Mac.getInstance("HmacSHA256");
        hasher.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = hasher.doFinal(message.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(hash);
    }
}
