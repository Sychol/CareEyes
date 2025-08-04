package com.careeyes.scheduler;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.careeyes.mapper.MemberMapper;

@Component
public class AlertScheduler {
	
    @Autowired
    private MemberMapper memberMapper;

    @Scheduled(fixedRate = 60000) // 1분마다 실행
    public void findRestorables() {
        List<String> memberIds = memberMapper.findRestorables();
        for (String memberId : memberIds) {
            memberMapper.updateAlertState(memberId, 1); // 다시 알림 ON
        }
    }
}
