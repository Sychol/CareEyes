package com.careeyes.entity;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class Event {

    private int event_id;
    private String date;
    private String time;
    private int cctv_id;
    private String img_path;
    private int manage;
    private Map<String, Integer> objects;
    
}