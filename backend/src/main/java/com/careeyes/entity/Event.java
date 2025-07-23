package com.careeyes.entity;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class Event {

    private int event_id;
    private LocalDateTime event_time;
    private int cctv_id;
    private String img_path;
    private int manage;
    
}