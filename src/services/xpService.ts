/**
 * XP (Experience Points) Service
 * Handles all XP calculations, level progression, and streak bonuses
 * for the Samiati contribution system.
 */

// Base XP values for each contribution type (awarded on approval)
export const XP_VALUES = {
    Word: 5,
    Phrase: 8,
    'Translate Paragraphs': 17,
    Proverb: 13,
    Story: 25,
    Song: 20,
    Riddle: 10,
    History: 27,
    Custom: 10, // Default for custom types
} as const;

// Bonus XP for contributions with audio attachments
export const AUDIO_BONUS = 7;

// Streak bonus thresholds
export const STREAK_BONUSES: Record<number, number> = {
    3: 3,    // 3-day streak
    7: 8,    // Weekly warrior
    14: 17,  // Dedicated contributor
    30: 33,  // Monthly milestone
    100: 167, // Century achievement
};

// Community validation bonuses (awarded when upvote milestones are hit)
export const VALIDATION_BONUSES: Record<number, number> = {
    5: 2,   // Community appreciates
    10: 5,  // Highly valued
    25: 10, // Outstanding
};

// Level thresholds (index = level - 1, value = total XP required)
export const LEVEL_THRESHOLDS = [
    0,     // Level 1: Newcomer
    17,    // Level 2: Apprentice
    67,    // Level 3: Contributor
    150,   // Level 4: Culture Keeper
    283,   // Level 5: Language Guardian
    483,   // Level 6: Story Weaver
    750,   // Level 7: Elder
    1083,  // Level 8: Sage
    1583,  // Level 9: Heritage Champion
    2416,  // Level 10: Language Master
];

export const LEVEL_TITLES = [
    'Newcomer',
    'Apprentice',
    'Contributor',
    'Culture Keeper',
    'Language Guardian',
    'Story Weaver',
    'Elder',
    'Sage',
    'Heritage Champion',
    'Language Master',
];

// Rare/endangered languages that get bonus multipliers
export const RARE_LANGUAGES = [
    'Suba', 'Ogiek', 'Yaaku', 'El Molo', 'Omotik', 'Dahalo',
    'Boni', 'Elmolo', 'Ongamo', 'Sogoo', 'Sanye', 'Aasax'
];

/**
 * Calculate base XP for a contribution
 */
export const calculateXP = (
    type: string,
    hasAudio: boolean = false,
    isFirstLanguageContribution: boolean = false,
    languageCode?: string
): number => {
    // Get base XP for contribution type (explicitly typed as number)
    let xp: number = XP_VALUES[type as keyof typeof XP_VALUES] ?? XP_VALUES.Custom;

    // Add audio bonus
    if (hasAudio) {
        xp += AUDIO_BONUS;
    }

    // Apply first language contribution multiplier (1.5x)
    if (isFirstLanguageContribution) {
        xp = Math.round(xp * 1.5);
    }

    // Apply rare language multiplier (1.5x)
    if (languageCode && RARE_LANGUAGES.some(lang =>
        lang.toLowerCase() === languageCode.toLowerCase()
    )) {
        xp = Math.round(xp * 1.5);
    }

    return xp;
};

/**
 * Get the user's level based on total XP
 */
export const getLevelFromXP = (xp: number): number => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            return i + 1;
        }
    }
    return 1;
};

/**
 * Get the level title for a given level
 */
export const getLevelTitle = (level: number): string => {
    return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] || 'Newcomer';
};

/**
 * Get XP needed for the next level
 */
export const getXPForNextLevel = (currentXP: number): { needed: number; total: number; progress: number } => {
    const currentLevel = getLevelFromXP(currentXP);

    if (currentLevel >= LEVEL_THRESHOLDS.length) {
        // Max level reached
        return { needed: 0, total: 0, progress: 100 };
    }

    const currentLevelThreshold = LEVEL_THRESHOLDS[currentLevel - 1];
    const nextLevelThreshold = LEVEL_THRESHOLDS[currentLevel];
    const xpInCurrentLevel = currentXP - currentLevelThreshold;
    const xpNeededForLevel = nextLevelThreshold - currentLevelThreshold;
    const progress = Math.round((xpInCurrentLevel / xpNeededForLevel) * 100);

    return {
        needed: nextLevelThreshold - currentXP,
        total: xpNeededForLevel,
        progress: Math.min(progress, 100),
    };
};

/**
 * Check if a streak milestone was hit and return bonus XP
 */
export const getStreakBonus = (streakDays: number): number => {
    // Find the highest milestone that matches
    const milestones = Object.keys(STREAK_BONUSES)
        .map(Number)
        .sort((a, b) => b - a);

    for (const milestone of milestones) {
        if (streakDays === milestone) {
            return STREAK_BONUSES[milestone];
        }
    }
    return 0;
};

/**
 * Check if a validation milestone was hit and return bonus XP
 */
export const getValidationBonus = (previousUpvotes: number, newUpvotes: number): number => {
    let bonus = 0;

    for (const [threshold, xp] of Object.entries(VALIDATION_BONUSES)) {
        const milestone = parseInt(threshold);
        // Check if we just crossed this milestone
        if (previousUpvotes < milestone && newUpvotes >= milestone) {
            bonus += xp;
        }
    }

    return bonus;
};

/**
 * Format XP display string
 */
export const formatXP = (xp: number): string => {
    if (xp >= 1000) {
        return `${(xp / 1000).toFixed(1)}k`;
    }
    return xp.toString();
};

/**
 * Check if user leveled up after gaining XP
 */
export const checkLevelUp = (previousXP: number, newXP: number): { leveledUp: boolean; newLevel: number } => {
    const previousLevel = getLevelFromXP(previousXP);
    const newLevel = getLevelFromXP(newXP);

    return {
        leveledUp: newLevel > previousLevel,
        newLevel,
    };
};
