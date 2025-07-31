package com.careeyes.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careeyes.entity.Members;
import com.careeyes.mapper.MemberMapper;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/member")
public class MemberController {
	
	@Autowired
	private MemberMapper memberMapper;
	
	// 회원가입
	@PostMapping("/signup")
	public ResponseEntity<?> signup(@RequestBody Members member) {
	    if (memberMapper.duplicate(member) > 0) {
	        return ResponseEntity.status(HttpStatus.CONFLICT)
	            .body(Map.of("success", false, "message", "중복된 ID, 이메일 또는 전화번호입니다."));
	    }

	    memberMapper.signIn(member);
	    return ResponseEntity.ok(Map.of("success", true));
	}
	
	// 로그인
	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody Map<String, String> request, HttpSession session){
		String memberId = request.get("memberId"); 
		String memberPw = request.get("memberPw");
		
		Members member = memberMapper.findById(memberId);
		if (member == null || member.getMemberPw() == null ||!member.getMemberPw().equals(memberPw)){
			// id가 null이거나 비밀번호가 DB와 일치하지 않으면
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("message", "ID 또는 비밀번호가 일치하지 않습니다."));
		} // 에러 메시지 + 401 보내기
		
		session.setAttribute("loginMember", member);
		
		return ResponseEntity.ok(Map.of(
				"memberId", member.getMemberId(),
				"memberRole", member.getMemberRole(),
				"memberName", member.getMemberName()
				));
		// 로그인 성공하면 id / role 전달
	}
	
//	@PostMapping("/login")
//	public ResponseEntity<?> login(@RequestBody Map<String, String> request){
//	    String memberId = request.get("memberId");
//	    String memberPw = request.get("memberPw");
//
//	    Members member = memberMapper.findById(memberId);
//
//	    if (member == null) {
//	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
//	                .body(Map.of("message", "존재하지 않는 아이디입니다."));
//	    }
//
//	    if (!member.getMemberPw().equals(memberPw)) {
//	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
//	                .body(Map.of("message", "비밀번호가 일치하지 않습니다."));
//	    }
//
//	    return ResponseEntity.ok(Map.of(
//	            "memberId", member.getMemberId(),
//	            "memberRole", member.getMemberRole()
//	    ));
//	}
	
	// 중복검사
	@PostMapping("/duplicate")
    public int checkDuplicate(@RequestBody Members member) {
        return memberMapper.duplicate(member); // 0이면 중복 없음, 1 이상이면 중복
    }
	
	// 로그아웃
	@PostMapping("/logout")
	public ResponseEntity<?> logout(HttpSession session){
		session.invalidate(); // 현재 사용자 세션 제거
		return ResponseEntity.ok(Map.of("message", "로그아웃 되었습니다."));
	}
	
	// 카카오 계정 연동
	@PostMapping("/account/link-kakao")
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
	
	@GetMapping("/workerlist")
	public ResponseEntity<List<Members>> getWorkerList() {
	    return ResponseEntity.ok(memberMapper.getWorkerList());
	}
}
