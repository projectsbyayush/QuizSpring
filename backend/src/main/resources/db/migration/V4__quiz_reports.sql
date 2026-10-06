create table quiz_reports (
    id uuid primary key default gen_random_uuid(),
    quiz_id uuid not null references quizzes(id) on delete cascade,
    reporter_id uuid not null references users(id) on delete cascade,
    reason varchar(40) not null,
    details varchar(1000),
    status varchar(20) not null default 'OPEN',
    resolution_note varchar(500),
    resolved_by uuid references users(id) on delete set null,
    resolved_at timestamptz,
    created_at timestamptz not null default now(),
    constraint quiz_reports_reason_check check (reason in ('INACCURATE', 'SPAM', 'OFFENSIVE', 'DUPLICATE', 'COPYRIGHT', 'OTHER')),
    constraint quiz_reports_status_check check (status in ('OPEN', 'RESOLVED', 'DISMISSED')),
    constraint quiz_reports_details_check check (details is null or char_length(details) <= 1000)
);

create index idx_quiz_reports_status_created on quiz_reports(status, created_at desc);
create index idx_quiz_reports_quiz on quiz_reports(quiz_id);

create unique index uq_quiz_reports_open_per_user
    on quiz_reports(quiz_id, reporter_id)
    where status = 'OPEN';
