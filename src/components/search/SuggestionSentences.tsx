"use client";

import React, { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Language } from "@/components/chat/LanguageSelector";

interface Suggestion {
  text: string;
  query: string;
}

// Language-specific trending search pools. Suggestions always mirror the
// language selected in the dropdown, so each search reads naturally.
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
  luo: [
    { text: "Ngech mag Luo", query: "Natina ngech mag Luo kod tiendgi" },
    { text: "Kend mar Luo", query: "Natina kit kend ma jo-Luo timo kod timbendgi" },
    { text: "Wend Luo", query: "Natina wend Luo kod tiendgi" },
    { text: "Chiemo mar Luo", query: "Natina chiemo ma jo-Luo damo e chiro" },
    { text: "Ker mar Luo", query: "Natina kit locho kod tich maguena jo-Luo" },
    { text: "Nying Luo", query: "Natina nying Luo kod tiendgi" },
  ],
  kam: [
    { text: "Methali za Kikamba", query: "Ndalutie methali za Kikamba na maana syao" },
    { text: "Kimiko kya Kikamba", query: "Ndalutie kimiko na mila sya Kikamba" },
    { text: "Nyimbo sya Kikamba", query: "Ndalutie nyimbo na kathemi sya Kikamba" },
    { text: "Kilyo kya Kikamba", query: "Ndalutie kilyo kya Kikamba" },
    { text: "Ukathi wa Akamba", query: "Ndalutie ukathi na kukite sya Akamba" },
    { text: "Kwatu wa Kikamba", query: "Ndalutie kwatu na nzasa sya Kikamba" },
  ],
  kln: [
    { text: "Mumek ab Kalenjin", query: "Agoi mumek ab Kalenjin kod tiendik" },
    { text: "Chamgei ak kumari", query: "Agoi kumari ak chamgei en Kalenjin" },
    { text: "Tiletis ak ng'wendek", query: "Agoi tiletis ak ng'wendek ab Kalenjin" },
    { text: "Kinok ak kwaishisiek", query: "Agoi kinok ak kwaishisiek ab Kalenjin" },
    { text: "Sodoik ak kipotonik", query: "Agoi sodoik ak kipotonik ab Kalenjin" },
    { text: "Kosiakikab Kalenjin", query: "Agoi kosiakikab Kalenjin" },
  ],
  luy: [
    { text: "Endakho ya Abaluhya", query: "Olonde endakho ne emilimo ya Abaluhya" },
    { text: "Olurimi lw'Abaluhya", query: "Oloni olurimi lw'Abaluhya nende emigabi" },
    { text: "Emisala ya Abaluhya", query: "Olonde emisala ya Abaluhya nende oburengi" },
    { text: "Obukwe bwa Abaluhya", query: "Oloni obukwe bwa Abaluhya" },
    { text: "Emboo sya Abaluhya", query: "Olonde emboo nende enyimbo sya Abaluhya" },
    { text: "Ebiayo bya Abaluhya", query: "Oloni ebiayo ebya Abaluhya" },
  ],
  mer: [
    { text: "Icro cia Kimeru", query: "Ooria icro cia Kimeru na micungeirie" },
    { text: "Mwiko wa Ameru", query: "Ooria mwiko wa Ameru na mainya mangaine" },
    { text: "Nyamario cia Ameru", query: "Ooria nyamario cia Ameru" },
    { text: "Ruoki rwa Kimeru", query: "Ooria ruoki na mila cia Kimeru" },
    { text: "Matata ma Ameru", query: "Ooria matata na maina ma Ameru" },
    { text: "Kwenu kwa Ameru", query: "Ooria kwenu na mario kwa Ameru" },
  ],
  mas: [
    { text: "Enkata o Maa", query: "Elakita enkata na ildet o Maa ilMaasai" },
    { text: "Emurran o Maa", query: "Elakita emurran na orore o Maa ilMaasai" },
    { text: "Enkipaata o Maa", query: "Elakita enkipaata na ilopil o Maa" },
    { text: "Ilchokki o Maa", query: "Elakita ilchokki o Maa na inkoilisho" },
    { text: "Enkang o Maa", query: "Elakita enkang na mparimo o Maa" },
    { text: "Orkonyek a Maa", query: "Elakita orkonyek na ildamatisho o Maa" },
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

function getSuggestions(language: Language): { suggestions: Suggestion[]; isFallback: boolean } {
  const pool = LANGUAGE_SUGGESTIONS[language.code];
  if (pool) return { suggestions: pool.slice(0, 4), isFallback: false };
  return { suggestions: LANGUAGE_SUGGESTIONS.en.slice(0, 4), isFallback: true };
}

interface SuggestionSentencesProps {
  selectedLanguage: Language;
  onSelect: (query: string) => void;
}

const SuggestionSentences: React.FC<SuggestionSentencesProps> = ({
  selectedLanguage,
  onSelect,
}) => {
  const { suggestions, isFallback } = useMemo(
    () => getSuggestions(selectedLanguage),
    [selectedLanguage]
  );

  return (
    <div className="mt-6 w-full max-w-2xl">
      <div className="flex items-center justify-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Trending Searches
        </span>
        {isFallback && (
          <span className="text-[9px] font-bold text-muted-foreground/50 bg-muted/50 px-1.5 py-0.5 rounded-full">
            in English
          </span>
        )}
      </div>
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