package com.careeyes.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.careeyes.entity.DetectEvent;
import com.careeyes.entity.Members;
import com.careeyes.mapper.MemberMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EventService {

    private final MemberMapper memberMapper;
    private final SolapiService solapiService;

    public void processDetection(DetectEvent event) {
        System.out.println("📥 감지 이벤트 수신됨");
        System.out.println("📅 날짜: " + event.getEventDate());
        System.out.println("🕒 시간: " + event.getEventTime());
        System.out.println("📷 CCTV ID: " + event.getCctvId());
        System.out.println("🧾 감지된 객체: " + event.getObjects());
        
        List<Members> members = memberMapper.findMembersToNotify();
        System.out.println("📇 알림 대상자 수: " + members.size());
        
        Map<String, String> nameMap = Map.of("bird", "새", "person", "사람", "vehicle", "차량", "mammal", "개");
        Map<String, String> unitMap = Map.of("bird", "마리", "person", "명", "vehicle", "대", "mammal", "마리");
        Map<String, String> emojiMap = Map.of("bird", "🐦", "person", "👤", "vehicle", "🚗", "mammal", "🐕");

        
        StringBuilder objectSummary = new StringBuilder();
        int totalCount = 0;


        for (Map.Entry<String, Integer> entry : event.getObjects().entrySet()) {
            String key = entry.getKey();
            int count = entry.getValue();
            totalCount += count;

            String emoji = emojiMap.getOrDefault(key, "🔸");
            String name = nameMap.getOrDefault(key, key);
            String unit = unitMap.getOrDefault(key, "개");

            objectSummary.append(String.format("%s %s %d%s, ", emoji, name, count, unit));
        }
		
		// 마지막 쉼표 제거
		if (objectSummary.length() > 0) {
		    objectSummary.setLength(objectSummary.length() - 2);
		}
		
		String message = String.format(
			    "[경고] 활주로에 이상 객체 %d개 감지!\n" +
			    "📍 CCTV ID: %d\n" +
			    "🕒 시간: %s %s\n" +
			    "🔍 객체 내역: %s",
			    totalCount,
			    event.getCctvId(),
			    event.getEventDate(),
			    event.getEventTime(),
			    objectSummary.toString()
			);
		
	    System.out.println("📨 전송할 메시지:\n" + message);
		
	    List<String> phoneList = members.stream()
	            .map(Members::getPhone)
	            .toList();
	    
	    System.out.println("📤 전송 대상 번호 목록: " + phoneList);

        try {
                solapiService.sendBulkSMS(phoneList, message);
        } catch (Exception e) {
                System.err.println("❌ 문자 다중 전송 실패: " + e.getMessage());
                e.printStackTrace();
        }
    }
}
