package com.careeyes.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.careeyes.entity.Member;
import com.careeyes.mapper.MemberMapper;

public class MemberController {
	
	@Autowired
	private MemberMapper memberMapper;
	
	@PostMapping("/register")
	public String register(@RequestBody Member member) {
		if (memberMapper.duplicate(member) > 0) {
			return "중복된 ID, 이메일 또는 전화번호입니다";
		}
		
		memberMapper.signIn(member);
		return "회원가입 성공";
	}
	

}
