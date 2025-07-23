package com.careeyes.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.careeyes.entity.Member;

@Mapper
public interface MemberMapper {

	public List<Member> selectAll();
}
