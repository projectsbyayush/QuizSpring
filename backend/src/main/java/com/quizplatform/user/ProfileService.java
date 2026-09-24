package com.quizplatform.user;

import com.quizplatform.common.BadRequestException;
import com.quizplatform.common.ConflictException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final UserRepository userRepository;

    public ProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserResponse get(UserAccount user) {
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse update(UserAccount user, ProfileUpdateRequest request) {
        if (request.username() != null) {
            String username = request.username().trim();
            if (username.isBlank()) {
                throw new BadRequestException("INVALID_USERNAME", "Username is required");
            }
            if (userRepository.existsByUsernameIgnoreCase(username)
                    && !user.getUsername().equalsIgnoreCase(username)) {
                throw new ConflictException("USERNAME_IN_USE", "That username is already in use");
            }
            user.setUsername(username);
        }
        if (request.avatarUrl() != null) {
            String avatar = request.avatarUrl().trim();
            user.setAvatarUrl(avatar.isBlank() ? null : avatar);
        }
        return UserResponse.from(userRepository.save(user));
    }
}
