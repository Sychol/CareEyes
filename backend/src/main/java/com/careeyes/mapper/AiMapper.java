package com.careeyes.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.careeyes.entity.DetectItem;
import com.careeyes.entity.DetectEvent;

@Mapper
public interface AiMapper {

	public int insertDetectEvent(DetectEvent event);
	public int insertDetectItem(DetectItem detect);
	
}
