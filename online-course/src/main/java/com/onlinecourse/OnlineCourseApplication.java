package com.onlinecourse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class OnlineCourseApplication {

    public static void main(String[] args) {
        SpringApplication.run(OnlineCourseApplication.class, args);
        System.out.println("🚀 Hệ thống Online Course Backend đã khởi chạy thành công tại http://localhost:8080 !");
    }

}