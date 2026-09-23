// src/lib/languages.ts
// Content data for the public language pages (/languages/<slug>).
// Each entry powers a genuinely useful page — overview, history, facts,
// and sample phrases — rather than a thin duplicate for SEO.
// See implementation plan §6.2.

export type SamplePhrase = {
  text: string;
  translation: string;
};

export type LanguagePageData = {
  slug: string;
  /** Short code used by the in-app LanguageSelector (src/components/chat/LanguageSelector.tsx). */
  code: string;
  /** NLLB-200 code when the translation engine supports the language; null otherwise. */
  nllbCode: string | null;
  name: string;
  nativeName: string;
  family: string;
  region: string;
  speakers: string;
  tagline: string;
  overview: string;
  history: string;
  facts: string[];
  phrases: SamplePhrase[];
  dialects?: string[];
};

export const LANGUAGE_PAGES: LanguagePageData[] = [
  {
    slug: 'swahili',
    code: 'sw',
    nllbCode: 'swh_Latn',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    family: 'Niger-Congo (Bantu)',
    region: 'Kenyan coast & Tanzania; lingua franca across East Africa',
    speakers: '100M+ speakers worldwide',
    tagline: 'The lingua franca of East Africa.',
    overview:
      'Kiswahili is the most widely spoken African language in the world — the shared language of over 100 million people across Kenya, Tanzania, Uganda, the DRC and beyond. It is one of the official languages of Kenya and the African Union, and the working language of East African trade, media, and education.',
    history:
      'Swahili grew as a coastal trade language, blending Bantu grammar with vocabulary borrowed from Arabic, Persian, and later Portuguese and English — the name itself comes from the Arabic sawāḥil, "coasts". With over a thousand years of written poetry and prose, Kiswahili has one of the deepest literary traditions of any African language.',
    facts: [
      'Swahili is an official language of the African Union and the East African Community.',
      'Roughly a third of Swahili vocabulary traces back to Arabic — a legacy of Indian Ocean trade.',
      'UNESCO celebrates World Kiswahili Language Day every 7 July.',
      'Words you already use — safari, simba, jambo, hakuna matata — all come from Kiswahili.',
    ],
    phrases: [
      { text: 'Habari yako?', translation: 'How are you?' },
      { text: 'Asante sana', translation: 'Thank you very much' },
      { text: 'Karibu', translation: 'Welcome' },
      { text: 'Hakuna matata', translation: 'No worries / no problem' },
    ],
  },
  {
    slug: 'kikuyu',
    code: 'ki',
    nllbCode: 'kik_Latn',
    name: 'Kikuyu',
    nativeName: 'Gĩkũyũ',
    family: 'Niger-Congo (Bantu)',
    region: 'Central Kenya, around Mount Kenya',
    speakers: '~6.6M speakers',
    tagline: "The language of the Agĩkũyũ, Kenya's largest community.",
    overview:
      "Gĩkũyũ is the language of the Agĩkũyũ people of central Kenya — the country's largest community. It is a tonal Bantu language with a rich oral tradition of proverbs, songs, and riddles, and it remains a first language for millions despite the pull of English and Kiswahili in urban life.",
    history:
      "Gĩkũyũ has been written in the Latin alphabet since the early twentieth century, when missionaries and Kikuyu scholars worked out a shared orthography. It was the language of Kenya's independence movement: the Mau Mau years, Jomo Kenyatta's speeches, and much of the anti-colonial literature of the 1950s circulated in Gĩkũyũ.",
    facts: [
      "Gĩkũyũ is a tonal language — pitch can change a word's meaning entirely.",
      "It is the first language of Kenya's largest community.",
      "Novelist Ngũgĩ wa Thiong'o moved his writing into Gĩkũyũ to champion African-language literature.",
      'Proverbs (thimo) are a pillar of Kikuyu oral teaching — short, dense lines that carry whole lessons.',
    ],
    phrases: [
      { text: 'Ũhoro waku?', translation: 'How are you?' },
      { text: 'Wĩ mwega?', translation: 'Are you well?' },
      { text: 'Nĩ mwega', translation: 'I am fine' },
      { text: 'Thayũ', translation: 'Peace (a common farewell)' },
    ],
  },
  {
    slug: 'dholuo',
    code: 'luo',
    nllbCode: 'luo_Latn',
    name: 'Luo',
    nativeName: 'Dholuo',
    family: 'Nilotic (Western Nilotic)',
    region: 'Around Lake Victoria, western Kenya',
    speakers: '~4.4M speakers',
    tagline: 'The language of the people of the lake.',
    overview:
      "Dholuo is spoken by the Joluo people around Lake Victoria in western Kenya. Unlike the Bantu languages that surround it, it belongs to the Nilotic family, and it is known for its complex verb system, its dense proverb tradition, and the famous wit of its speakers.",
    history:
      'The Luo trace their origins to migrations from the Sudan–Uganda region several centuries ago, settling along the bays of Lake Victoria. Dholuo carried an oral tradition of praise poetry and song that later shaped Kenyan music — from the guitar lines of benga to the speeches of its best-known political voices.',
    facts: [
      'Dholuo is a Western Nilotic language — a different family from Kenya\u2019s Bantu languages like Swahili or Kikuyu.',
      'Benga music, born around Lake Victoria, pairs Dholuo lyrics with shimmering guitar work.',
      'Luo naming often marks the circumstances of the day a child is born — rain, journey, or joy can all live inside a name.',
      'Erokamano — "thank you" — is one of the best-known Dholuo words far beyond Nyanza.',
    ],
    phrases: [
      { text: 'Erokamano', translation: 'Thank you' },
      { text: 'Omera', translation: 'My friend / brother (term of address)' },
      { text: 'In yawa?', translation: 'What\u2019s up, dear?' },
      { text: 'Ber', translation: 'Good / fine' },
    ],
  },
  {
    slug: 'kalenjin',
    code: 'kln',
    nllbCode: null,
    name: 'Kalenjin',
    nativeName: 'Kaleñjin',
    family: 'Nilotic (Southern Nilotic)',
    region: 'Rift Valley, western Kenya',
    speakers: '~5M speakers',
    tagline: "The language of Kenya's Rift Valley runners.",
    overview:
      'Kalenjin is the shared name for a cluster of related dialects — including Kipsigis, Nandi, Tugen, Keiyo, Marakwet and Sabaot — spoken across the Kenyan Rift Valley. The collective name itself was coined in the 1940s from the phrase kaalee-jiiin, roughly "I say (to you)".',
    history:
      'The individual Kalenjin communities each carried their own dialect and oral history, but the twentieth century brought them a common identity and a common name. From that unity came a shared literary and musical culture — and an athletic one: the phrase "Kalenjin runners" became world shorthand for long-distance running excellence.',
    facts: [
      'The name "Kalenjin" was adopted as a collective label only in the 1940s — before that each dialect community stood separately.',
      'It comes from the phrase kaalee-jiiin, roughly "I say (to you)".',
      'Kalenjin-speaking athletes dominate world long-distance running, from steeplechase to the marathon.',
      'Kalenjin is a Southern Nilotic language — a different branch of Nilotic from Dholuo.',
    ],
    phrases: [
      { text: 'Suge', translation: 'Hello / be well (greeting)' },
      { text: 'Kongoi', translation: 'Thank you / well done' },
      { text: 'Iyie', translation: 'Yes / okay' },
    ],
    dialects: ['Kipsigis', 'Nandi', 'Tugen', 'Keiyo', 'Marakwet', 'Pokot', 'Sabaot'],
  },
  {
    slug: 'luhya',
    code: 'luy',
    nllbCode: null,
    name: 'Luhya',
    nativeName: 'Oluluhya',
    family: 'Niger-Congo (Bantu)',
    region: 'Western Kenya: Bungoma, Kakamega, Busia',
    speakers: '~6.8M speakers',
    tagline: 'A community of dialects, dance, and bullfights.',
    overview:
      'Luhya is an umbrella for about eighteen closely related Bantu dialects — Bukusu, Maragoli, Wanga, Marama, Tiriki, Idakho, Isukha and more — spoken in western Kenya. Many speakers move between several dialects in a single day, and the shared culture binds them tightly together.',
    history:
      'The Luhya communities settled the fertile lands between Lake Victoria and Mount Elgon, where farming, cattle-keeping and trade shaped their languages. Their cultural life is famously vivid: the isukuti dance ensemble is recognised by UNESCO as intangible cultural heritage, and bullfighting among the Isukha and Idakho remains a living festival tradition.',
    facts: [
      '"Luhya" covers roughly eighteen related dialects, many with their own speakers and poets.',
      'The isukuti dance is recognised by UNESCO as intangible cultural heritage of humanity.',
      'Traditional bullfighting in Kakamega county is a centuries-old festival sport.',
      'The Luhya are among the largest Bantu-speaking communities in Kenya after the Agĩkũyũ.',
    ],
    phrases: [
      { text: 'Bulayi', translation: 'Good / I am fine' },
      { text: 'Webale', translation: 'Thank you' },
    ],
    dialects: ['Bukusu', 'Maragoli', 'Wanga', 'Marama', 'Tiriki', 'Idakho', 'Isukha'],
  },
  {
    slug: 'kamba',
    code: 'kam',
    nllbCode: 'kam_Latn',
    name: 'Kamba',
    nativeName: 'Kĩkamba',
    family: 'Niger-Congo (Bantu)',
    region: 'Eastern Kenya: Machakos, Makueni, Kitui',
    speakers: '~4.2M speakers',
    tagline: 'The language of the hills and the carvers.',
    overview:
      'Kĩkamba is spoken by the Akamba people of eastern Kenya, in the hill country between Nairobi and Tsavo. It is a tonal Bantu language with a strong proverb tradition (mathumbwi) and a legendary reputation for craftsmanship and long-distance trade — the Akamba carvers of Wamunyu and the traders who once walked caravans to the coast are part of the language\u2019s story.',
    history:
      'For centuries Akamba traders moved goods between the interior and the Swahili coast, and Kĩkamba absorbed and loaned words along those routes. After the colonial railway ended the caravans, the community\u2019s artistry shifted to wood carving — the Wamunyu and Mwingi carvers became internationally known, and much of their apprenticeship teaching still happens in Kĩkamba.',
    facts: [
      'Kĩkamba is a tonal language; the same consonants at a different pitch can mean different things.',
      'The Wamunyu wood carvers of the Akamba are internationally recognized artists.',
      'Akamba traders once walked caravans all the way to Mombasa before the railway.',
      'Proverbs — mathumbwi — are the backbone of Kamba oral teaching.',
    ],
    phrases: [
      { text: 'Wasya?', translation: 'Hello / how are you?' },
      { text: 'Kalonza', translation: 'Come here / please come' },
      { text: 'Mbee', translation: 'Ahead / forward (common in speech)' },
    ],
  },
  {
    slug: 'somali',
    code: 'som',
    nllbCode: 'som_Latn',
    name: 'Somali',
    nativeName: 'Soomaaliga',
    family: 'Afro-Asiatic (Cushitic)',
    region: 'Horn of Africa — Somalia, Djibouti, Ethiopia, and north-eastern Kenya',
    speakers: '~24M+ speakers',
    tagline: 'The nation of poets.',
    overview:
      'Soomaaliga is a Cushitic language spoken by more than twenty million people across the Horn of Africa, including the Somali community of north-eastern Kenya. It is one of the best-described languages of the region, with a poetry tradition so central to its culture that Somalia is often called a "nation of poets".',
    history:
      'Somali has been written in several scripts over its history — including the invented Osmanya script — before Latin orthography was adopted in 1972. Since then, written Somali literature, journalism, and scholarship have grown quickly, while oral poetry remains the heartbeat of the culture: a skilled gabay (epic poem) can settle a dispute or crown a reputation.',
    facts: [
      'Somali adopted a Latin-based orthography in 1972, after decades of script debate.',
      'The Osmanya script, invented in the 1920s, was one of several native Somali writing systems.',
      'Poets still use the gabay — a long, strict-meter epic poem — to argue, praise, and remember.',
      'In Kenya, Somali is spoken in the North Eastern region, one of the country\u2019s largest language communities.',
    ],
    phrases: [
      { text: 'Sidee tahay?', translation: 'How are you?' },
      { text: 'Mahadsanid', translation: 'Thank you' },
      { text: 'Soo dhawoow', translation: 'Welcome' },
    ],
  },
  {
    slug: 'sheng',
    code: 'sheng',
    nllbCode: null,
    name: 'Sheng',
    nativeName: 'Sheng',
    family: 'Kiswahili-based urban slang (code-switching)',
    region: 'Nairobi and Kenyan urban centres',
    speakers: 'Millions of urban speakers',
    tagline: "Nairobi's ever-changing mother tongue.",
    overview:
      'Sheng is not a single village language — it is Nairobi\u2019s living slang, built on a Kiswahili skeleton with English filler and muscle from Kikuyu, Dholuo, Kamba, and every community that makes the city. It changes fast: a word can be cool in January and retired by December.',
    history:
      'Sheng emerged in Nairobi\u2019s working-class estates in the 1960s–70s as young people mixed Kiswahili and English across community lines. Once dismissed as street talk, it now fills radio, advertising, hip-hop and gospel music, and even parliamentary jokes — while continuing to reinvent itself in every neighbourhood.',
    facts: [
      'Sheng\u2019s grammar is mainly Kiswahili; its vocabulary borrows from English and every Kenyan language in the city.',
      'It is deliberately fast-moving — speakers coin new words as older ones go stale.',
      'Sheng drives Kenyan popular music, from genge and kapuka to modern drill.',
      'Changa, Samiati\u2019s contribution programme, actively collects Sheng vocabulary and examples.',
    ],
    phrases: [
      { text: 'Sasa?', translation: 'What\u2019s up?' },
      { text: 'Niko poa', translation: 'I\u2019m cool / I\u2019m fine' },
      { text: 'Mambo', translation: 'Hello / what\u2019s up?' },
      { text: 'Chapaa', translation: 'Money' },
    ],
  },
];

/** Slugs of all language pages, in display order. */
export const LANGUAGE_PAGE_SLUGS = LANGUAGE_PAGES.map((l) => l.slug);

export function getLanguageBySlug(slug: string): LanguagePageData | undefined {
  return LANGUAGE_PAGES.find((l) => l.slug === slug);
}
