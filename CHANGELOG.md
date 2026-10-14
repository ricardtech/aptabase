# Registro de Alterações (Changelog)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e este projeto segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

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
