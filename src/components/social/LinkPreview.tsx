
import React from 'react';

interface LinkPreviewProps {
    url: string;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({ url }) => {
    if (url.includes('samiati.app/story')) {
        return (
            <div className="mt-3 mb-1 rounded-md border border-stone-200 dark:border-white/10 overflow-hidden bg-stone-50 dark:bg-white/5 flex flex-col sm:flex-row group cursor-pointer hover:bg-stone-100 dark:hover:bg-white/10 transition-colors">
                <div className="h-32 sm:h-auto sm:w-32 bg-stone-300 dark:bg-stone-700 bg-cover bg-center shrink-0" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDTCkmqfVuPlLQ4IRyL2yV9d82xXGhUn6PZJQuyR-wOR0cvIaU2RmXVEYxrDKRF8LwvPO8ui_vLey4StEqf8CTMHBir5NqJ8BI6X6gXKzW2e5jtCmaOROPdLEoAJCmmFm51ht9zq7QwPnSBQC8TAqlJfRa5M4kLarJ9LqR6i2YIFBkKl3YmSCiPo77SFPw336bJQN6weNdBrPdUlu-Ta6wtwbzNsRkfyTwRr05-OJF-2JEsH1EwbuwH-dLxzpESsJxfK0fBRGIneoQ')` }}></div>
                <div className="p-4 flex flex-col justify-center">
                    <span className="text-xs font-bold text-primary uppercase mb-1">Story</span>
                    <h4 className="font-bold text-stone-900 dark:text-white leading-tight mb-1">The Spider's Web</h4>
                    <p className="text-xs text-stone-500 dark:text-text-muted line-clamp-2">A tale of Anansi and the Sky God. Discover the origin of stories.</p>
                </div>
            </div>
        );
    }
    return null;
};
