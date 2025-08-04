package com.careeyes.config;

//필요한 패키지들을 불러옵니다
import javax.crypto.Mac;              // HMAC 해시 생성을 위한 클래스
import javax.crypto.spec.SecretKeySpec; // 비밀키 생성을 위한 클래스
import java.net.HttpURLConnection;    // HTTP 요청을 위한 클래스
import java.net.URL;                  // URL 처리를 위한 클래스
import java.time.Instant;             // 시간 처리를 위한 클래스
import java.util.Base64;              // Base64 인코딩을 위한 클래스
import java.util.UUID;                // UUID 생성을 위한 클래스

public class APISignature {
 public static void main(String[] args) throws Exception {
     // API 인증에 필요한 키 정보를 설정합니다
     String apiKey = "NCSJQXQ0YWTPNT6N";      // 발급받은 API 키
     String apiSecret = "VHGM88HWTSEJTV5QDU0MEAJTIAUIF3QR"; // 발급받은 API Secret
     
     // 현재 시간을 ISO 형식으로 가져옵니다
     String date = Instant.now().toString();
     // UUID를 생성하여 salt로 사용합니다
     String salt = UUID.randomUUID().toString().replace("-", "");

     // 서명을 위한 메시지를 생성합니다
     String message = date + salt;

     // HMAC-SHA256으로 서명을 생성합니다
     Mac hmac = Mac.getInstance("HmacSHA256");
     hmac.init(new SecretKeySpec(apiSecret.getBytes(), "HmacSHA256"));
     String signature = bytesToHex(hmac.doFinal(message.getBytes()));

     // API 요청을 위한 URL을 생성합니다
     URL url = new URL("https://api.solapi.com/messages/v4/list?limit=1");
     HttpURLConnection conn = (HttpURLConnection) url.openConnection();
     conn.setRequestMethod("GET");
     // 생성된 인증 정보를 헤더에 포함시킵니다
     conn.setRequestProperty("Authorization",
         String.format("HMAC-SHA256 apiKey=%s, date=%s, salt=%s, signature=%s",
             apiKey, date, salt, signature));

     // 응답을 출력합니다
     conn.getInputStream().transferTo(System.out);
 }

 // 바이트 배열을 16진수 문자열로 변환하는 헬퍼 메서드
 static String bytesToHex(byte[] bytes) {
     StringBuilder sb = new StringBuilder();
     for (byte b : bytes) sb.append(String.format("%02x", b));
     return sb.toString();
 }
}
