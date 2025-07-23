package com.careeyes.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class Member {

	private String member_id;
	private String password;
	private String name;
	private String email;
	private String phone;
	private Role role;
	private String company;
	private String department;

}

enum Role {
	ADMIN, MEMBER; // enum은 상수로 간주되므로 대문자 권장
}
