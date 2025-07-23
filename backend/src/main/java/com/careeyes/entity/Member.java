package com.careeyes.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class Member {

	private String memberId;
	private String password;
	private String name;
	private String email;
	private String phone;
	private String role;
	private String company;
	private String department;
	private int alertState = 1; // default 1

}
