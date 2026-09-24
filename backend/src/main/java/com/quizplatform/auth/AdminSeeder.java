package com.quizplatform.auth;

import com.quizplatform.config.SeedAdminProperties;
import com.quizplatform.user.Role;
import com.quizplatform.user.UserAccount;
import com.quizplatform.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Component
public class AdminSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final SeedAdminProperties properties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminSeeder(SeedAdminProperties properties, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!properties.enabled()) {
            return;
        }
        if (isBlank(properties.email()) || isBlank(properties.password())) {
            log.warn("Admin seed was requested but SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required");
            return;
        }
        String email = properties.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            return;
        }
        String username = isBlank(properties.username()) ? "admin" : properties.username().trim();
        String password = passwordEncoder.encode(properties.password());
        UserAccount admin = new UserAccount(email, password, username);
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);
        log.info("Seeded initial administrator account");
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
