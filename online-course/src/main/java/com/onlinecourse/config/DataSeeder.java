package com.onlinecourse.config;

import com.onlinecourse.entity.Role;
import com.onlinecourse.entity.User;
import com.onlinecourse.entity.enums.RoleType;
import com.onlinecourse.entity.enums.UserStatus;
import com.onlinecourse.repository.RoleRepository;
import com.onlinecourse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;



@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.onlinecourse.repository.CategoryRepository categoryRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking and seeding default data...");

        // Fix constraint PostgreSQL for new Enums
        try {
            jdbcTemplate.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check");
            log.info("Dropped orders_payment_method_check constraint to allow SEPAY.");
        } catch (Exception e) {
            log.warn("Could not drop constraint (might not exist): {}", e.getMessage());
        }

        // Seed Roles
        for (RoleType roleType : RoleType.values()) {
            if (roleRepository.findByName(roleType).isEmpty()) {
                Role role = new Role();
                role.setName(roleType);
                roleRepository.save(role);
                log.info("Seeded Role: {}", roleType.name());
            }
        }

        // Seed Admin User
        if (userRepository.findByEmail("admin@ute-learn.com").isEmpty()) {
            Role adminRole = roleRepository.findByName(RoleType.ROLE_ADMIN).orElseThrow();
            
            User admin = User.builder()
                    .email("admin@ute-learn.com")
                    .passwordHash(passwordEncoder.encode("123456"))
                    .fullName("System Administrator")
                    .status(UserStatus.ACTIVE)
                    .build();
            admin.addRole(adminRole);
            userRepository.save(admin);
            log.info("Seeded Admin User: admin@ute-learn.com / 123456");
        }

        // Seed Sample Instructor
        if (userRepository.findByEmail("instructor@ute-learn.com").isEmpty()) {
            Role instructorRole = roleRepository.findByName(RoleType.ROLE_INSTRUCTOR).orElseThrow();
            
            User instructor = User.builder()
                    .email("instructor@ute-learn.com")
                    .passwordHash(passwordEncoder.encode("123456"))
                    .fullName("Sample Instructor")
                    .status(UserStatus.ACTIVE)
                    .build();
            instructor.addRole(instructorRole);
            userRepository.save(instructor);
            log.info("Seeded Sample Instructor: instructor@ute-learn.com / 123456");
        }

        // Seed Sample Student
        if (userRepository.findByEmail("student@ute-learn.com").isEmpty()) {
            Role studentRole = roleRepository.findByName(RoleType.ROLE_STUDENT).orElseThrow();
            
            User student = User.builder()
                    .email("student@ute-learn.com")
                    .passwordHash(passwordEncoder.encode("123456"))
                    .fullName("Sample Student")
                    .status(UserStatus.ACTIVE)
                    .build();
            student.addRole(studentRole);
            userRepository.save(student);
            log.info("Seeded Sample Student: student@ute-learn.com / 123456");
        }

        // Seed Sample Categories
        if (categoryRepository.count() == 0) {
            com.onlinecourse.entity.Category programming = com.onlinecourse.entity.Category.builder().name("Lập trình").build();
            com.onlinecourse.entity.Category business = com.onlinecourse.entity.Category.builder().name("Kinh doanh").build();
            com.onlinecourse.entity.Category design = com.onlinecourse.entity.Category.builder().name("Thiết kế").build();
            com.onlinecourse.entity.Category it = com.onlinecourse.entity.Category.builder().name("CNTT & Phần mềm").build();
            com.onlinecourse.entity.Category marketing = com.onlinecourse.entity.Category.builder().name("Marketing").build();
            
            categoryRepository.saveAll(java.util.List.of(programming, business, design, it, marketing));
            
            com.onlinecourse.entity.Category webDev = com.onlinecourse.entity.Category.builder().name("Lập trình Web").parent(programming).build();
            com.onlinecourse.entity.Category dataScience = com.onlinecourse.entity.Category.builder().name("Khoa học Dữ liệu").parent(programming).build();
            com.onlinecourse.entity.Category uiux = com.onlinecourse.entity.Category.builder().name("UI/UX Design").parent(design).build();
            
            categoryRepository.saveAll(java.util.List.of(webDev, dataScience, uiux));
            log.info("Seeded Sample Categories");
        }
    }
}
