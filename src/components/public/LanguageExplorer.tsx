'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Globe2,
  HeartHandshake,
  Mail,
  MessageCircle,
  MicOff,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PRODUCT_LANGUAGES, getProductLanguage } from '@/lib/productLanguages';
import { useSettings } from '@/hooks/useSettings';

export function LanguageExplorer() {
  const { settings, updateSetting } = useSettings();
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestedLanguage, setRequestedLanguage] = useState('');
  const [variety, setVariety] = useState('');
  const [notice, setNotice] = useState('');
  const selected = getProductLanguage(settings.preferredLanguage);
  const regions = [...new Set(PRODUCT_LANGUAGES.map((language) => language.region))];
  const filtered = useMemo(() => {
    const query = search.toLocaleLowerCase().trim();
    return PRODUCT_LANGUAGES.filter(
      (language) =>
        (!query ||
          `${language.name} ${language.code} ${language.region} ${language.name === 'Kiswahili' ? 'Swahili' : ''} ${language.name === 'Dholuo' ? 'Luo' : ''}`
            .toLocaleLowerCase()
            .includes(query)) &&
        (region === 'all' || language.region === region) &&
        (availability === 'all' || language.text === availability)
    );
  }, [search, region, availability]);
  const requestHref = `mailto:hasb8882@gmail.com?subject=${encodeURIComponent(`Samiati language request: ${requestedLanguage.trim()}`)}&body=${encodeURIComponent(`I would like to request support for ${requestedLanguage.trim()}.\n\nLanguage variety or dialect: ${variety.trim() || 'Not specified'}\n\nAdditional context:\n`)}`;

  const openRequest = (name = '') => {
    setRequestedLanguage(name);
    setVariety('');
    setRequestOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/50 bg-background/95 px-4 backdrop-blur-md">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link href="/dashboard" aria-label="Back to chat"><ArrowLeft className="size-5" /></Link>
        </Button>
        <h1 className="font-display text-lg font-bold tracking-tight">Languages</h1>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-5 outline-none sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
          <div>
            <p className="text-sm font-bold">Your default: {selected?.name ?? 'Kiswahili'}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Saved on this device. You can switch language in chat at any time.
            </p>
          </div>
          <Button asChild className="min-h-11 rounded-xl">
            <Link href="/dashboard">
              Start chatting <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
        <section
          aria-label="Find languages"
          className="grid gap-3 rounded-xl border border-border/50 bg-muted/20 p-4 md:grid-cols-[1.5fr_1fr_1fr]"
        >
          <div>
            <label className="mb-2 block text-xs font-semibold" htmlFor="language-search">
              Search languages
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground"
              />
              <Input
                id="language-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Language name or region"
                className="h-12 bg-background pl-10"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold" htmlFor="language-region">
              Region
            </label>
            <select
              id="language-region"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className="h-12 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All regions</option>
              {regions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold" htmlFor="language-availability">
              Text availability
            </label>
            <select
              id="language-availability"
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              className="h-12 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All languages</option>
              <option value="configured">Experimental text chat</option>
              <option value="planned">Planned support</option>
            </select>
          </div>
        </section>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Text chat is experimental. Availability depends on the service, and quality varies between
          languages and varieties. Regional labels are broad and non-exclusive. Voice support is
          still being reviewed.
        </p>
        <div className="mt-7 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <p role="status">
            {filtered.length} {filtered.length === 1 ? 'language' : 'languages'} shown
          </p>
          <p role="status">{notice}</p>
        </div>
        {filtered.length ? (
          <div className="mt-4 grid items-stretch gap-3 sm:grid-cols-2">
            {filtered.map((language) => {
              const isDefault = language.code === settings.preferredLanguage;
              return (
                <article
                  key={language.code}
                  className="flex min-w-0 flex-col rounded-xl border border-border/50 bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <Globe2 aria-hidden="true" className="size-5 text-primary" />
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[0.6875rem] font-semibold text-muted-foreground">
                      {language.text === 'configured' ? 'Experimental text chat' : 'Planned'}
                    </span>
                  </div>
                  <h2 className="mt-3 font-display text-lg font-bold tracking-tight">{language.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{language.region}</p>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {language.note ??
                      'Explore in your own words. Text responses depend on the service; feedback is welcome as we improve coverage.'}
                  </p>
                  <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
                      <span>
                        {language.text === 'configured'
                          ? 'Text chat · experimental'
                          : 'Chat not available yet'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <MicOff aria-hidden="true" className="size-4 shrink-0" />
                      <span>
                        {language.voice === 'unavailable'
                          ? 'Voice not available'
                          : 'Voice availability under review'}
                      </span>
                    </li>
                  </ul>
                  {language.text === 'configured' ? (
                    <Button
                      type="button"
                      variant={isDefault ? 'secondary' : 'outline'}
                      className="mt-6 min-h-11 w-full whitespace-normal rounded-xl"
                      aria-pressed={isDefault}
                      onClick={() => {
                        updateSetting('preferredLanguage', language.code);
                        setNotice(`${language.name} is now your default chat language.`);
                      }}
                    >
                      {isDefault && <Check aria-hidden="true" className="size-4" />}
                      {isDefault ? 'Your default language' : 'Set as default'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-6 min-h-11 w-full rounded-xl"
                      onClick={() => openRequest(language.name)}
                    >
                      Request this language <Mail aria-hidden="true" className="size-4" />
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-border py-14 text-center">
            <Search aria-hidden="true" className="mx-auto size-6 text-primary" />
            <h2 className="mt-4 text-xl font-bold">No languages match yet.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Try another name, or clear your filters.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-5 min-h-11"
              onClick={() => {
                setSearch('');
                setRegion('all');
                setAvailability('all');
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
        <section className="mt-6 grid gap-5 rounded-2xl border border-border/50 bg-muted/20 p-4 md:grid-cols-2">
          <div>
            <HeartHandshake aria-hidden="true" className="size-5 text-primary" />
            <h2 className="mt-3 font-display text-lg font-bold">Contribute your language</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              A language label never tells the whole story. Share your variety and local context
              when contributing. Translated examples and autonyms will appear after linguistic
              review.
            </p>
            <Link
              className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold"
              href="/dashboard/changa"
            >
              Contribute with Changa <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="flex flex-col items-start justify-center md:border-l md:border-border md:pl-8">
            <h3 className="text-lg font-bold">Missing your language?</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Tell us what you would like to see. Requests open a draft in your email app; nothing
              is submitted automatically.
            </p>
            <Button className="mt-4 min-h-11 rounded-xl" onClick={() => openRequest()}>
              Request a language <Mail aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-4xl flex-wrap gap-5 border-t border-border/50 px-4 py-5 text-xs text-muted-foreground">
        <Link href="/dashboard">Back to Samiati</Link>
        <Link href="/privacy-policy">Privacy</Link>
        <Link href="/terms-of-service">Terms</Link>
      </footer>
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Make room for your language.</DialogTitle>
            <DialogDescription>
              Draft a language request to Samiati’s existing support contact. Your email app opens
              next; you decide whether to send it.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="requested-language" className="text-sm font-semibold">
            Language name
          </label>
          <Input
            id="requested-language"
            autoComplete="off"
            value={requestedLanguage}
            onChange={(event) => setRequestedLanguage(event.target.value)}
            placeholder="The language you would like to use"
            className="h-12"
          />
          <label htmlFor="requested-variety" className="text-sm font-semibold">
            Variety or dialect <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="requested-variety"
            autoComplete="off"
            value={variety}
            onChange={(event) => setVariety(event.target.value)}
            placeholder="How you describe your variety"
            className="h-12"
          />
          {requestedLanguage.trim() ? (
            <Button asChild className="mt-2 min-h-12">
              <a href={requestHref}>
                Draft request email <Mail aria-hidden="true" className="size-4" />
              </a>
            </Button>
          ) : (
            <Button disabled className="mt-2 min-h-12">
              Enter a language name
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            This does not register a request in Samiati until you send the email.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
