import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as changa from '../src/lib/changa';
import * as history from '../src/components/chat/history';
import { Screen } from '../src/types';

// Offline handler checks execute the real component bodies and callbacks.
// Hooks and service transport are simulated; this is not a browser/React DOM test.
type Node = { type: unknown; props: Record<string, unknown> };
type Component = (props: Record<string, unknown>) => Node;
function load(relative: string, imports: Record<string, unknown>) {
  const path = fileURLToPath(new URL(`../${relative}`, import.meta.url));
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} as Record<string, unknown> };
  const require = createRequire(path);
  new Function('require', 'module', 'exports', code)(
    (id: string) => Object.hasOwn(imports, id) ? imports[id] : require(id), mod, mod.exports
  );
  return mod.exports.default as Component;
}
function hooks() {
  const state: unknown[] = [];
  let cursor = 0;
  let changed = false;
  const effects: Array<() => void> = [];
  return {
    effects,
    react: {
      useState(initial: unknown) {
        const slot = cursor++;
        if (!(slot in state)) state[slot] = typeof initial === 'function' ? initial() : initial;
        return [state[slot], (value: unknown) => {
          const next = typeof value === 'function' ? value(state[slot]) : value;
          if (!Object.is(next, state[slot])) changed = true;
          state[slot] = next;
        }];
      },
      useRef(initial: unknown) { const slot = cursor++; return state[slot] ??= { current: initial }; },
      useCallback(fn: unknown) { cursor++; return fn; },
      useEffect(fn: () => void) { cursor++; effects.push(fn); },
    },
    render(component: Component, props: Record<string, unknown> = {}): Node {
      let tree: Node;
      let attempts = 0;
      do {
        cursor = 0; changed = false; effects.length = 0;
        tree = component(props);
        if (++attempts > 20) throw new Error('Component did not settle');
      } while (changed);
      return tree;
    },
  };
}
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== 'object' || !('props' in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}
function text(value: unknown): string {
  if (Array.isArray(value)) return value.map(text).join('');
  if (typeof value === 'string') return value;
  return value && typeof value === 'object' && 'props' in value ? text((value as Node).props.children) : '';
}
function find(tree: Node, predicate: (node: Node) => boolean): Node {
  const match = nodes(tree).find(predicate);
  if (!match) throw new Error('Expected control was not rendered');
  return match;
}
function button(tree: Node, label: string) {
  return find(tree, node => typeof node.props.onClick === 'function' && text(node).trim() === label);
}
function click(node: Node) { return (node.props.onClick as () => unknown)(); }
const icons = new Proxy({}, { get: (_target, name) => String(name) });
afterEach(() => vi.unstubAllEnvs());

function reviewer() {
  vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', 'https://example.test');
  const h = hooks();
  const state = { queue: [{ _id: 'A', voteCount: 0 }, { _id: 'B', voteCount: 0 }], selected: '' };
  const vote = vi.fn<(args: Record<string, unknown>) => Promise<void>>().mockResolvedValue();
  const api = { changa: { validation: { listValidationQueue: 'queue', getValidationBundle: 'bundle',
    getSubmissionAssetUrl: 'audio', submitValidationVote: 'vote', escalateSubmission: 'escalate' } } };
  const wrapper = load('src/components/changa/ValidationRunner.tsx', {
    react: h.react, 'lucide-react': icons,
    'convex/react': {
      useQuery(ref: string, args: Record<string, string>) {
        if (ref === 'queue') return state.queue;
        if (ref === 'bundle') { state.selected = args.submissionId; return { assets: [], languageCode: 'sw', sourceText: state.selected }; }
        return null;
      },
      useMutation: () => vote,
    },
    '../../../convex/_generated/api': { api }, '@/lib/changa': changa,
    './ChangaShell': { ChangaShell: 'Shell' },
    '@/components/shared/ServiceUnavailable': { ServiceUnavailable: 'Unavailable' },
    ...Object.fromEntries(['button', 'card', 'label', 'textarea'].map(name => [
      `@/components/ui/${name}`, { [name[0].toUpperCase() + name.slice(1)]: name },
    ])),
  });
  const entry = wrapper({ goBack: vi.fn() });
  return { state, vote, render: () => h.render(entry.type as Component, entry.props) };
}

