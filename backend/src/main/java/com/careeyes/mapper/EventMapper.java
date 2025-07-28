package com.careeyes.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.careeyes.entity.DetectEvent;

@Mapper
public interface EventMapper {
	
	List<DetectEvent> getEventList();
	
	List<DetectEvent> getFilteredEvent(
		@Param("type") String type,
		@Param("from") String from,
		@Param("to") String to,
		@Param("manage") Integer manage
		
	);
	
}
