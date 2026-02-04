import React, { useState } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Globe,
    ChevronDown,
    Search,
    ArrowUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Language {
    code: string;
    nllbCode: string;
    name: string;
    score: number; // 0-100 used to determine level
}

// =============================================================================
// LANGUAGES CONFIGURATION
// =============================================================================
// Prioritizing Kenyan languages as per user request.
// NLLB (via Hugging Face) is the translation engine.
export const LANGUAGES: Language[] = [
    // --- KENYAN LANGUAGES (PRIORITY) ---
    {
        code: 'sw',
        nllbCode: 'swh_Latn',
        name: 'Swahili',
        score: 98
    },
    {
        code: 'ki',
        nllbCode: 'kik_Latn',
        name: 'Kikuyu',
        score: 88
    },
    {
        code: 'luo',
        nllbCode: 'luo_Latn',
        name: 'Luo',
        score: 85
    },
    {
        code: 'kam',
        nllbCode: 'kam_Latn',
        name: 'Kamba',
        score: 80
    },
    {
        code: 'kln',
        nllbCode: 'kln_Latn',
        name: 'Kalenjin',
        score: 78
    },
    {
        code: 'luy',
        nllbCode: 'luy_Latn',
        name: 'Luhya',
        score: 82
    },
    {
        code: 'mer',
        nllbCode: 'mer_Latn',
        name: 'Meru',
        score: 75
    },
    {
        code: 'mas',
        nllbCode: 'mas_Latn',
        name: 'Maasai',
        score: 70
    },
    // --- INTERNATIONAL ---
    {
        code: 'en',
        nllbCode: 'eng_Latn',
        name: 'English',
        score: 100
    },
];

interface LanguageSelectorProps {
    selectedLanguage: Language;
    onSelect: (lang: Language) => void;
    open?: boolean;             // Controlled state
    onOpenChange?: (open: boolean) => void; // Controlled state handler
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    selectedLanguage,
    onSelect,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
}) => {
    // Allow internal state if not controlled
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = controlledOpen ?? internalOpen;
    const onOpenChange = controlledOnOpenChange ?? setInternalOpen;

    const [search, setSearch] = useState("");

    const filteredLanguages = LANGUAGES.filter((lang) =>
        lang.name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => b.score - a.score);

    const getProficiencyLevel = (score: number) => {
        if (score >= 90) return "Expert";
        if (score >= 75) return "Advanced";
        if (score >= 50) return "Intermediate";
        return "Basic";
    };

    const handleSelect = (lang: Language) => {
        onSelect(lang);
        onOpenChange(false);
        setSearch("");
    };

    return (
        <Popover open={isOpen} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="mb-1 h-9 px-3 rounded-full gap-1.5 font-bold text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
                >
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">{selectedLanguage.name}</span>
                    <span className="sm:hidden">{selectedLanguage.code.toUpperCase()}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="start"
                className="w-[240px] p-0 mb-3 rounded-2xl shadow-xl border-border bg-background"
            >
                <div className="p-3 border-b border-border bg-muted/30">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search languages..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9 rounded-xl text-sm border-none bg-background focus-visible:ring-1 focus-visible:ring-primary/50"
                        />
                    </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-1 py-1.5">
                    {filteredLanguages.length > 0 ? (
                        filteredLanguages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleSelect(lang)}
                                className={cn(
                                    "w-full px-3 py-2.5 text-left hover:bg-muted transition-all flex items-center justify-between rounded-lg group",
                                    selectedLanguage.code === lang.code &&
                                    "bg-primary/5 shadow-inner"
                                )}
                            >
                                <div className="flex flex-col">
                                    <span
                                        className={cn(
                                            "text-sm font-bold",
                                            selectedLanguage.code === lang.code
                                                ? "text-primary"
                                                : "text-foreground"
                                        )}
                                    >
                                        {lang.name}
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                                        {getProficiencyLevel(lang.score)}
                                    </span>
                                </div>
                                {selectedLanguage.code === lang.code && (
                                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white scale-75">
                                        <ArrowUp className="w-4 h-4" />
                                    </div>
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="p-4 text-center text-muted-foreground text-xs italic font-medium">
                            No matching cultures found
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};