describe('review item interaction identity', () => {
  it.each(['reorder', 'arrival'] as const)('keeps entered details on A after a %s', async kind => {
    const r = reviewer();
    let tree = r.render();
    click(button(tree, 'Reject'));
    tree = r.render(); click(button(tree, 'Wrong language'));
    tree = r.render();
    (find(tree, node => node.type === 'textarea').props.onChange as (e: unknown) => void)({ target: { value: 'Note for A' } });
    r.state.queue = kind === 'reorder'
      ? [r.state.queue[1], r.state.queue[0]]
      : [{ _id: 'C', voteCount: 0 }, ...r.state.queue];
    tree = r.render();
    expect(r.state.selected).toBe('A');
    await click(button(tree, 'Reject'));
    expect(r.vote).toHaveBeenCalledWith(expect.objectContaining({ submissionId: 'A', comment: 'Note for A', vote: 'wrong_language' }));
  });

  it('clears old reasons and notes when A is no longer eligible', async () => {
    const r = reviewer();
    let tree = r.render(); click(button(tree, 'Reject'));
    tree = r.render(); click(button(tree, 'Wrong language'));
    tree = r.render();
    (find(tree, node => node.type === 'textarea').props.onChange as (e: unknown) => void)({ target: { value: 'For A only' } });
    r.state.queue = [r.state.queue[1]];
    tree = r.render();
    expect(r.state.selected).toBe('B');
    expect(find(tree, node => node.type === 'textarea').props.value).toBe('');
    await click(button(tree, 'Reject'));
    expect(r.vote).not.toHaveBeenCalled();
  });

  it('does not let a late A response erase B inputs', async () => {
    const r = reviewer();
    let resolve!: () => void;
    r.vote.mockImplementationOnce(() => new Promise<void>(done => { resolve = done; }));
    const pending = click(button(r.render(), 'Accept'));
    r.state.queue = [r.state.queue[1]];
    let tree = r.render();
    (find(tree, node => node.type === 'textarea').props.onChange as (e: unknown) => void)({ target: { value: 'New note for B' } });
    resolve(); await pending;
    tree = r.render();
    expect(r.state.selected).toBe('B');
    expect(find(tree, node => node.type === 'textarea').props.value).toBe('New note for B');
  });
});

function chat(props: Record<string, unknown>) {
  vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', '');
  const h = hooks();
  const navigate = vi.fn();
  const imports: Record<string, unknown> = {
    react: h.react, 'lucide-react': icons,
    'next/link': { __esModule: true, default: 'Link' },
    '@/components/SamiatiLogo': { __esModule: true, default: 'SamiatiLogo' },
    'convex/react': { useAction: () => { throw new Error('Offline test forbids services'); } },
    '../../../convex/_generated/api': { api: {} }, '@/types': { Screen },
    '@/components/chat/LanguageSelector': { LANGUAGES: [{ code: 'sw', name: 'Kiswahili' }], LanguageSelector: 'LanguageSelector' },
    '@/services/sunflowerService': {}, '@/components/ui/button': { Button: 'Button' },
    '@/components/shared/AppSidebar': { AppSidebar: 'AppSidebar' },
    '@/components/SamiatiLogo': { __esModule: true, default: 'SamiatiLogo' },
    '@/lib/productLanguages': { getProductLanguage: () => ({ voice: 'unavailable' }) },
    '@/hooks/useSettings': { useSettings: () => ({ settings: { preferredLanguage: 'sw' }, updateSetting: vi.fn() }) },
    '@/lib/settings': { formatMessageTime: () => '' },
    '@/components/chat/history': history, '@/lib/utils': { cn: () => '' },
  };
  for (const [path, name] of [
    ['search/SearchHero', 'SearchHero'], ['search/SuggestionSentences', 'Suggestions'],
    ['search/SearchPhaseIndicator', 'Phase'], ['search/SearchResults', 'Results'], ['feedback/FeedbackBar', 'Feedback'],
  ]) imports[`@/components/${path}`] = { __esModule: true, default: name };
  const wrapper = load('src/components/screens/HomeSearchScreen.tsx', imports);
  const entry = wrapper({ ...props, navigate });
  return { navigate, hooks: h, render: () => h.render(entry.type as Component, entry.props) };
}

describe('guest sign-in intent', () => {
  it.each(['header', 'sidebar', 'send'] as const)('preserves the edited question through %s', async action => {
    const c = chat({ initialQuery: 'Original Discover question' });
    let tree = c.render();
    let hero = find(tree, node => node.type === 'SearchHero');
    (hero.props.onValueChange as (value: string) => void)('Edited & private question?');
    tree = c.render();
    if (action === 'header') click(button(tree, 'Sign in'));
    else if (action === 'sidebar') (find(tree, node => node.type === 'AppSidebar').props.onNavigate as (screen: Screen) => void)(Screen.SIGN_IN);
    else {
      hero = find(tree, node => node.type === 'SearchHero');
      await (hero.props.onSubmit as (value: string) => Promise<void>)('Edited & private question?');
    }
    const [screen, params] = c.navigate.mock.lastCall!;
    expect(screen).toBe(Screen.SIGN_IN);
    const destination = new URL(params.redirect_url, 'https://example.test');
    expect(destination.searchParams.get(action === 'send' ? 'q' : 'draft')).toBe('Edited & private question?');
    expect(destination.searchParams.has(action === 'send' ? 'draft' : 'q')).toBe(false);
  });

  it('restores an authenticated draft without executing a send effect', () => {
    const c = chat({ user: { isGuest: false }, initialDraft: 'Restored question' });
    const tree = c.render();
    expect(find(tree, node => node.type === 'SearchHero').props.value).toBe('Restored question');
    const initialSend = c.hooks.effects.find(effect => effect.toString().includes('initialQueryRef'));
    expect(initialSend).toBeDefined();
    initialSend!();
    expect(find(c.render(), node => node.type === 'SearchHero').props.value).toBe('Restored question');
    expect(c.navigate).not.toHaveBeenCalled();
  });
});
