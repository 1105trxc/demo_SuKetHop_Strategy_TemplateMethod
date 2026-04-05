package com.onlinecourse.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "lessons")
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable = false)
    private Chapter chapter;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "video_url", nullable = false, length = 500)
    private String videoUrl;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Column(name = "is_free_preview", nullable = false)
    @Builder.Default
    private Boolean isFreePreview = false;
}
