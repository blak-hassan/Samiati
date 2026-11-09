/**
 * Translation routing.
 *
 * Different languages need different models. Kiswahili has strong dedicated
 * models; Sheng has nothing dedicated at all, so it needs a general
 * multilingual model plus contributions from Changa.
 *
 * The router holds an ordered list of services and picks the first one that
 * covers the language pair. It is a `TranslationService` itself, so the rest
 * of the application does not need to know that routing exists.
 */

import type {
  TranslationRequest,
  TranslationResult,
  TranslationService,
} from "./types";

export interface TranslationRoute {
  /** A stable id for the route, used in logs and in the settings panel. */
  id: string;
  label: string;
  service: TranslationService;
  /** The language ids this route covers. `"*"` means every language. */
  languages: readonly string[];
}

export class RoutedTranslationService implements TranslationService {
  readonly id = "routed";
  readonly label: string;
  readonly isMock: boolean;
  readonly supportedLanguageIds: readonly string[];

  private readonly routes: readonly TranslationRoute[];

  constructor(routes: readonly TranslationRoute[]) {
    this.routes = routes;
    this.label =
      routes.length > 0
        ? routes.map((route) => route.label).join(" → ")
        : "No translation route configured";
    this.isMock = routes.every((route) => route.service.isMock);
    this.supportedLanguageIds = [
      ...new Set(
        routes.flatMap((route) =>
          route.languages.includes("*")
            ? [...route.service.supportedLanguageIds]
            : [...route.languages],
        ),
      ),
    ];
  }

  /** The routes, in the order they are tried. */
  get routeList(): readonly TranslationRoute[] {
    return this.routes;
  }

  /**
   * Picks the best route for a language pair.
   *
   * A route must cover both the source and the target language. The first
   * matching route wins, so specific routes are listed before general ones.
   */
  private select(
    sourceLanguageId: string,
    targetLanguageId: string,
  ): TranslationRoute | undefined {
    return this.routes.find((route) => {
      const covers = (languageId: string) =>
        route.languages.includes("*") || route.languages.includes(languageId);
      return covers(sourceLanguageId) && covers(targetLanguageId);
    });
  }

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const route = this.select(
      request.sourceLanguageId,
      request.targetLanguageId,
    );

    if (!route) {
      throw new Error(
        `No translation route covers ${request.sourceLanguageId} → ${request.targetLanguageId}`,
      );
    }

    const result = await route.service.translate(request);
    return { ...result, provider: `${this.id}:${route.id}` };
  }

  async detectLanguage(text: string) {
    // Detection is a general task: a dedicated model is tuned for one
    // language, so the general route is the one to ask.
    const route =
      this.routes.find((candidate) => candidate.languages.includes("*")) ??
      this.routes[0];
    if (!route) {
      return { languageId: "en", confidence: 0, isMock: true };
    }
    return route.service.detectLanguage(text);
  }
}

/**
 * Builds the routes from the environment.
 *
 * A dedicated model for a language wins over the general multilingual model.
 */
export function buildTranslationRoutes(
  services: {
    general?: TranslationService;
    dedicated?: Record<string, TranslationService>;
  },
): RoutedTranslationService {
  const routes: TranslationRoute[] = [];

  for (const [languageId, service] of Object.entries(services.dedicated ?? {})) {
    routes.push({
      id: `dedicated-${languageId}`,
      label: `${service.label} (${languageId})`,
      service,
      languages: [languageId, "en"],
    });
  }

  if (services.general) {
    routes.push({
      id: "general",
      label: services.general.label,
      service: services.general,
      languages: ["*"],
    });
  }

  return new RoutedTranslationService(routes);
}
