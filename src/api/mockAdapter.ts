import type { InternalAxiosRequestConfig } from 'axios';
import type {
  AttemptAnswer,
  AttemptHistory,
  AttemptResult,
  AttemptStart,
  Category,
  DashboardData,
  Difficulty,
  ManagedQuizDetail,
  PageResponse,
  Question,
  QuizCreateInput,
  QuizSummary,
  SafeQuestion,
  User,
} from '../types';

interface StoredQuiz {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  created_by: string | null;
  author_name: string | null;
  difficulty: Difficulty;
  time_limit: number | null;
  is_published: boolean;
  created_at: string;
  attempt_count: number;
  questions: Question[];
}

interface StoredAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  xp_earned: number;
  base_xp: number;
  time_bonus_xp: number;
  streak_bonus_xp: number;
  time_taken: number | null;
  completed_at: string | null;
  answers: AttemptAnswer[];
}

const XP_PER_DIFFICULTY: Record<Difficulty, number> = { Easy: 10, Medium: 20, Hard: 30 };

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `demo-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function levelForXp(totalXp: number): number {
  if (totalXp <= 0) return 1;
  return Math.floor(Math.sqrt(totalXp / 100)) + 1;
}

const delay = (ms = 350): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms));

function makeQuestion(
  quizId: string,
  order: number,
  text: string,
  options: [string, string, string, string],
  correct: number,
  explanation: string,
): Question {
  return {
    id: `q-${quizId}-${order}`,
    quiz_id: quizId,
    question_text: text,
    options,
    correct_answer: correct,
    explanation,
    order,
  };
}

const demoUser: User = {
  id: 'demo-user-1',
  email: 'demo@quizspring.demo',
  username: 'demo-explorer',
  avatar_url: null,
  role: 'user',
  total_xp: 0,
  level: 1,
  streak: 0,
  current_streak: 0,
  longest_streak: 0,
  last_active_date: null,
  is_banned: false,
  created_at: '2026-01-15T09:00:00Z',
};

let lastStreakDate: string | null = null;

const categories: Category[] = [
  {
    id: 'cat-general',
    name: 'General Knowledge',
    slug: 'general-knowledge',
    description: 'Everyday facts and trivia',
    icon: null,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-science',
    name: 'Science',
    slug: 'science',
    description: 'Physics, chemistry, and biology',
    icon: null,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-history',
    name: 'History',
    slug: 'history',
    description: 'Events and people of the past',
    icon: null,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-tech',
    name: 'Technology',
    slug: 'technology',
    description: 'Computing and the web',
    icon: null,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-sports',
    name: 'Sports',
    slug: 'sports',
    description: 'Games, teams, and records',
    icon: null,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-geo',
    name: 'Geography',
    slug: 'geography',
    description: 'Countries, capitals, and landmarks',
    icon: null,
    created_at: '2026-01-01T00:00:00Z',
  },
];

function seedQuiz(
  id: string,
  title: string,
  description: string,
  categoryId: string,
  author: string,
  difficulty: Difficulty,
  timeLimit: number | null,
  createdAt: string,
  attempts: number,
  build: (quizId: string) => Question[],
): StoredQuiz {
  return {
    id,
    title,
    description,
    category_id: categoryId,
    created_by: `author-${id}`,
    author_name: author,
    difficulty,
    time_limit: timeLimit,
    is_published: true,
    created_at: createdAt,
    attempt_count: attempts,
    questions: build(id),
  };
}

const quizzes: StoredQuiz[] = [
  seedQuiz(
    'quiz-capital',
    'World Capitals Sprint',
    'Name the capital cities of ten countries.',
    'cat-geo',
    'Maple',
    'Easy',
    300,
    '2026-09-10T10:00:00Z',
    128,
    (quizId) => [
      makeQuestion(
        quizId,
        0,
        'What is the capital city of France?',
        ['Paris', 'Rome', 'Berlin', 'Madrid'],
        0,
        'Paris has been the capital of France for centuries.',
      ),
      makeQuestion(
        quizId,
        1,
        'What is the capital city of Japan?',
        ['Kyoto', 'Osaka', 'Tokyo', 'Seoul'],
        2,
        'Tokyo became the capital in 1868 during the Meiji Restoration.',
      ),
      makeQuestion(
        quizId,
        2,
        'What is the capital city of Australia?',
        ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
        2,
        'Canberra was purpose-built as the capital in 1913.',
      ),
      makeQuestion(
        quizId,
        3,
        'What is the capital city of Canada?',
        ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'],
        2,
        'Ottawa was chosen by Queen Victoria in 1857.',
      ),
      makeQuestion(
        quizId,
        4,
        'What is the capital city of Egypt?',
        ['Alexandria', 'Cairo', 'Giza', 'Luxor'],
        1,
        'Cairo is the largest city in the Arab world.',
      ),
    ],
  ),
  seedQuiz(
    'quiz-science',
    'Everyday Science',
    'Five questions about the world around you.',
    'cat-science',
    'Nova',
    'Easy',
    300,
    '2026-09-08T10:00:00Z',
    96,
    (quizId) => [
      makeQuestion(
        quizId,
        0,
        'What is the chemical formula for water?',
        ['H2O', 'CO2', 'O2', 'NaCl'],
        0,
        'Water is two hydrogen atoms bonded to one oxygen atom.',
      ),
      makeQuestion(
        quizId,
        1,
        'Which planet is known as the Red Planet?',
        ['Venus', 'Mars', 'Jupiter', 'Mercury'],
        1,
        'Mars looks red because of iron oxide on its surface.',
      ),
      makeQuestion(
        quizId,
        2,
        'What force keeps our feet on the ground?',
        ['Magnetism', 'Friction', 'Gravity', 'Inertia'],
        2,
        'Gravity pulls objects toward the center of the Earth.',
      ),
      makeQuestion(
        quizId,
        3,
        'How many legs does a spider have?',
        ['Six', 'Eight', 'Ten', 'Twelve'],
        1,
        'Spiders are arachnids, defined by their eight legs.',
      ),
      makeQuestion(
        quizId,
        4,
        'What gas do plants absorb from the air?',
        ['Oxygen', 'Nitrogen', 'Hydrogen', 'Carbon dioxide'],
        3,
        'Plants use carbon dioxide in photosynthesis.',
      ),
    ],
  ),
  seedQuiz(
    'quiz-history',
    'Moments That Changed History',
    'A medium-difficulty tour through the past.',
    'cat-history',
    'Atlas',
    'Medium',
    420,
    '2026-09-05T10:00:00Z',
    74,
    (quizId) => [
      makeQuestion(
        quizId,
        0,
        'In which year did the Berlin Wall fall?',
        ['1979', '1985', '1989', '1991'],
        2,
        'The wall fell on 9 November 1989.',
      ),
      makeQuestion(
        quizId,
        1,
        'Who was the first person to walk on the Moon?',
        ['Buzz Aldrin', 'Yuri Gagarin', 'Neil Armstrong', 'Michael Collins'],
        2,
        'Armstrong stepped onto the surface on 20 July 1969.',
      ),
      makeQuestion(
        quizId,
        2,
        'The ancient pyramids of Giza were built as what?',
        ['Temples', 'Tombs', 'Palaces', 'Observatories'],
        1,
        'They served as tombs for pharaohs.',
      ),
      makeQuestion(
        quizId,
        3,
        'Which empire built the Colosseum?',
        ['Greek', 'Roman', 'Ottoman', 'Persian'],
        1,
        'Construction began under Emperor Vespasian around 70 AD.',
      ),
      makeQuestion(
        quizId,
        4,
        'The printing press was invented by whom?',
        ['Da Vinci', 'Galileo', 'Gutenberg', 'Newton'],
        2,
        'Gutenberg introduced movable type around 1440.',
      ),
    ],
  ),
  seedQuiz(
    'quiz-tech',
    'Web Basics Bootcamp',
    'How the web works, in five questions.',
    'cat-tech',
    'Pixel',
    'Medium',
    420,
    '2026-09-02T10:00:00Z',
    61,
    (quizId) => [
      makeQuestion(
        quizId,
        0,
        'What does HTML stand for?',
        [
          'Hyper Text Markup Language',
          'High Tech Modern Language',
          'Home Tool Markup Language',
          'Hyperlinks Text Mode Language',
        ],
        0,
        'HTML structures content on web pages.',
      ),
      makeQuestion(
        quizId,
        1,
        'Which protocol secures web traffic?',
        ['FTP', 'HTTP', 'HTTPS', 'SMTP'],
        2,
        'HTTPS encrypts traffic with TLS.',
      ),
      makeQuestion(
        quizId,
        2,
        'What does CSS control on a page?',
        ['Database queries', 'Styling and layout', 'Server routing', 'File compression'],
        1,
        'CSS describes how elements should look.',
      ),
      makeQuestion(
        quizId,
        3,
        'Which of these is a JavaScript runtime outside the browser?',
        ['Django', 'Node.js', 'Flask', 'Laravel'],
        1,
        'Node.js runs JavaScript on servers.',
      ),
      makeQuestion(
        quizId,
        4,
        'What does API stand for?',
        [
          'Applied Program Internet',
          'Application Programming Interface',
          'Automated Page Index',
          'Advanced Protocol Integration',
        ],
        1,
        'APIs let software systems talk to each other.',
      ),
    ],
  ),
  seedQuiz(
    'quiz-sports',
    'Sports Records Hall of Fame',
    'Hard questions for true fans.',
    'cat-sports',
    'Striker',
    'Hard',
    300,
    '2026-08-28T10:00:00Z',
    43,
    (quizId) => [
      makeQuestion(
        quizId,
        0,
        'How many players does a football (soccer) team field?',
        ['9', '10', '11', '12'],
        2,
        'Eleven players per side take the pitch.',
      ),
      makeQuestion(
        quizId,
        1,
        'In which sport would you perform a slam dunk?',
        ['Tennis', 'Basketball', 'Golf', 'Cricket'],
        1,
        'A slam dunk scores in basketball.',
      ),
      makeQuestion(
        quizId,
        2,
        'How often are the Summer Olympic Games held?',
        ['Every 2 years', 'Every 3 years', 'Every 4 years', 'Every 5 years'],
        2,
        'The Summer Games run on a four-year cycle.',
      ),
      makeQuestion(
        quizId,
        3,
        'A marathon is approximately how long?',
        ['26 miles', '13 miles', '10 km', '50 km'],
        0,
        'A marathon is 26.2 miles (42.2 km).',
      ),
      makeQuestion(
        quizId,
        4,
        'In tennis, what is a score of zero called?',
        ['Nil', 'Love', 'Duck', 'Blank'],
        1,
        'Zero is called love in tennis scoring.',
      ),
    ],
  ),
  seedQuiz(
    'quiz-logic',
    'Everyday Logic Puzzles',
    'Short riddles that reward careful reading.',
    'cat-general',
    'Sage',
    'Medium',
    null,
    '2026-08-20T10:00:00Z',
    37,
    (quizId) => [
      makeQuestion(
        quizId,
        0,
        'What has keys but opens no locks?',
        ['A map', 'A piano', 'A clock', 'A book'],
        1,
        'A piano has keys you press to make music.',
      ),
      makeQuestion(
        quizId,
        1,
        'The more of me you take, the more you leave behind. What am I?',
        ['Time', 'Money', 'Footsteps', 'Breath'],
        2,
        'Walking away leaves footsteps behind.',
      ),
      makeQuestion(
        quizId,
        2,
        'What runs but never walks?',
        ['A river', 'A cloud', 'A shadow', 'A dream'],
        0,
        'Rivers run constantly without legs.',
      ),
      makeQuestion(
        quizId,
        3,
        'If you have three apples and take away two, how many do you have?',
        ['One', 'Two', 'Three', 'None'],
        1,
        'You took two, so you hold two apples.',
      ),
      makeQuestion(
        quizId,
        4,
        'What comes once in a minute, twice in a moment, but never in a thousand years?',
        ['The letter M', 'The letter O', 'A heartbeat', 'A second'],
        0,
        'Check the spelling: minute has one M, moment has two.',
      ),
    ],
  ),
];

const attempts: StoredAttempt[] = [];
const pending: StoredAttempt[] = [];

function categoryById(id: string | null): Category | null {
  return categories.find((category) => category.id === id) ?? null;
}

function toSummary(quiz: StoredQuiz): QuizSummary {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category_id: quiz.category_id,
    categories: categoryById(quiz.category_id),
    created_by: quiz.created_by,
    profiles: quiz.author_name ? { username: quiz.author_name, avatar_url: null } : null,
    difficulty: quiz.difficulty,
    time_limit: quiz.time_limit,
    is_published: quiz.is_published,
    created_at: quiz.created_at,
    question_count: quiz.questions.length,
    attempt_count: quiz.attempt_count,
    can_edit: quiz.created_by === demoUser.id,
  };
}

function toDetail(quiz: StoredQuiz): ManagedQuizDetail {
  return { ...toSummary(quiz), questions: quiz.questions };
}

function toSafe(question: Question): SafeQuestion {
  return {
    id: question.id,
    quiz_id: question.quiz_id,
    question_text: question.question_text,
    options: question.options,
    order: question.order,
  };
}

function tokens() {
  return {
    access_token: `demo-access-${uid()}`,
    refresh_token: `demo-refresh-${uid()}`,
    token_type: 'Bearer',
    expires_in: 900,
    user: { ...demoUser },
  };
}

function paginate<T>(items: T[], page: number, size: number): PageResponse<T> {
  const safePage = Math.max(0, page);
  const safeSize = Math.min(100, Math.max(1, size));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safeSize));
  const content = items.slice(safePage * safeSize, safePage * safeSize + safeSize);
  return {
    content,
    page: safePage,
    size: safeSize,
    total_elements: total,
    total_pages: totalPages,
    first: safePage === 0,
    last: safePage >= totalPages - 1,
  };
}

function historyFor(attempt: StoredAttempt): AttemptHistory {
  const quiz = quizzes.find((item) => item.id === attempt.quiz_id) ?? null;
  return {
    id: attempt.id,
    user_id: attempt.user_id,
    quiz_id: attempt.quiz_id,
    score: attempt.score,
    total_questions: attempt.total_questions,
    xp_earned: attempt.xp_earned,
    time_taken: attempt.time_taken,
    completed_at: attempt.completed_at ?? nowIso(),
    answers: attempt.answers,
    quiz: quiz ? toSummary(quiz) : null,
    xp: {
      base: attempt.base_xp,
      time_bonus: attempt.time_bonus_xp,
      streak_bonus: attempt.streak_bonus_xp,
      total: attempt.xp_earned,
    },
  };
}

function completeAttempt(
  quiz: StoredQuiz,
  answers: Record<string, number | null>,
  timeTaken: number | null,
): StoredAttempt {
  let correct = 0;
  const rows: AttemptAnswer[] = quiz.questions.map((question) => {
    const selected = answers[question.id] ?? null;
    const isCorrect = selected !== null && selected === question.correct_answer;
    if (isCorrect) correct += 1;
    return {
      question_id: question.id,
      selected,
      correct_answer: question.correct_answer,
      correct: isCorrect,
      question_text: question.question_text,
      options: question.options,
      explanation: question.explanation,
    };
  });
  const base = correct * XP_PER_DIFFICULTY[quiz.difficulty];
  const withinLimit = quiz.time_limit === null || (timeTaken ?? 0) <= quiz.time_limit;
  const timeBonus = withinLimit ? Math.floor(base * 0.2) : 0;
  let streakBonus = 0;
  if (lastStreakDate !== todayKey()) {
    lastStreakDate = todayKey();
    demoUser.streak += 1;
    demoUser.current_streak = demoUser.streak;
    demoUser.longest_streak = Math.max(demoUser.longest_streak ?? 0, demoUser.streak);
    demoUser.last_active_date = todayKey();
    streakBonus = Math.min(demoUser.streak * 5, 50);
  }
  const total = base + timeBonus + streakBonus;
  demoUser.total_xp += total;
  demoUser.level = levelForXp(demoUser.total_xp);
  quiz.attempt_count += 1;
  const record: StoredAttempt = {
    id: uid(),
    user_id: demoUser.id,
    quiz_id: quiz.id,
    score: correct,
    total_questions: quiz.questions.length,
    xp_earned: total,
    base_xp: base,
    time_bonus_xp: timeBonus,
    streak_bonus_xp: streakBonus,
    time_taken: timeTaken,
    completed_at: nowIso(),
    answers: rows,
  };
  attempts.unshift(record);
  return record;
}

function dashboard(): DashboardData {
  const completed = attempts.filter((attempt) => attempt.completed_at !== null);
  const correct = completed.reduce((sum, attempt) => sum + attempt.score, 0);
  const totalQuestions = completed.reduce((sum, attempt) => sum + attempt.total_questions, 0);
  const accuracy = totalQuestions === 0 ? 0 : Math.round((correct * 1000) / totalQuestions) / 10;
  const created = quizzes.filter((quiz) => quiz.created_by === demoUser.id).length;
  const xpInto = demoUser.total_xp - (demoUser.level - 1) * (demoUser.level - 1) * 100;
  const xpNeeded = demoUser.level * demoUser.level * 100 - demoUser.total_xp;
  return {
    stats: {
      attempted: completed.length,
      total_xp: demoUser.total_xp,
      level: demoUser.level,
      accuracy,
      created,
      streak: demoUser.streak,
      current_streak: demoUser.current_streak,
      longest_streak: demoUser.longest_streak,
      xp_into_level: Math.max(0, xpInto),
      xp_needed_for_next_level: Math.max(0, xpNeeded),
    },
    profile: { ...demoUser },
    recent: completed.slice(0, 6).map(historyFor),
    recommended: quizzes
      .filter((quiz) => quiz.is_published && quiz.created_by !== demoUser.id)
      .slice(0, 4)
      .map(toSummary),
  };
}

interface MockError {
  isAxiosError: true;
  message: string;
  config: InternalAxiosRequestConfig;
  response: {
    data: { message: string; code: string };
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: InternalAxiosRequestConfig;
  };
}

function fail(config: InternalAxiosRequestConfig, status: number, code: string, message: string): Promise<never> {
  const error: MockError = {
    isAxiosError: true,
    message,
    config,
    response: { data: { message, code }, status, statusText: '', headers: {}, config },
  };
  return Promise.reject(error);
}

function ok<T>(config: InternalAxiosRequestConfig, data: T, status = 200) {
  return Promise.resolve({ data, status, statusText: 'OK', headers: {}, config });
}

function bodyOf(config: InternalAxiosRequestConfig): Record<string, unknown> {
  const data = config.data as unknown;
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return data as Record<string, unknown>;
}

function paramsOf(config: InternalAxiosRequestConfig): Record<string, string> {
  const params = (config.params ?? {}) as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) result[key] = String(value);
  }
  const query = (config.url ?? '').split('?')[1];
  if (query) {
    for (const pair of query.split('&')) {
      const [key, value] = pair.split('=');
      if (key && !(key in result)) result[key] = decodeURIComponent(value ?? '');
    }
  }
  return result;
}

export async function mockAdapter(config: InternalAxiosRequestConfig) {
  await delay();
  const method = (config.method ?? 'get').toLowerCase();
  const path = (config.url ?? '').split('?')[0].replace(/\/+$/, '') || '/';
  const body = bodyOf(config);
  const params = paramsOf(config);

  if (method === 'post' && path === '/auth/register') {
    const email = String(body.email ?? `guest_${uid().slice(0, 8)}@quizspring.demo`);
    const username = String(body.username ?? email.split('@')[0]);
    demoUser.email = email;
    demoUser.username = username;
    return ok(config, tokens(), 201);
  }
  if (method === 'post' && path === '/auth/login') {
    return ok(config, tokens());
  }
  if (method === 'get' && path === '/auth/me') {
    return ok(config, { ...demoUser });
  }
  if (method === 'post' && path === '/auth/refresh') {
    return ok(config, tokens());
  }
  if (method === 'post' && path === '/auth/logout') {
    return ok(config, null, 204);
  }
  if (method === 'post' && path === '/auth/forgot-password') {
    return ok(config, { message: 'Demo mode: password reset emails are disabled.', token: null });
  }
  if (method === 'post' && path === '/auth/reset-password') {
    return ok(config, { message: 'Password updated' });
  }

  if (method === 'get' && path === '/categories') {
    return ok(config, categories);
  }

  if (method === 'get' && path === '/quizzes') {
    const search = (params.search ?? '').toLowerCase();
    const categoryId = params.categoryId ?? 'all';
    const difficulty = params.difficulty ?? 'all';
    const sort = params.sort ?? 'newest';
    const includeDrafts = params.includeDrafts === 'true';
    let items = quizzes.filter((quiz) => quiz.is_published || (includeDrafts && quiz.created_by === demoUser.id));
    if (search) {
      items = items.filter(
        (quiz) => quiz.title.toLowerCase().includes(search) || (quiz.description ?? '').toLowerCase().includes(search),
      );
    }
    if (categoryId !== 'all') items = items.filter((quiz) => quiz.category_id === categoryId);
    if (difficulty !== 'all') items = items.filter((quiz) => quiz.difficulty === difficulty);
    if (sort === 'popular') items = [...items].sort((a, b) => b.attempt_count - a.attempt_count);
    else if (sort === 'title') items = [...items].sort((a, b) => a.title.localeCompare(b.title));
    else items = [...items].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return ok(config, paginate(items.map(toSummary), Number(params.page ?? 0), Number(params.size ?? 9)));
  }

  if (method === 'get' && path === '/quizzes/mine') {
    const search = (params.search ?? '').toLowerCase();
    let items = quizzes.filter((quiz) => quiz.created_by === demoUser.id);
    if (search) items = items.filter((quiz) => quiz.title.toLowerCase().includes(search));
    items = [...items].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return ok(config, paginate(items.map(toSummary), Number(params.page ?? 0), Number(params.size ?? 10)));
  }

  if (method === 'post' && path === '/quizzes') {
    const input = body as unknown as QuizCreateInput;
    const id = uid();
    const quiz: StoredQuiz = {
      id,
      title: String(input.title ?? 'Untitled quiz'),
      description: (input.description as string | null) ?? null,
      category_id: String(input.category_id ?? categories[0].id),
      created_by: demoUser.id,
      author_name: demoUser.username,
      difficulty: (input.difficulty as Difficulty) ?? 'Medium',
      time_limit: (input.time_limit as number | null) ?? null,
      is_published: input.is_published ?? true,
      created_at: nowIso(),
      attempt_count: 0,
      questions: (input.questions ?? []).map((question, index) => ({
        id: uid(),
        quiz_id: id,
        question_text: question.question_text,
        options: question.options,
        correct_answer: question.correct_answer,
        explanation: question.explanation ?? null,
        order: index,
      })),
    };
    quizzes.unshift(quiz);
    return ok(config, toDetail(quiz), 201);
  }

  const quizMatch = path.match(/^\/quizzes\/([^/]+)(\/.*)?$/);
  if (quizMatch) {
    const quizId = quizMatch[1];
    const suffix = quizMatch[2] ?? '';
    const quiz = quizzes.find((item) => item.id === quizId);
    if (!quiz) return fail(config, 404, 'QUIZ_NOT_FOUND', 'Quiz was not found');
    if (method === 'get' && (suffix === '' || suffix === '/play')) {
      return ok(config, toDetail(quiz));
    }
    if (method === 'post' && suffix === '/start') {
      const record: StoredAttempt = {
        id: uid(),
        user_id: demoUser.id,
        quiz_id: quiz.id,
        score: 0,
        total_questions: quiz.questions.length,
        xp_earned: 0,
        base_xp: 0,
        time_bonus_xp: 0,
        streak_bonus_xp: 0,
        time_taken: null,
        completed_at: null,
        answers: [],
      };
      pending.push(record);
      const start: AttemptStart = {
        attempt_id: record.id,
        quiz_id: quiz.id,
        status: 'PENDING',
        started_at: nowIso(),
        expires_at: quiz.time_limit === null ? null : new Date(Date.now() + quiz.time_limit * 1000).toISOString(),
        time_limit: quiz.time_limit,
        grace_period_seconds: 5,
        questions: quiz.questions.map(toSafe),
      };
      return ok(config, start, 201);
    }
    if (method === 'put' && suffix === '') {
      if (quiz.created_by !== demoUser.id)
        return fail(config, 403, 'QUIZ_OWNERSHIP_REQUIRED', 'Only the quiz owner can modify it');
      if (attempts.some((attempt) => attempt.quiz_id === quiz.id)) {
        return fail(config, 409, 'QUIZ_HAS_ATTEMPTS', 'Quizzes with attempts cannot be edited');
      }
      const input = body as unknown as QuizCreateInput;
      quiz.title = String(input.title ?? quiz.title);
      quiz.description = (input.description as string | null) ?? null;
      quiz.category_id = String(input.category_id ?? quiz.category_id);
      quiz.difficulty = (input.difficulty as Difficulty) ?? quiz.difficulty;
      quiz.time_limit = (input.time_limit as number | null) ?? null;
      quiz.is_published = input.is_published ?? quiz.is_published;
      quiz.questions = (input.questions ?? []).map((question, index) => ({
        id: uid(),
        quiz_id: quiz.id,
        question_text: question.question_text,
        options: question.options,
        correct_answer: question.correct_answer,
        explanation: question.explanation ?? null,
        order: index,
      }));
      return ok(config, toDetail(quiz));
    }
    if (method === 'delete' && suffix === '') {
      if (quiz.created_by !== demoUser.id)
        return fail(config, 403, 'QUIZ_OWNERSHIP_REQUIRED', 'Only the quiz owner can modify it');
      for (let index = attempts.length - 1; index >= 0; index -= 1) {
        if (attempts[index].quiz_id === quiz.id) {
          demoUser.total_xp = Math.max(0, demoUser.total_xp - attempts[index].xp_earned);
          attempts.splice(index, 1);
        }
      }
      demoUser.level = levelForXp(demoUser.total_xp);
      quizzes.splice(quizzes.indexOf(quiz), 1);
      return ok(config, null, 204);
    }
  }

  if (method === 'post' && path === '/attempts') {
    const quizId = String(body.quiz_id ?? '');
    const quiz = quizzes.find((item) => item.id === quizId);
    if (!quiz) return fail(config, 404, 'QUIZ_NOT_FOUND', 'Quiz was not found');
    const record = completeAttempt(
      quiz,
      (body.answers as Record<string, number | null>) ?? {},
      Number(body.time_taken ?? 0),
    );
    const result: AttemptResult = {
      attempt_id: record.id,
      quiz_id: quiz.id,
      score: record.score,
      total_questions: record.total_questions,
      xp_earned: record.xp_earned,
      time_taken: record.time_taken,
      completed_at: record.completed_at ?? nowIso(),
      xp: {
        base: record.base_xp,
        time_bonus: record.time_bonus_xp,
        streak_bonus: record.streak_bonus_xp,
        total: record.xp_earned,
      },
      answers: record.answers,
      quiz: toSummary(quiz),
    };
    return ok(config, result, 201);
  }

  const attemptMatch = path.match(/^\/attempts\/([^/]+)(\/.*)?$/);
  if (attemptMatch && attemptMatch[1] !== 'mine' && attemptMatch[1] !== 'accuracy') {
    const attemptId = attemptMatch[1];
    const suffix = attemptMatch[2] ?? '';
    if (method === 'post' && suffix === '/submit') {
      const record = pending.find((item) => item.id === attemptId);
      if (!record) return fail(config, 404, 'ATTEMPT_NOT_FOUND', 'Attempt was not found');
      const quiz = quizzes.find((item) => item.id === record.quiz_id);
      if (!quiz) return fail(config, 404, 'QUIZ_NOT_FOUND', 'Quiz was not found');
      pending.splice(pending.indexOf(record), 1);
      const done = completeAttempt(
        quiz,
        (body.answers as Record<string, number | null>) ?? {},
        Number(body.time_taken ?? 0),
      );
      done.id = record.id;
      const result: AttemptResult = {
        attempt_id: done.id,
        quiz_id: quiz.id,
        score: done.score,
        total_questions: done.total_questions,
        xp_earned: done.xp_earned,
        time_taken: done.time_taken,
        completed_at: done.completed_at ?? nowIso(),
        xp: {
          base: done.base_xp,
          time_bonus: done.time_bonus_xp,
          streak_bonus: done.streak_bonus_xp,
          total: done.xp_earned,
        },
        answers: done.answers,
        quiz: toSummary(quiz),
      };
      return ok(config, result);
    }
    if (method === 'get' && suffix === '') {
      const record = attempts.find((item) => item.id === attemptId);
      if (!record) return fail(config, 404, 'ATTEMPT_NOT_FOUND', 'Attempt was not found');
      return ok(config, historyFor(record));
    }
  }

  if (method === 'get' && path === '/attempts/mine') {
    return ok(config, paginate(attempts.map(historyFor), Number(params.page ?? 0), Number(params.size ?? 20)));
  }

  if (method === 'get' && path === '/attempts/accuracy') {
    const correct = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const total = attempts.reduce((sum, attempt) => sum + attempt.total_questions, 0);
    return ok(config, { correct, total, percentage: total === 0 ? 0 : Math.round((correct * 1000) / total) / 10 });
  }

  if (method === 'get' && path === '/dashboard') {
    return ok(config, dashboard());
  }

  if (method === 'get' && path === '/profile') {
    return ok(config, { ...demoUser });
  }
  if (method === 'patch' && path === '/profile') {
    if (body.username !== undefined) demoUser.username = String(body.username);
    if (body.avatar_url !== undefined) demoUser.avatar_url = String(body.avatar_url);
    return ok(config, { ...demoUser });
  }
  if (method === 'post' && path === '/profile/change-password') {
    return ok(config, { message: 'Password updated' });
  }

  return fail(config, 404, 'DEMO_UNAVAILABLE', 'This action is not available in demo mode.');
}
