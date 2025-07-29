package com.careeyes.entity;

import java.sql.Time;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class DetectEvent {

    private int eventId;
    private String eventDate;
    private Time eventTime;
    private int cctvId;
    private String imgPath;
    private int manage;
    
    private Map<String, Integer> objects;
    private String location;
    private String itemType;
    private int itemCount;
    
}