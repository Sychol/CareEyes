package com.careeyes.Service;

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
        // 이벤트 저장 로직은 생략 (DB 저장 시 추가)
        
        List<Members> members = memberMapper.findMembersToNotify();
        
        Map<String, String> nameMap = Map.of(
                "bird", "새",
                "person", "사람",
                "car", "차량",
                "mammal", "개"
            );

        Map<String, String> unitMap = Map.of(
                "bird", "마리",
                "person", "명",
                "car", "대",
                "mammal", "마리"
            );

        Map<String, String> emojiMap = Map.of(
                "bird", "🐦",
                "person", "👤",
                "car", "🚗",
                "mammal", "🐕"
            );
        
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

        for (Members member : members) {
            try {
                solapiService.sendSMS(member.getPhone(), message);
            } catch (Exception e) {
            	System.out.println("문자 전송 실패: " + member.getPhone() + " -> " + e.getMessage());
            }
        }
    }
}
