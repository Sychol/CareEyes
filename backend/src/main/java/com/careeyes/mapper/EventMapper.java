package com.careeyes.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.careeyes.entity.DetectEvent;

@Mapper
public interface EventMapper {
	
	// 알림 내역 가져오기
	List<DetectEvent> getEventList();
	
	// 이상물체 작업 상태 변경
	void updateManageState(@Param("eventId") int eventId, @Param("manage") int manage);
	
	// 안 씀. 
	List<DetectEvent> getFilteredEvent(
		@Param("type") String type,
		@Param("from") String from,
		@Param("to") String to,
		@Param("manage") Integer manage
		
	);
	
}
