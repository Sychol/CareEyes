package com.careeyes.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class Members {

	private String memberId; // 아이디
	private String memberPw; // 비밀번호
	private String memberName; // 이름
	private String email; // 이메일
	private String phone; // 전화번호
	private String memberRole; // 역할 (admin, member)
	private String company; // 회사
	private String department; // 부서
	private Long kakaoId; // 카카오 아이디
	private int alertState = 1; // 알림 설정 여부, default 1
	private String subscriptionJson; // 웹 푸시 알림 Json

}
