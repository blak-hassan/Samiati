
import React from 'react';

interface Props {
  goBack: () => void;
}

const PrivacyPolicyScreen: React.FC<Props> = ({ goBack }) => {
  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-[#2b1e19] transition-colors duration-300">
      <header className="flex items-center p-4 sticky top-0 bg-stone-50 dark:bg-[#2b1e19] z-10 border-b border-stone-200 dark:border-white/5">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-stone-900 dark:text-white ml-2">Privacy Policy</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 text-stone-800 dark:text-[#E7E5E4] leading-relaxed text-sm">
        <h2 className="text-lg font-bold mb-3 text-stone-900 dark:text-white">Data Collection</h2>
        <p className="mb-4">We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.</p>

        <h2 className="text-lg font-bold mb-3 text-stone-900 dark:text-white">Usage of Information</h2>
        <p className="mb-4">We use the information we collect to provide, maintain, and improve our services, such as to facilitate payments, send receipts, provide products and services you request (and send related information), develop new features, provide customer support to Users and Drivers, develop safety features, authenticate users, and send product updates and administrative messages.</p>

        <h2 className="text-lg font-bold mb-3 text-stone-900 dark:text-white">Data Sharing</h2>
        <p className="mb-4">We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including as follows: with third parties to provide you a service you requested through a partnership or promotional offering made by a third party or us.</p>

        <div className="h-10"></div>
      </main>
    </div>
  );
};

export default PrivacyPolicyScreen;
