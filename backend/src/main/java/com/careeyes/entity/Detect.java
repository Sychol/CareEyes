package com.careeyes.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class Detect {

	private int detect_id;
	private int event_id;
	private String type;
	private int count;
}
