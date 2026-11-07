import type {
  Community,
  ContributionTask,
  DiscoverItem,
} from "./types";

/**
 * Seed content for the first release of Samiati.
 *
 * Everything here is **mock data**. It exists so the Discover, Changa and
 * Communities surfaces are real, navigable interfaces from day one while the
 * upstream content pipelines are still being built. Nothing in the UI presents
 * this as live data.
 */

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

export const SEED_CONTRIBUTION_TASKS: ContributionTask[] = [
  {
    id: "task-001",
    type: "translate",
    languageId: "kikuyu",
    sourceText:
      "The community water pump has been out of order for three weeks.",
    context:
      "Everyday public announcement. Keep the tone plain and respectful.",
    difficulty: "easy",
    status: "open",
    createdAt: now - 2 * DAY,
    updatedAt: now - 2 * DAY,
    rewardPoints: 10,
  },
  {
    id: "task-002",
    type: "translate",
    languageId: "dholuo",
    sourceText:
      "The community water pump has been out of order for three weeks.",
    context: "Everyday public announcement.",
    difficulty: "easy",
    status: "open",
    createdAt: now - 2 * DAY,
    updatedAt: now - 2 * DAY,
    rewardPoints: 10,
  },
  {
    id: "task-003",
    type: "validate",
    languageId: "kiswahili",
    sourceText: "Please confirm your arrival time at the station.",
    targetText: "Tafadhali thibitisha muda wako wa kufika kituoni.",
    context:
      "An existing translation. Check it reads naturally, not just word-for-word.",
    difficulty: "medium",
    status: "open",
    createdAt: now - DAY,
    updatedAt: now - DAY,
    rewardPoints: 6,
  },
  {
    id: "task-004",
    type: "correct",
    languageId: "sheng",
    sourceText: "The meeting has been moved to Thursday morning.",
    targetText: "Mkutano umehamishwa siku ya Alhamisi asubuhi.",
    context:
      "A Sheng-flavoured correction — keep the urban register, not book Swahili.",
    difficulty: "hard",
    status: "open",
    createdAt: now - DAY,
    updatedAt: now - DAY,
    rewardPoints: 18,
  },
  {
    id: "task-005",
    type: "terminology",
    languageId: "somali",
    sourceText: "mobile money",
    context:
      "Collect the term Africans use most often for mobile money, with a short note on how it is used.",
    difficulty: "medium",
    status: "open",
    createdAt: now - 3 * DAY,
    updatedAt: now - 3 * DAY,
    rewardPoints: 12,
  },
  {
    id: "task-006",
    type: "compare",
    languageId: "kamba",
    sourceText: "harvest",
    targetText: "ũvimbi",
    context: "Compare the candidate word against how it is used in the field.",
    difficulty: "medium",
    status: "open",
    createdAt: now - 4 * DAY,
    updatedAt: now - 4 * DAY,
    rewardPoints: 12,
  },
  {
    id: "task-007",
    type: "translate",
    languageId: "luhya",
    sourceText: "Our school will open for the second term in September.",
    difficulty: "easy",
    status: "open",
    createdAt: now - 5 * DAY,
    updatedAt: now - 5 * DAY,
    rewardPoints: 10,
  },
  {
    id: "task-008",
    type: "validate",
    languageId: "meru",
    sourceText: "Please bring your national identification card.",
    targetText: "Riga kuru ya kuthibitisha utambulisho wako wa taifa.",
    difficulty: "easy",
    status: "open",
    createdAt: now - 6 * DAY,
    updatedAt: now - 6 * DAY,
    rewardPoints: 6,
  },
];

export const SEED_COMMUNITIES: Community[] = [
  {
    id: "community-kiswahili",
    name: "Kiswahili Community",
    languageId: "kiswahili",
    description:
      "The largest Samiati community. Discuss news, idioms, and the words that never translate cleanly.",
    memberIds: [],
    moderatorIds: [],
    topics: ["News", "Idioms", "Education", "Literature"],
    createdAt: now - 90 * DAY,
  },
  {
    id: "community-sheng",
    name: "Sheng Collective",
    languageId: "sheng",
    description:
      "Keepers of Sheng — the urban language that changes fastest and is documented least.",
    memberIds: [],
    moderatorIds: [],
    topics: ["Urban life", "Slang", "Music", "Work"],
    createdAt: now - 70 * DAY,
  },
  {
    id: "community-kikuyu",
    name: "Gĩkũyũ Writers' Circle",
    languageId: "kikuyu",
    description:
      "Prose, proverbs and the Central Kenya varieties of Gĩkũyũ.",
    memberIds: [],
    moderatorIds: [],
    topics: ["Proverbs", "Prose", "Agriculture"],
    createdAt: now - 60 * DAY,
  },
  {
    id: "community-somali",
    name: "Soomaali Hub",
    languageId: "somali",
    description:
      "Somali speakers across the diaspora — news, poetry, and family stories.",
    memberIds: [],
    moderatorIds: [],
    topics: ["Poetry", "Diaspora", "News"],
    createdAt: now - 45 * DAY,
  },
  {
    id: "community-maasai",
    name: "Maasai Storytellers",
    languageId: "maasai",
    description:
      "Oral tradition and stories, recorded with the community's permission.",
    memberIds: [],
    moderatorIds: [],
    topics: ["Oral tradition", "Stories", "Livestock"],
    createdAt: now - 30 * DAY,
  },
];

