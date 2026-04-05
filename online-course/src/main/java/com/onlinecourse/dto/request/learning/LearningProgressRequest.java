package com.onlinecourse.dto.request.learning;

import com.onlinecourse.entity.enums.LearningStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LearningProgressRequest {

    @NotNull(message = "lastWatchedSecond không được để trống")
    @Min(value = 0, message = "lastWatchedSecond phải >= 0")
    private Integer lastWatchedSecond;

    @NotNull(message = "Trạng thái không được để trống")
    private LearningStatus status;
}
