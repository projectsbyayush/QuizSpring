create extension if not exists pgcrypto;

create table users (
    id uuid primary key default gen_random_uuid(),
    email varchar(320) not null unique,
    password_hash varchar(100) not null,
    username varchar(50) not null unique,
    avatar_url varchar(2048),
    role varchar(20) not null default 'user',
    total_xp integer not null default 0,
    level integer not null default 1,
    current_streak integer not null default 0,
    longest_streak integer not null default 0,
    last_activity_date date,
    is_banned boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    password_changed_at timestamptz not null default now(),
    constraint users_role_check check (role in ('user', 'admin')),
    constraint users_total_xp_check check (total_xp >= 0),
    constraint users_level_check check (level >= 1),
    constraint users_current_streak_check check (current_streak >= 0),
    constraint users_longest_streak_check check (longest_streak >= 0)
);

create index users_role_banned_idx on users(role, is_banned);
create unique index users_username_lower_unique on users(lower(username));

create table categories (
    id uuid primary key default gen_random_uuid(),
    name varchar(100) not null unique,
    slug varchar(120) not null unique,
    description varchar(2000),
    icon varchar(32),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index categories_name_lower_unique on categories(lower(name));

create table quizzes (
    id uuid primary key default gen_random_uuid(),
    title varchar(200) not null,
    description varchar(5000),
    category_id uuid references categories(id) on delete restrict,
    author_id uuid references users(id) on delete set null,
    difficulty varchar(20) not null default 'Medium',
    time_limit_seconds integer,
    is_published boolean not null default true,
    attempt_count bigint not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    version bigint not null default 0,
    constraint quizzes_title_check check (char_length(title) >= 4),
    constraint quizzes_difficulty_check check (difficulty in ('Easy', 'Medium', 'Hard')),
    constraint quizzes_time_limit_check check (time_limit_seconds is null or time_limit_seconds > 0)
);

create index idx_quizzes_category on quizzes(category_id);
create index idx_quizzes_difficulty on quizzes(difficulty);
create index idx_quizzes_author on quizzes(author_id);
create index idx_quizzes_published_created on quizzes(is_published, created_at desc);
create index idx_quizzes_popular on quizzes(attempt_count desc, created_at desc);

create table questions (
    id uuid primary key default gen_random_uuid(),
    quiz_id uuid not null references quizzes(id) on delete cascade,
    question_text varchar(5000) not null,
    option_a varchar(500) not null,
    option_b varchar(500) not null,
    option_c varchar(500) not null,
    option_d varchar(500) not null,
    correct_option varchar(1) not null,
    explanation varchar(5000),
    order_index integer not null,
    constraint questions_correct_option_check check (correct_option in ('A', 'B', 'C', 'D')),
    constraint questions_order_index_check check (order_index >= 0)
);

create index idx_questions_quiz_order on questions(quiz_id, order_index);

create table attempts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    quiz_id uuid not null references quizzes(id) on delete cascade,
    score integer not null default 0,
    total_questions integer not null default 0,
    correct_answers integer not null default 0,
    xp_earned integer not null default 0,
    base_xp integer not null default 0,
    time_bonus_xp integer not null default 0,
    streak_bonus_xp integer not null default 0,
    time_taken_seconds integer,
    time_limit_seconds integer,
    completed_within_time_limit boolean not null default false,
    status varchar(20) not null default 'PENDING',
    answers jsonb not null default '[]'::jsonb,
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    constraint attempts_score_check check (score >= 0),
    constraint attempts_total_questions_check check (total_questions >= 0),
    constraint attempts_correct_answers_check check (correct_answers >= 0 and correct_answers <= total_questions),
    constraint attempts_xp_check check (xp_earned >= 0 and base_xp >= 0 and time_bonus_xp >= 0 and streak_bonus_xp >= 0),
    constraint attempts_time_taken_check check (time_taken_seconds is null or time_taken_seconds >= 0),
    constraint attempts_status_check check (status in ('PENDING', 'COMPLETED')),
    constraint attempts_completed_check check ((status = 'PENDING' and completed_at is null) or (status = 'COMPLETED' and completed_at is not null))
);

create index idx_attempts_user_completed on attempts(user_id, completed_at desc);
create index idx_attempts_quiz on attempts(quiz_id);
create index idx_attempts_completed on attempts(completed_at desc);
create index idx_attempts_status on attempts(user_id, quiz_id, status);

create table attempt_answers (
    id uuid primary key default gen_random_uuid(),
    attempt_id uuid not null references attempts(id) on delete cascade,
    question_id uuid not null references questions(id) on delete cascade,
    selected_option integer,
    correct_option integer not null,
    is_correct boolean not null,
    question_order integer not null,
    constraint attempt_answers_selected_option_check check (selected_option is null or selected_option between 0 and 3),
    constraint attempt_answers_correct_option_check check (correct_option between 0 and 3),
    constraint attempt_answers_order_check check (question_order >= 0),
    constraint attempt_answers_attempt_question_unique unique (attempt_id, question_id)
);

create index idx_attempt_answers_attempt on attempt_answers(attempt_id, question_order);
create index idx_attempt_answers_question on attempt_answers(question_id);

create table refresh_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    token_hash varchar(64) not null unique,
    family_id uuid not null,
    expires_at timestamptz not null,
    revoked_at timestamptz,
    replaced_by_token_hash varchar(64),
    user_agent varchar(500),
    ip_address varchar(64),
    created_at timestamptz not null default now()
);

create index idx_refresh_tokens_user on refresh_tokens(user_id);
create index idx_refresh_tokens_family on refresh_tokens(family_id);

create table password_reset_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    token_hash varchar(64) not null unique,
    expires_at timestamptz not null,
    used_at timestamptz,
    created_at timestamptz not null default now()
);

create index idx_password_reset_user on password_reset_tokens(user_id);

insert into categories (name, slug, description)
values
    ('General Knowledge', 'general-knowledge', 'Everyday facts and general trivia'),
    ('Science', 'science', 'Physics, chemistry, biology, and earth science'),
    ('Technology', 'technology', 'Computing, engineering, and digital systems'),
    ('History', 'history', 'Historical events, people, and civilizations'),
    ('Mathematics', 'mathematics', 'Mathematical concepts and problem solving'),
    ('Geography', 'geography', 'Places, environments, and world geography')
on conflict (name) do nothing;
