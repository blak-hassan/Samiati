
import { Challenge } from '@/types';

export const MOCK_CHALLENGES: Challenge[] = [
    {
        id: 'c_active_1',
        title: 'The Kikuyu Accent Archive',
        description: 'We need 500 voices to preserve the authentic sounds of Kikuyu dialects from Nyeri and Kiambu.',
        type: 'ACCENT',
        image: 'https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?auto=format&fit=crop&q=80&w=2000',
        goalMetric: 'Recordings',
        goalCount: 500,
        currentCount: 342,
        deadline: '2025-12-31',
        roles: [
            { userId: 'Wanjiku', role: 'LEAD' },
            { userId: 'Kamau', role: 'CONTRIBUTOR' }
        ],
        customConfig: { region: 'Central Kenya' }
    },
    {
        id: 'c_active_2',
        title: 'Map the Deep Sheng',
        description: 'Pin the locations where specific Sheng slang words originated or are most popular today.',
        type: 'DIALECT',
        image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000',
        goalMetric: 'Pins',
        goalCount: 100,
        currentCount: 12,
        deadline: '2026-02-15',
        roles: [
            { userId: 'Ochieng', role: 'LEAD' }
        ]
    },
    {
        id: 'c_completed_1',
        title: 'Ancient Symbols Registry',
        description: 'Documenting the lost symbols of the Mijikenda kayas.',
        type: 'TOTEM',
        image: 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?auto=format&fit=crop&q=80&w=2000',
        goalMetric: 'Images',
        goalCount: 50,
        currentCount: 50,
        deadline: '2024-11-20',
        roles: [
            { userId: 'Zahra', role: 'LEAD' }
        ]
    }
];
