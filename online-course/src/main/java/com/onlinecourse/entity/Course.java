package com.onlinecourse.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.onlinecourse.entity.base.BaseEntity;
import com.onlinecourse.entity.enums.CourseStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "courses")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Course extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private User instructor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    @JsonIgnoreProperties("courses")
    private Category category;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "thumbnail_url", nullable = false, length = 500)
    private String thumbnailUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private CourseStatus status = CourseStatus.DRAFT;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @JsonIgnore
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Chapter> chapters = new ArrayList<>();

    public void addChapter(Chapter chapter) {
        chapters.add(chapter);
        chapter.setCourse(this);
    }

    public void removeChapter(Chapter chapter) {
        chapters.remove(chapter);
        chapter.setCourse(null);
    }
}