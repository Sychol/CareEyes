package com.careeyes.service;

import jakarta.annotation.PostConstruct;
import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.service.DefaultMessageService;

import java.util.List;
import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SolapiService {

    @Value("${solapi.apiKey}")
    private String apiKey;

    @Value("${solapi.apiSecret}")
    private String apiSecret;

    private DefaultMessageService messageService;
    
    @PostConstruct
    public void init() {
        // Solapi SDK 초기화
        this.messageService = NurigoApp.INSTANCE.initialize(
                apiKey,
                apiSecret,
                "https://api.solapi.com"
        );
    }

    public void sendSMS(String to, String text) {
        Message message = new Message();
        message.setFrom("01034583625"); // 인증된 발신번호
        message.setTo(to);              // 수신번호
        message.setText(text);          // 문자 내용

        try {
            messageService.send(message);
            System.out.println("✅ 문자 전송 성공: " + to);
        } catch (Exception e) {
            System.err.println("❌ 문자 전송 실패: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    public void sendBulkSMS(List<String> phoneNumbers, String text) {
        List<Message> messages = new ArrayList<>();

        for (String to : phoneNumbers) {
            Message message = new Message();
            message.setFrom("01034583625"); // 발신번호
            message.setTo(to);
            message.setText(text);
            messages.add(message);
        }

        try {
            messageService.send(messages);  // <-- 핵심!
            System.out.println("✅ 다중 문자 전송 성공 (" + messages.size() + "건)");
        } catch (Exception e) {
            System.err.println("❌ 다중 문자 전송 실패: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
