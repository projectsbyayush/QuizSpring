package com.quizplatform.admin;

import com.quizplatform.common.BadRequestException;
import com.quizplatform.common.ConflictException;
import com.quizplatform.auth.CurrentUserService;
import com.quizplatform.auth.UserPrincipal;
import com.quizplatform.user.Role;
import com.quizplatform.user.UserAccount;
import com.quizplatform.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AdminServiceDeleteUserTest {

    private final UUID adminId = UUID.randomUUID();
    private final UUID targetId = UUID.randomUUID();
    private final List<UserAccount> store = new ArrayList<>();
    private final List<UserAccount> deleted = new ArrayList<>();
    private UserRepository userRepository;
    private AdminService adminService;

    private static UserAccount user(UUID id, Role role) {
        UserAccount account = new UserAccount(id, id + "@example.com", "hash", "user-" + id.toString().substring(0, 8));
        account.setRole(role);
        return account;
    }

    @BeforeEach
    void setUp() {
        store.add(user(adminId, Role.ADMIN));
        store.add(user(targetId, Role.USER));
        userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(), new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByIdForUpdate" -> Optional.ofNullable(store.stream()
                            .filter(u -> u.getId().equals(args[0])).findFirst().orElse(null));
                    case "findByRoleForUpdate" -> store.stream()
                            .filter(u -> u.getRole() == args[0]).toList();
                    case "countByRole" -> (long) store.stream().filter(u -> u.getRole() == args[0]).count();
                    case "delete" -> {
                        deleted.add((UserAccount) args[0]);
                        yield null;
                    }
                    default -> throw new UnsupportedOperationException(method.getName());
                });
        CurrentUserService currentUserService = new CurrentUserService(userRepository);
        UserPrincipal principal = new UserPrincipal(user(adminId, Role.ADMIN));
        Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        adminService = new AdminService(userRepository, null, null, null, null, null, currentUserService, null);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void deletesTargetUser() {
        adminService.deleteUser(targetId);
        assertEquals(1, deleted.size());
        assertEquals(targetId, deleted.get(0).getId());
    }

    @Test
    void refusesSelfDeletion() {
        BadRequestException error = assertThrows(BadRequestException.class,
                () -> adminService.deleteUser(adminId));
        assertEquals("SELF_DELETE_FORBIDDEN", error.getCode());
        assertTrue(deleted.isEmpty());
    }

    @Test
    void refusesToDeleteLastAdmin() {
        store.clear();
        store.add(user(targetId, Role.ADMIN));
        ConflictException error = assertThrows(ConflictException.class,
                () -> adminService.deleteUser(targetId));
        assertEquals("LAST_ADMIN", error.getCode());
        assertTrue(deleted.isEmpty());
    }
}
