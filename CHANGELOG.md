# Registro de Alterações (Changelog)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e este projeto segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [v2.8.6] - 28/11/2026

### 🛠️ Correções
- **Restauração dos Dados nos Cards de Streaming & Esportes (`api.ts` / `useAnalyticsQueries.ts`)**:
  - Corrigida a serialização de parâmetros `undefined` e `null` em `api.get()` (`src/webapp/fns/api.ts`), impedindo que `new URLSearchParams()` enviasse `eventName=undefined` na query de `/_stats/top-props` (o que fazia o ClickHouse filtrar `AND event_name = 'undefined'` e zerar `Top Filmes, Séries & TV` e `Top Campeonatos & Jogos ao Vivo`).
  - Omitido o parâmetro `eventName` em `useTopEventPropsQuery` quando vazio.

### 📊 Métricas de Código
- **Total**: **27.399 linhas** de código em **358 arquivos-fonte** (`149` `.cs` · `171` `.tsx` · `35` `.ts` · `3` `.css`).

---

## [v2.8.5] - 28/11/2026

### ⚡ Otimizações de Performance e Carregamento
- **Unificação de `queryKey` no TanStack Query (`useAnalyticsQueries.ts`)**:
  - Criados hooks compartilhados `useTopEventPropsQuery` e `useTopEventsQuery` para que `DashboardPage`, `SportsWidget`, `VodMediaWidget`, `TopEventProps` e `EventWidget` (`TopNDataContainer`) compartilhem exatamente o mesmo cache e deduplicação em voo, eliminando consultas repetidas ao ClickHouse na abertura do painel.
  - Unificadas as `queryKey` de tempo real (`["live-geo", ...]` e `["live-sessions", ...]`) no `RealtimeGaugeCard.tsx` com `LiveViewPage` e `RecentSessionsList`.
- **Preload de Chunks em Idle (`ConsoleLayout.tsx`)**:
  - Implementado pré-carregamento em segundo plano (`requestIdleCallback` com fallback) dos chunks `DashboardPage` e `chart.js` logo após a autenticação, eliminando o *waterfall* de rede na transição para o painel.
- **Cache Curto em Memória no Backend (`StatsController.cs`)**:
  - Adicionado cache `IMemoryCache` de 20 segundos (`GetOrCreateCachedAsync`) nos endpoints `/_stats/top-props`, `/_stats/top-*` (`TopN`) e `/_stats/metrics` (`KeyMetrics`), reduzindo drasticamente a carga de `top_props__v2`, `top_n__v2` e `key_metrics__v2` no ClickHouse ao alternar entre aplicativos ou recarregar o painel.

### 📊 Métricas de Código
- **Total**: **27.391 linhas** de código em **358 arquivos-fonte** (`149` `.cs` · `171` `.tsx` · `35` `.ts` · `3` `.css`).

---

## [v2.8.4] - 2026-11-24

### 🛠️ Correções
- **Eliminação de Duplicação entre `Canais de Jogos`, `Partidas` e `Top Canais`**:
  - Removida a inclusão de títulos de partidas ao vivo (`HH:MM - Time A x Time B`) da aba **Canais de Jogos** no `sports-classifier.ts`, mantendo-os exclusivamente na aba **Partidas**.
  - Adicionado filtro `!isSportsChannel(...)` no `VodMediaWidget.tsx` (**Top Canais**) para evitar que canais esportivos (`Premiere`, `SporTV`, `ESPN`, etc.) apareçam duplicados nos dois cards simultaneamente.

---

## [v2.8.3] - 2026-11-24

### 🚀 Novidades e Melhorias
- **Classificação Automática de Esportes, Campeonatos e Jogos ao Vivo (`sports-classifier.ts`)**:
  - Adicionado classificador inteligente no frontend para detectar automaticamente partidas ao vivo (`HH:MM - Time A x Time B`), jogos de vôlei/Superliga/VNL, campeonatos (`Brasileirão`, `Libertadores`, `Copa do Brasil`, `Champions League`, `NBA`, `UFC`, etc.) e canais esportivos dedicados (`Premiere`, `SporTV`, `ESPN`, `CazéTV`, `Combate`, `TNT Sports`, etc.) a partir da propriedade genérica `"Canal"`.
  - Funciona retroativamente com dados existentes no ClickHouse e para todos os players (Play Max, IBO Player Pro, IBO One, etc.) sem exigir alterações nos aplicativos clientes.
- **Separação Limpa no `VodMediaWidget` (`Top Canais`)**:
  - Exclusão automática de títulos de partidas ao vivo da aba **Top Canais**, mantendo-os centralizados no card **Top Campeonatos & Jogos ao Vivo**.
- **Elevação de Versão**:
  - Atualização do painel e assets SPA para a versão `v2.8.3`.

---

## [v2.8.2] - 2026-11-08

