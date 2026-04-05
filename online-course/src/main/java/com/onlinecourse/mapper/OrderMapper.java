package com.onlinecourse.mapper;

import com.onlinecourse.dto.request.order.OrderCreateRequest;
import com.onlinecourse.dto.response.order.OrderResponse;
import com.onlinecourse.entity.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderMapper {
    
    @Mapping(target = "id",         ignore = true)
    @Mapping(target = "status",     constant = "PENDING")
    @Mapping(target = "totalPrice", ignore = true)
    @Mapping(target = "finalPrice", ignore = true)
    @Mapping(target = "orderItems", ignore = true)
    @Mapping(target = "user",       ignore = true)
    @Mapping(target = "coupon",     ignore = true)
    Order toOrder(OrderCreateRequest request);
    
    @Mapping(target = "paymentUrl", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "items", ignore = true)
    OrderResponse toOrderResponse(Order order);
}
