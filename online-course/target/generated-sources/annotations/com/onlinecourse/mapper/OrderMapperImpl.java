package com.onlinecourse.mapper;

import com.onlinecourse.dto.request.order.OrderCreateRequest;
import com.onlinecourse.dto.response.order.OrderResponse;
import com.onlinecourse.entity.Order;
import com.onlinecourse.entity.enums.OrderStatus;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-05T08:25:02+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 23 (Oracle Corporation)"
)
@Component
public class OrderMapperImpl implements OrderMapper {

    @Override
    public Order toOrder(OrderCreateRequest request) {
        if ( request == null ) {
            return null;
        }

        Order.OrderBuilder order = Order.builder();

        order.paymentMethod( request.getPaymentMethod() );

        order.status( OrderStatus.PENDING );

        return order.build();
    }

    @Override
    public OrderResponse toOrderResponse(Order order) {
        if ( order == null ) {
            return null;
        }

        OrderResponse orderResponse = new OrderResponse();

        orderResponse.setId( order.getId() );
        orderResponse.setTotalPrice( order.getTotalPrice() );
        orderResponse.setFinalPrice( order.getFinalPrice() );
        orderResponse.setStatus( order.getStatus() );
        orderResponse.setPaymentMethod( order.getPaymentMethod() );

        return orderResponse;
    }
}
