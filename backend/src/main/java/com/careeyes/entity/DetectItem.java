package com.careeyes.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class DetectItem {

	private int itemId;
	private int eventId;
	private String itemType;
	private int itemCount;
}
