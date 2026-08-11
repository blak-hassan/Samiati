"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Language } from "@/components/chat/LanguageSelector";

interface UserInfo {
  name?: string;
  location?: string;
  culturalBackground?: string;
  languages?: { name: string; level: string }[];
}

interface Suggestion {
  text: string;
  query: string;
}

// Language-specific suggestion pools
const LANGUAGE_SUGGESTIONS: Record<string, Suggestion[]> = {
  sw: [
    { text: "Nifundisha methali za Kiswahili", query: "Nifundisha methali za Kiswahili na maana yake" },
    { text: "Hadithi za watu wa Kenya", query: "Ni hadithi gani maarufu za watu wa Kenya?" },
    { text: "Maneno ya kawaida ya Kikuyu", query: "Nipe maneno ya kawaida ya Kikuyu na tafsiri yake" },
    { text: "Utamaduni wa Wamaasai", query: "Eleza utamaduni na mila za Wamaasai" },
    { text: "Nyimbo za jadi za Kenya", query: "Ni nyimbo gani za jadi za Kenya na maana yake?" },
    { text: "Historia ya Lugha za Kenya", query: "Ni lugha ngapi zinazozungumzwa Kenya na historia yake?" },
    { text: "Mila za harusi za Kikuyu", query: "Eleza mila za harusi za jamii ya Kikuyu" },
    { text: "Maneno ya Luo na tafsiri", query: "Nipe maneno ya Luo na tafsiri yake Kiswahilini" },
  ],
  ki: [
    { text: "Ni mathagu ma Kikuyu?", query: "Nigatuoke mathagu mothe ma Kikuyu na thimuthio wake" },
    { text: "Warete wa guthiomi", query: "Nigatuoke warete wa guthiomi ma Kikuyu" },
    { text: "Muthoni wa guku wa Kikuyu", query: "Nigatuoke muthoni wa guku na thuthuthu wa Kikuyu" },
    { text: "Irio na ngano ya Kikuyu", query: "Nithuire irio na ngano ya Kikuyu" },
    { text: "Mathagu ma guku", query: "Nigatuoke mathagu ma guku na thimuthio wake" },
    { text: "Ruti ya Kikuyu", query: "Nigatuoke ruti ya Kikuyu na mila yake" },
    { text: "Kiama kia Kikuyu", query: "Nithuire kiama kia Kikuyu na thuthuthu wake" },
    { text: "Mihiriga ya Kikuyu", query: "Nigatuoke mihiriga ya Kikuyu na thuthuthu yothe" },
  ],
  en: [
    { text: "Tell me about Kenyan proverbs", query: "What are some famous Kenyan proverbs and their meanings?" },
    { text: "Explain Kikuyu cultural traditions", query: "Tell me about Kikuyu cultural traditions and ceremonies" },
    { text: "What are common Luo greetings?", query: "What are common greetings and phrases in Luo language?" },
    { text: "History of Maa people", query: "Tell me about the history and culture of the Maa people of Kenya" },
    { text: "Traditional Kenyan songs", query: "What are some traditional Kenyan songs and their cultural significance?" },
    { text: "Languages spoken in Kenya", query: "How many languages are spoken in Kenya and what are they?" },
    { text: "Maasai beadwork meanings", query: "What do the different colors in Maasai beadwork mean?" },
    { text: "Swahili sayings about life", query: "What are some Swahili sayings about life and wisdom?" },
  ],
};

// Location-based suggestions
const LOCATION_SUGGESTIONS: Record<string, Suggestion[]> = {
  Nairobi: [
    { text: "History of Nairobi", query: "Tell me about the history of Nairobi and its cultural heritage" },
    { text: "Languages in Nairobi", query: "What languages and cultures coexist in Nairobi?" },
  ],
  Mombasa: [
    { text: "Swahili culture in Mombasa", query: "Tell me about Swahili culture and traditions in Mombasa" },
    { text: "Mijikenda traditions", query: "What are the traditions of the Mijikenda community in Mombasa?" },
  ],
  Kisumu: [
    { text: "Luo traditions in Kisumu", query: "Tell me about Luo cultural traditions in Kisumu" },
    { text: "Lake Victoria folklore", query: "What folk tales are told around Lake Victoria?" },
  ],
  Nakuru: [
    { text: "Rift Valley cultures", query: "What cultures and communities live in the Rift Valley region?" },
    { text: "Kalenjin traditions", query: "Tell me about Kalenjin cultural traditions and ceremonies" },
  ],
  Eldoret: [
    { text: "Kalenjin running culture", query: "What is the cultural significance of running among the Kalenjin?" },
    { text: "Kalenjin songs and dance", query: "Tell me about traditional Kalenjin songs and dance" },
  ],
};

