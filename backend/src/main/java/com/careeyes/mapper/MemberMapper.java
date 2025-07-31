package com.careeyes.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.careeyes.entity.Members;

@Mapper
public interface MemberMapper {

	public List<Members> selectAll(); // 요건 예시용인듯
	
	public int duplicate(Members member);
	
	public int join(Members member);
	
	public Members findById(@Param("memberId") String memberId);
	
	public void updateKakaoId(@Param("memberId") String memberId, @Param("kakaoId") Long kakaoId);
	
	public Members findByKakaoId(Long kakaoId);
	
	public List<Members> getWorkerList();
	
	public List<Members> getFilteredWorker (
		@Param("department") String department,
		@Param("company") String company,
		@Param("alertState") Integer alertState
	);
}
