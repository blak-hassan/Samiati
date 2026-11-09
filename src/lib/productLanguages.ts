/**
 * Product availability, not a model quality ranking. A configured route still
 * depends on the deployment and requires evaluation with language speakers.
 * Keep profile proficiency separate from these capabilities.
 */
export interface ProductLanguage {
  code: string;
  name: string;
  nllbCode?: string;
  region: string;
  text: 'configured' | 'planned';
  voice: 'unverified' | 'unavailable';
  note?: string;
}

export const PRODUCT_LANGUAGES: readonly ProductLanguage[] = [
  {
    code: 'sw',
    name: 'Kiswahili',
    nllbCode: 'swh_Latn',
    region: 'East Africa',
    text: 'configured',
    voice: 'unverified',
  },
  {
    code: 'ki',
    name: 'Kikuyu',
    nllbCode: 'kik_Latn',
    region: 'Kenya',
    text: 'configured',
    voice: 'unverified',
  },
  {
    code: 'luo',
    name: 'Dholuo',
    nllbCode: 'luo_Latn',
    region: 'East Africa',
    text: 'configured',
    voice: 'unverified',
  },
  {
    code: 'luy',
    name: 'Luhya',
    nllbCode: 'luy_Latn',
    region: 'East Africa',
    text: 'configured',
    voice: 'unverified',
    note: 'A group of language varieties. Coverage may vary; tell us your variety when contributing.',
  },
  {
    code: 'kam',
    name: 'Kamba',
    nllbCode: 'kam_Latn',
    region: 'Kenya',
    text: 'configured',
    voice: 'unverified',
  },
  {
    code: 'kln',
    name: 'Kalenjin',
    nllbCode: 'kln_Latn',
    region: 'East Africa',
    text: 'configured',
    voice: 'unverified',
    note: 'Includes distinct varieties. Experimental text chat may not cover every variety equally.',
  },
  {
    code: 'mer',
    name: 'Meru',
    nllbCode: 'mer_Latn',
    region: 'Kenya',
    text: 'configured',
    voice: 'unverified',
    note: 'Language varieties have different needs; coverage requires community review.',
  },
  {
    code: 'mas',
    name: 'Maasai',
    nllbCode: 'mas_Latn',
    region: 'East Africa',
    text: 'configured',
    voice: 'unverified',
  },
  {
    code: 'guz',
    name: 'Gusii',
    region: 'Kenya',
    text: 'planned',
    voice: 'unavailable',
    note: 'Not connected to chat yet. Help shape future language support through Changa.',
  },
  {
    code: 'so',
    name: 'Somali',
    region: 'Horn of Africa',
    text: 'planned',
    voice: 'unavailable',
    note: 'Not connected to chat yet. Availability will be announced after evaluation.',
  },
  {
    code: 'sh',
    name: 'Sheng',
    region: 'Kenya',
    text: 'planned',
    voice: 'unavailable',
    note: 'A changing community language variety. Changa contributions are separate from chat availability.',
  },
  {
    code: 'en',
    name: 'English',
    nllbCode: 'eng_Latn',
    region: 'International',
    text: 'configured',
    voice: 'unverified',
  },
];

export function getProductLanguage(code: string): ProductLanguage | undefined {
  return PRODUCT_LANGUAGES.find((language) => language.code === code || language.nllbCode === code);
}
