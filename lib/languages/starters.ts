/**
 * Starter prompts shown on the welcome screen.
 *
 * These are short, everyday phrases in each language. They are deliberately
 * simple and common so that a first-time user can send one with a single tap
 * and immediately see the assistant working in their language.
 *
 * Content lives here rather than in the registry because it is editorial and
 * will be revised with community review; the registry holds only structural
 * language metadata.
 */
export const STARTER_PROMPTS: Readonly<Record<string, readonly string[]>> = {
  en: [
    "Good morning",
    "Help me write a short message",
    "What is mobile money?",
  ],
  kiswahili: [
    "Habari za asubuhi",
    "Nisaidie kuandika barua",
    "Eleza kuhusu pesa ya simu",
  ],
  sheng: [
    "Mambo, uko sawa?",
    "Nisaidie kuandika barua",
    "Pesa ya simu inafanya kazi gani?",
  ],
  somali: [
    "Subax maanta ahay khusey",
    "Iiga inuu qor",
    "Wax ka lacagta mobile ah",
  ],
  kikuyu: [
    "Ũtukũ wa njoki rĩrĩa?",
    "Nindeithie kũandĩka barua",
    "Money ya simu ni nini?",
  ],
  kamba: [
    "Mũkũ wa kĩmũa?",
    "Nindeithie kũandĩka barua",
    "Money ya simu ni nini?",
  ],
  luhya: ["Amakuru!", "Shukrani sana", "Money ya simu ni nini?"],
  dholuo: ["Yamo!", "Asante nim", "Moni ya simu?"],
  kalenjin: ["Chebo!", "Shukrani sana", "Money ya simu?"],
  gusii: ["Bwake!", "Shukrani sana", "Money ya simu?"],
  meru: ["Karibu!", "Shukrani sana", "Money ya simu?"],
  maasai: ["Sopa!", "Asante", "Money ya simu?"],
};

/** Starter prompts for a language, with a safe English fallback. */
export function starterPrompts(languageId: string): readonly string[] {
  return (
    STARTER_PROMPTS[languageId] ?? [
      "Hello",
      "Help me write a short message",
      "What is mobile money?",
    ]
  );
}
