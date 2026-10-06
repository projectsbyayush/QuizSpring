create table collections (
    id uuid primary key default gen_random_uuid(),
    slug varchar(120) not null unique,
    name varchar(100) not null,
    description varchar(1000),
    accent varchar(16) not null default '#0071e3',
    category_id uuid references categories(id) on delete set null,
    display_order integer not null default 0,
    is_published boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint collections_display_order_check check (display_order >= 0)
);

create index idx_collections_order on collections(display_order);
create index idx_collections_category on collections(category_id);

alter table quizzes
    add column is_official boolean not null default false;

alter table quizzes
    add column collection_id uuid references collections(id) on delete set null;

create index idx_quizzes_official on quizzes(is_official, created_at desc);
create index idx_quizzes_collection on quizzes(collection_id);
