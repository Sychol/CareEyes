package com.careeyes.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class Cctv {
	
	private int cctv_id;
	private String location;
	private int activate;

}