### 🛠️ Correções e Melhorias
- **Isolamento de Canais de Jogos no SportsWidget**:
  - Remoção de filtros genéricos (`canal`, `nome do canal`, `📺 canal`) da aba de canais de transmissão esportiva, restringindo a chaves estritamente ligadas a partidas (`canal transmissão`, `canal de jogo`, `canal do jogo`).
  - Evita repetição e poluição visual de canais de TV normais (Globo, etc.) no card de esportes, mantendo-os centralizados no card dedicado de Mídia VOD & TV.
- **Suporte Automático a Streaming no Max Vision**:
  - Inclusão do app **Max Vision** (`max vision` e `maxvision`) na lista nativa de detecção de players de streaming no dashboard (`hasSportsTelemetry`).
- **Elevação de Versão**:
  - Atualização do painel e assets SPA para a versão `v2.8.2`.

---

## [v2.8.1] - 2026-10-31

### 🛠️ Correções
- **Liberação de Embutimento em Iframes (RicardHub)**:
  - Remoção do cabeçalho `X-Frame-Options: DENY` em `src/Program.cs` na resposta de fallback da SPA de produção.
  - Atualização da política `Content-Security-Policy` adicionando a diretiva `frame-ancestors 'self' https://hub.ricardtech.top http://hub.ricardtech.top https://*.ricardtech.top;`.
  - Permite visualização e navegação fluida da telemetria diretamente nas abas operacionais do **Ricard Hub**.

---

## [v2.8.0] - 2026-10-14

### 🚀 Novidades e Melhorias

- **Sincronização com o Upstream Oficial (`aptabase/aptabase`)**:
  - **Proteção contra estouro de conexões no PostgreSQL**:
    - Implementação de concorrência com *Single-Flight Lookup* no cache de App-Keys (`IngestionCache`), evitando que centenas de requisições concorrentes esgotem os slots de conexão do PostgreSQL (erro 53300).
    - Controle de concorrência no hash de usuários diários (`DailyUserHasher`) usando `SemaphoreSlim` e comando atômico de upsert `ON CONFLICT DO UPDATE RETURNING` com falha rápida em caso de instabilidade do banco.
  - **Rejeição rápida em memória (`ResolveAppKeyAttribute`)**:
    - Validação de chaves de apps antes da leitura ou desserialização de corpos JSON, poupando CPU e alocação de memória no servidor contra requisições inválidas ou apps bloqueados.
  - **Mitigação de loop infinito de SDKs**:
    - Retorno de status `200 OK` estruturado em JSON para lotes rejeitados nos endpoints de eventos (`/api/v0/event` e `/api/v0/events`), instruindo SDKs como Unity a limparem a fila de retentativas em vez de gerarem loops infinitos de tráfego.
  - **Hardening de métricas e limites de logs (`RejectionStats`)**:
    - Agregação periódica em janelas de 60 segundos com cotas estritas de fontes e truncamento de identificadores para prevenir exaustão de memória ou bloqueio de threads de console.
  - **Preservação de filtros na navegação**:
    - Ao abrir as sessões de usuários, os filtros aplicados na barra de URL são devidamente preservados.

- **Detecção Inteligente e Estrita de Telemetria de Streaming**:
  - **Eliminação de contaminação cruzada**: Corrigido bug de persistência em `localStorage` que fazia com que aplicativos de sites, APIs ou sistemas gerais (ex: CDN Proxy, Omni Gestor, Pay Hub e Loja de Aplicativos) fossem incorretamente marcados como apps de streaming.
  - **Critérios estritos de mídia**: Remoção de palavras genéricas soltas (`canal`, `jogo`, `reprodução`). Os widgets de *Top Filmes, Séries & TV* e *Top Campeonatos & Jogos ao Vivo* agora são exibidos exclusivamente quando há propriedades e eventos de streaming reais ou quando o app é um player de mídia/streaming reconhecido (como o Play Max).
  - Adicionados aliases de identificação no widget de canais de transmissão (`canal`, `nome do canal`, `📺 canal`).

- **Tooling e Qualidade de Código**:
  - Integração oficial do **Biome** (`biome.json`) com scripts rápidos de formatação e verificação estática (`bun run format` e `bun run lint`).

---

## [v2.7.0] - 2026-09-20

### 🚀 Melhorias
- Consolidação estrita de séries por nome principal e remoção de episódios avulsos no widget de VOD.
- Refinamento de rankings e filtros de telemetria de mídia.

---

## [v2.6.0] - 2026-09-20

### 🚀 Melhorias
- Otimização do build Docker com `BUILDPLATFORM` para compilação multi-arquitetura.
- Isolamento estrito de canais esportivos e suporte expandido a séries e episódios.

---

## [v2.5.0] - 2026-09-18

### 🚀 Melhorias
- Persistência e detecção de telemetria para cards de streaming.