// Interest-based suggestions
const INTEREST_SUGGESTIONS: Record<string, Suggestion[]> = {
  music: [
    { text: "Traditional instruments", query: "What traditional musical instruments are used in Kenyan cultures?" },
    { text: "Folk songs of Kenya", query: "Tell me about folk songs from different Kenyan communities" },
  ],
  food: [
    { text: "Traditional Kenyan foods", query: "What are traditional foods from different Kenyan communities?" },
    { text: "Food culture of Kikuyu", query: "Tell me about traditional Kikuyu food culture" },
  ],
  history: [
    { text: "Pre-colonial Kenya", query: "Tell me about pre-colonial history of Kenya and its peoples" },
    { text: "Coastal trade history", query: "What is the history of the Swahili coast and trade?" },
  ],
  language: [
    { text: "Learn basic Swahili", query: "Teach me basic Swahili greetings and phrases" },
    { text: "Swahili proverbs", query: "What are some common Swahili proverbs and their meanings?" },
  ],
};

function getSuggestions(language: Language, user?: UserInfo): Suggestion[] {
  const langKey = language.code;
  const suggestions: Suggestion[] = [];

  // Start with location-based suggestions if user has location
  if (user?.location) {
    const locationKey = Object.keys(LOCATION_SUGGESTIONS).find(
      (k) => user.location?.toLowerCase().includes(k.toLowerCase())
    );
    if (locationKey) {
      suggestions.push(...LOCATION_SUGGESTIONS[locationKey]);
    }
  }

  // Add interest-based suggestions if user has cultural background
  if (user?.culturalBackground) {
    const interestKey = Object.keys(INTEREST_SUGGESTIONS).find((k) =>
      user.culturalBackground?.toLowerCase().includes(k.toLowerCase())
    );
    if (interestKey) {
      suggestions.push(...INTEREST_SUGGESTIONS[interestKey]);
    }
  }

  // Fill remaining slots with language-specific suggestions
  const langSuggestions = LANGUAGE_SUGGESTIONS[langKey] || LANGUAGE_SUGGESTIONS.en;
  for (const s of langSuggestions) {
    if (suggestions.length >= 4) break;
    const isDuplicate = suggestions.some((existing) => existing.query === s.query);
    if (!isDuplicate) {
      suggestions.push(s);
    }
  }

  // If still less than 3, add from English fallback
  if (suggestions.length < 3) {
    for (const s of LANGUAGE_SUGGESTIONS.en) {
      if (suggestions.length >= 3) break;
      const isDuplicate = suggestions.some((existing) => existing.query === s.query);
      if (!isDuplicate) {
        suggestions.push(s);
      }
    }
  }

  return suggestions.slice(0, 4);
}

interface SuggestionSentencesProps {
  selectedLanguage: Language;
  user?: UserInfo;
  onSelect: (query: string) => void;
}

const SuggestionSentences: React.FC<SuggestionSentencesProps> = ({
  selectedLanguage,
  user,
  onSelect,
}) => {
  const suggestions = useMemo(
    () => getSuggestions(selectedLanguage, user),
    [selectedLanguage, user]
  );

  return (
    <div className="w-full max-w-2xl">
      <div className="flex flex-col gap-1.5">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSelect(suggestion.query)}
            className={cn(
              "text-left px-4 py-2.5 rounded-xl transition-all duration-200",
              "text-sm font-medium text-muted-foreground",
              "hover:bg-card/50 hover:text-foreground hover:pl-5",
              "active:scale-[0.98]"
            )}
          >
            {suggestion.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestionSentences;
