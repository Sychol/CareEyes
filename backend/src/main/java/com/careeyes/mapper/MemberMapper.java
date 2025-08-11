package com.careeyes.mapper;

import java.sql.Timestamp;
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
	
	public void disconnectKakao(String memberId);
	
	public List<Members> getWorkerList();
	
	public void pauseAlert(@Param("memberId") String memberId,
            	@Param("alertState") int alertState,
            	@Param("expireTime") Timestamp expireTime);
	
	public void pauseAlertForever(@Param("memberId") String memberId,
        	@Param("alertState") int alertState);
	
	public void resumeAlert(@Param("memberId") String memberId,
            	@Param("alertState") int alertState);
	
	public List<String> findRestorables();
	
	public void updateAlertState(@Param("memberId") String memberId, @Param("alertState") int alertState);
	
	public List<Members> findMembersToNotify();

}
