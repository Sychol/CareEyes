package com.careeyes.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.careeyes.entity.Members;
import com.careeyes.mapper.MemberMapper;

import jakarta.servlet.http.HttpSession;

public class MemberController {
	
	@Autowired
	private MemberMapper memberMapper;
	
	// 회원가입
	@PostMapping("/register")
	public String register(@RequestBody Members member) {
		if (memberMapper.duplicate(member) > 0) {
			return "중복된 ID, 이메일 또는 전화번호입니다";
		}
		
		memberMapper.signIn(member);
		return "회원가입 성공";
	}
	
	// 로그인
	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody Map<String, String> request){
		String id = request.get("id"); 
		String pw = request.get("pw");
		
		Members member = memberMapper.findById(id);
		if (member == null || !member.getPw().equals(pw)){
			// id가 null이거나 비밀번호가 DB와 일치하지 않으면
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("message", "ID 또는 비밀번호가 일치하지 않습니다."));
		} // 에러 메시지 + 401 보내기
		return ResponseEntity.ok(Map.of(
				"id", member.getMemberId(),
				"role", member.getMemberRole()
				));
		// 로그인 성공하면 id / role 전달
	}
	
	// 로그아웃
	@PostMapping("/logout")
	public ResponseEntity<?> logout(HttpSession session){
		session.invalidate(); // 현재 사용자 세션 제거
		return ResponseEntity.ok(Map.of("message", "로그아웃 되었습니다."));
	}
	
	// 카카오 계정 연동
	@PostMapping("/api/account/link-kakao")
	public ResponseEntity<?> linkKakao(@RequestBody Map<String, Object> body, HttpSession session) {
	    // 로그인된 사용자 가져오기
	    Members loginMember = (Members) session.getAttribute("loginMember");
	    if (loginMember == null) {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 필요");
	    }
	    
	    // 카카오 아이디 받아오기
	    Long kakaoId = Long.valueOf(body.get("kakaoId").toString());
	    
	    // 이미 다른 회원이 해당 kakaoId로 연동한 경우 방지
	    Members existing = memberMapper.findByKakaoId(kakaoId);
	    if (existing != null && !existing.getMemberId().equals(loginMember.getMemberId())) {
	        return ResponseEntity.status(HttpStatus.CONFLICT).body("이미 다른 계정과 연동된 카카오 ID입니다.");
	    }

	    // 연동 처리
	    memberMapper.updateKakaoId(loginMember.getMemberId(), kakaoId);
	    return ResponseEntity.ok("카카오 계정 연동 완료");
	}
}
