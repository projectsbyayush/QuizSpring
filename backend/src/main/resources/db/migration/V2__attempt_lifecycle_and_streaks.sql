create unique index if not exists uq_attempts_pending_user_quiz
    on attempts(user_id, quiz_id)
    where status = 'PENDING';
