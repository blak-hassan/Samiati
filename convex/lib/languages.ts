/**
 * Script metadata for the languages Samiati supports.
 *
 * Convex bundles the files under `convex/` and follows relative imports
 * outside it, but keeping this small table inside the backend means the
 * backend never depends on the app's registry module being bundled.
 *
 * Every language Samiati supports today is written in Latin script. The table
 * exists so that adding an Arabic-script language is a one-line change
 * rather than a code change in the quality checks.
 */
const SCRIPTS: Readonly<Record<string, "Latin" | "Arabic">> = {
  en: "Latin",
  kiswahili: "Latin",
  sheng: "Latin",
  kikuyu: "Latin",
  luhya: "Latin",
  dholuo: "Latin",
  somali: "Latin",
  kamba: "Latin",
  kalenjin: "Latin",
  gusii: "Latin",
  meru: "Latin",
  maasai: "Latin",
};

/** The script a language is written in. Defaults to Latin. */
export function scriptForLanguage(languageId: string): "Latin" | "Arabic" {
  return SCRIPTS[languageId] ?? "Latin";
}
