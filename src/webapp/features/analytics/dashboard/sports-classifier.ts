/**
 * Classificação automática de canais, partidas, vôlei e campeonatos
 * a partir de propriedades genéricas enviadas pelos players (ex: "Canal").
 */

const CHANNEL_KEYS = new Set([
  "canal",
  "nome do canal",
  "📺 canal",
  "canal transmissão",
  "canal transmissao",
  "canal de jogo",
  "canal jogo",
  "canal do jogo",
]);

const VOLEI_KEYWORDS = [
  "vôlei",
  "volei",
  "superliga",
  "vnl",
  "sada cruzeiro",
  "praia clube",
  "minas tênis",
  "minas tenis",
  "osasco",
  "sesi bauru",
  "joinville vôlei",
  "dentil",
];

const SPORTS_CHANNEL_KEYWORDS = [
  "premiere",
  "sportv",
  "espn",
  "cazétv",
  "cazetv",
  "combate",
  "bandsports",
  "band sports",
  "nosso futebol",
  "tnt sports",
  "fox sports",
  "canal goat",
  "conmebol",
  "dazn",
  "nba league",
  "ufc fight",
  "nfl network",
  "paramount+ esportes",
  "paramount esportes",
];

const CHAMPIONSHIP_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bbrasileir[aã]o\b|\bs[eé]rie\s*[ab]\b/i, label: "Brasileirão" },
  { pattern: /\blibertadores\b/i, label: "Copa Libertadores" },
  { pattern: /\bsul-?americana\b/i, label: "Copa Sul-Americana" },
  { pattern: /\bcopa do brasil\b/i, label: "Copa do Brasil" },
  { pattern: /\bchampions(\s+league)?\b/i, label: "UEFA Champions League" },
  { pattern: /\bpremier\s+league\b/i, label: "Premier League" },
  { pattern: /\bla\s+liga\b/i, label: "La Liga" },
  { pattern: /\bpaulist[aã]o\b/i, label: "Campeonato Paulista" },
  { pattern: /\bcarioca\b/i, label: "Campeonato Carioca" },
  { pattern: /\bsuperliga\b/i, label: "Superliga de Vôlei" },
  { pattern: /\bvnl\b|liga das na[cç][oõ]es/i, label: "VNL (Liga das Nações)" },
  { pattern: /\bnba\b/i, label: "NBA" },
  { pattern: /\bufc\b/i, label: "UFC" },
  { pattern: /\bf1\b|f[oó]rmula\s*1/i, label: "Fórmula 1" },
];

export function isChannelPropertyKey(key: string): boolean {
  return CHANNEL_KEYS.has(key.toLowerCase().trim());
}

/**
 * Detecta se o título representa uma partida/jogo ao vivo (ex: "21:00 - SANTOS X GRÊMIO [1]" ou "Time A vs Time B").
 */
export function isMatchTitle(val: string): boolean {
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();
  if (!trimmed || lower.startsWith("xxx:") || lower.startsWith("xxx ")) return false;

  // Padrão com horário + confronto: "21:00 - SANTOS X GRÊMIO [1]" ou "19h30 Flamengo x Palmeiras"
  if (/\b\d{1,2}[:h]\d{2}\b.*(\s+[x×]\s+|\s+vs\.?\s+)/i.test(trimmed)) {
    return true;
  }

  // Padrão direto de confronto entre dois nomes válidos: "SANTOS X GRÊMIO", "Brasil vs Argentina"
  if (/^[A-Za-zÀ-ÿ0-9\s.'-]{2,}\s+(?:[x×]|vs\.?)\s+[A-Za-zÀ-ÿ0-9\s.'-]{2,}(?:\s*\[\d+\])?$/i.test(trimmed)) {
    return true;
  }

  return false;
}

export function isVoleiText(val: string): boolean {
  const lower = val.toLowerCase();
  return VOLEI_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Detecta se o canal é um canal dedicado a jogos/esportes ou se está transmitindo um jogo específico.
 */
export function isSportsChannel(val: string): boolean {
  const lower = val.toLowerCase().trim();
  if (!lower || lower.startsWith("xxx:") || lower.startsWith("xxx ")) return false;

  if (SPORTS_CHANNEL_KEYWORDS.some((kw) => lower.includes(kw))) {
    return true;
  }

  // Ex: "Globo (Jogo)" ou canal de transmissão marcado como jogo
  if (/\b(jogo|partida|futebol|v[oô]lei|ao vivo)\b/i.test(lower) && isMatchTitle(val)) {
    return true;
  }

  return isMatchTitle(val);
}

/**
 * Extrai o nome do campeonato quando identificado no título do canal/evento.
 */
export function extractChampionship(val: string): string | null {
  for (const { pattern, label } of CHAMPIONSHIP_PATTERNS) {
    if (pattern.test(val)) {
      return label;
    }
  }
  return null;
}