export const SEED_DISCOVER_ITEMS: DiscoverItem[] = [
  {
    id: "discover-001",
    title: "What Sheng reveals about how Kenyan cities actually talk",
    summary:
      "Sheng borrows from Swahili, English and older Kenyan vocabularies at a speed no textbook can keep up with. We look at what that does to translation.",
    topic: "culture",
    languages: ["sheng", "kiswahili"],
    source: "Samiati Editorial",
    publishedAt: now - 6 * 60 * 60 * 1000,
    readingMinutes: 6,
    saved: false,
  },
  {
    id: "discover-002",
    title: "Mobile money across East Africa, explained in plain language",
    summary:
      "How mobile money changed small trade across Kenya, Tanzania and Uganda — and the vocabulary that grew with it.",
    topic: "technology",
    languages: ["kiswahili", "somali"],
    source: "Samiati Editorial",
    publishedAt: now - DAY,
    readingMinutes: 8,
    saved: false,
  },
  {
    id: "discover-003",
    title: "Ten Kikuyu proverbs about farming and rain",
    summary:
      "Weather wisdom passed down in Gĩkũyũ, with translations and notes on when each one is used.",
    topic: "culture",
    languages: ["kikuyu"],
    source: "Gĩkũyũ Writers' Circle",
    publishedAt: now - 2 * DAY,
    readingMinutes: 5,
    saved: false,
  },
  {
    id: "discover-004",
    title: "The Maasai calendar, and what it still teaches",
    summary:
      "A pastoral calendar organised by rain and pasture rather than months — and what it says about planning.",
    topic: "history",
    languages: ["maasai"],
    source: "Maasai Storytellers",
    publishedAt: now - 3 * DAY,
    readingMinutes: 7,
    saved: false,
  },
  {
    id: "discover-005",
    title: "Reading Somali poetry aloud",
    summary:
      "Somali poetry is built to be heard. Why translation loses so much, and what can be saved.",
    topic: "education",
    languages: ["somali"],
    source: "Soomaali Hub",
    publishedAt: now - 4 * DAY,
    readingMinutes: 9,
    saved: false,
  },
  {
    id: "discover-006",
    title: "Inside the Kiswahili-language classrooms of Mombasa",
    summary:
      "Schools teaching in Kiswahili are producing some of the continent's strongest science graduates. A look inside.",
    topic: "education",
    languages: ["kiswahili"],
    source: "Samiati Editorial",
    publishedAt: now - 5 * DAY,
    readingMinutes: 10,
    saved: false,
  },
  {
    id: "discover-007",
    title: "Luhya naming traditions, explained",
    summary:
      "Why a Bukusu name and a Maragoli name are not interchangeable — and what each one signals.",
    topic: "culture",
    languages: ["luhya"],
    source: "Samiati Editorial",
    publishedAt: now - 6 * DAY,
    readingMinutes: 6,
    saved: false,
  },
  {
    id: "discover-008",
    title: "A week of headlines in Kiswahili",
    summary:
      "The stories Kenyans read this week, summarised in Kiswahili — and how Samiati translated them.",
    topic: "news",
    languages: ["kiswahili"],
    source: "Samiati Newsroom",
    publishedAt: now - 8 * 60 * 60 * 1000,
    readingMinutes: 4,
    saved: false,
  },
  {
    id: "discover-009",
    title: "Learning Dholuo as an adult",
    summary:
      "Dholuo is one of the easiest Kenyan languages to pick up once you already speak Kiswahili. Here is why.",
    topic: "education",
    languages: ["dholuo"],
    source: "Samiati Editorial",
    publishedAt: now - 7 * DAY,
    readingMinutes: 7,
    saved: false,
  },
  {
    id: "discover-010",
    title: "Voice input, finally, for Kiswahili",
    summary:
      "What it takes to make speech recognition genuinely usable in Kiswahili rather than merely available.",
    topic: "technology",
    languages: ["kiswahili", "sheng"],
    source: "Samiati Research",
    publishedAt: now - 9 * DAY,
    readingMinutes: 11,
    saved: false,
  },
];
