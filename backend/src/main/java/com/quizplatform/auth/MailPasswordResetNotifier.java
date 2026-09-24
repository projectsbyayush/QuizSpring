package com.quizplatform.auth;

import com.quizplatform.config.PasswordResetProperties;
import com.quizplatform.user.UserAccount;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailPasswordResetNotifier implements PasswordResetNotifier {

    private static final Logger log = LoggerFactory.getLogger(MailPasswordResetNotifier.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final PasswordResetProperties properties;

    public MailPasswordResetNotifier(ObjectProvider<JavaMailSender> mailSenderProvider,
                                     PasswordResetProperties properties) {
        this.mailSenderProvider = mailSenderProvider;
        this.properties = properties;
    }

    @Override
    public void sendResetLink(UserAccount user, String rawToken) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("Password reset requested but mail is not configured; delivery was skipped");
            return;
        }
        String separator = properties.baseUrl().contains("?") ? "&" : "?";
        String link = properties.baseUrl() + separator + "token=" + java.net.URLEncoder.encode(rawToken, java.nio.charset.StandardCharsets.UTF_8);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("Reset your QuizSpring password");
        message.setText("Use this link to reset your password: " + link + "\n\nIf you did not request this, you can ignore this message.");
        try {
            mailSender.send(message);
        } catch (RuntimeException exception) {
            log.error("Password reset email delivery failed for {}", user.getEmail(), exception);
        }
    }
}
