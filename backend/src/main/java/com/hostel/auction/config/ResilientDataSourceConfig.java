package com.hostel.auction.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.sql.Connection;

@Configuration
@Slf4j
public class ResilientDataSourceConfig {

    @Value("${spring.datasource.url}")
    private String primaryUrl;

    @Value("${spring.datasource.username:root}")
    private String primaryUsername;

    @Value("${spring.datasource.password:}")
    private String primaryPassword;

    @Value("${spring.datasource.driver-class-name:com.mysql.cj.jdbc.Driver}")
    private String primaryDriver;

    @Bean
    @Primary
    public DataSource dataSource() {
        if (primaryUrl != null && primaryUrl.startsWith("jdbc:h2:")) {
            log.info("Direct H2 JDBC URL specified. Initializing embedded database...");
            return createH2DataSource();
        }

        log.info("Attempting connection to primary database: {}", sanitizeUrl(primaryUrl));
        try {
            HikariConfig mysqlConfig = new HikariConfig();
            mysqlConfig.setJdbcUrl(primaryUrl);
            mysqlConfig.setUsername(primaryUsername);
            mysqlConfig.setPassword(primaryPassword);
            mysqlConfig.setDriverClassName(primaryDriver);
            mysqlConfig.setMaximumPoolSize(10);
            mysqlConfig.setMinimumIdle(2);
            // Fail fast within 4 seconds if database is offline, unreachable, or DNS fails
            mysqlConfig.setInitializationFailTimeout(4000);
            mysqlConfig.setConnectionTimeout(5000);

            HikariDataSource mysqlDs = new HikariDataSource(mysqlConfig);
            try (Connection conn = mysqlDs.getConnection()) {
                log.info("Successfully connected to MySQL database: {}", conn.getMetaData().getDatabaseProductName());
                return mysqlDs;
            }
        } catch (Throwable t) {
            log.warn("================================================================================");
            log.warn("WARNING: Primary database is unreachable! (Reason: {})", t.getMessage());
            log.warn("ACTIVATING AUTOMATIC FALLBACK TO EMBEDDED H2 DATABASE (MySQL Compatible Mode)");
            log.warn("The application will start up normally with all functionalities working!");
            log.warn("================================================================================");
            return createH2DataSource();
        }
    }

    private DataSource createH2DataSource() {
        HikariConfig h2Config = new HikariConfig();
        h2Config.setJdbcUrl("jdbc:h2:mem:hostel_auction_db;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1;NON_KEYWORDS=YEAR,USER");
        h2Config.setUsername("sa");
        h2Config.setPassword("");
        h2Config.setDriverClassName("org.h2.Driver");
        h2Config.setMaximumPoolSize(10);
        return new HikariDataSource(h2Config);
    }

    private String sanitizeUrl(String url) {
        if (url == null) return "null";
        return url.replaceAll("(?i)(password=)[^&]*", "$1***");
    }
}
