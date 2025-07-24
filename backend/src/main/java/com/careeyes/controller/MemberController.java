package com.careeyes.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.careeyes.entity.Member;
import com.careeyes.mapper.MemberMapper;

import jakarta.servlet.http.HttpSession;

public class MemberController {
	
	@Autowired
	private MemberMapper memberMapper;
	
	// 회원가입
	@PostMapping("/register")
	public String register(@RequestBody Member member) {
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
		String password = request.get("password");
		
		Member member = memberMapper.findById(id);
		if (member == null || !member.getPassword().equals(password)){
			// id가 null이거나 비밀번호가 DB와 일치하지 않으면
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("message", "ID 또는 비밀번호가 일치하지 않습니다."));
		} // 에러 메시지 + 401 보내기
		return ResponseEntity.ok(Map.of(
				"id", member.getMemberId(),
				"role", member.getRole()
				));
		// 로그인 성공하면 id / role 전달
	}
	
	// 로그아웃
	@PostMapping("/logout")
	public ResponseEntity<?> logout(HttpSession session){
		session.invalidate(); // 현재 사용자 세션 제거
		return ResponseEntity.ok(Map.of("message", "로그아웃 되었습니다."));
	}
}
