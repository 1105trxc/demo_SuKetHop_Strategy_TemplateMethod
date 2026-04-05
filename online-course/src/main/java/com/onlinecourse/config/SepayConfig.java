package com.onlinecourse.config;

import lombok.Getter;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class SepayConfig implements InitializingBean {

    @Value("${sepay.bank-id}")
    private String bankId;

    @Value("${sepay.acc-number}")
    private String accNumber;

    @Value("${sepay.api-token}")
    private String apiToken;

    @Override
    public void afterPropertiesSet() throws Exception {
        bankId = normalize(bankId);
        accNumber = normalize(accNumber);
        apiToken = normalize(apiToken);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}
