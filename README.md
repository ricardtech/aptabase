<div align="center">
  <a href="https://github.com/ricardtech/aptabase">
    <img src="https://aptabase.com/og.png" alt="Aptabase"/>
  </a>

  <h3 align="center">Aptabase (Tradução PT-BR - Ricard Tech)</h3>

  <p align="center">
    Telemetria e Analytics para Aplicativos e Websites.
    <br />
    Código Aberto. Focado em Privacidade. Leve e Simples.
    <br />
    <br />
    <a href="https://github.com/ricardtech/aptabase"><strong>Repositório Ricard Tech »</strong></a>
  </p>
</div>

# Sobre o Projeto

O [Aptabase](https://github.com/ricardtech/aptabase) é uma alternativa open-source moderna ao Firebase Analytics e Google Analytics, especialmente desenvolvida para aplicativos Mobile (Android, iOS), Desktop e Web Apps.

📱 **Ampla lista de SDKs**: Compatível com as principais linguagens e frameworks do mercado: Kotlin/Android, Flutter, React Native, Swift, Electron, Tauri, Web (JavaScript/TypeScript), .NET MAUI e Unity.

😇 **Privacidade em Primeiro Lugar**: Coleta o mínimo necessário de dados de uso sem rastreadores invasivos ou identificadores pessoais, em total conformidade com a LGPD e GDPR.

🚀 **Simples e Leve**: Dashboard integrado, intuitivo e moderno com métricas essenciais em tempo real (usuários ativos, sessões, eventos personalizados, versões e erros).

💯 **Código Aberto**: 100% open-source com backend em .NET (ASP.NET Core), frontend em React/TypeScript e banco de dados ultrarrápido com PostgreSQL e ClickHouse.

---

## 🚀 Como Executar com Docker Compose (Self-Hosted)

Crie um arquivo `docker-compose.yml` e execute em seu servidor:

```yaml
services:
  aptabase_db:
    image: postgres:18-alpine
    restart: always
    volumes:
      - db-data:/var/lib/postgresql
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    networks:
      - aptabase-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  aptabase_events_db:
    image: clickhouse/clickhouse-server:23.8.16.16-alpine
    restart: always
    volumes:
      - events-db-data:/var/lib/clickhouse
    environment:
      CLICKHOUSE_USER: ${CLICKHOUSE_USER}
      CLICKHOUSE_PASSWORD: ${CLICKHOUSE_PASSWORD}
    networks:
      - aptabase-net
    ulimits:
      nofile:
        soft: 262144
        hard: 262144
    healthcheck:
      test: ["CMD-SHELL", "clickhouse-client --user ${CLICKHOUSE_USER} --password ${CLICKHOUSE_PASSWORD} --query 'SELECT 1' || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  aptabase:
    image: alaxricard/aptabase:1.0.0
    restart: always
    ports:
      - "127.0.0.1:8190:8080"
    environment:
      BASE_URL: https://${APTABASE_HOST}
      AUTH_SECRET: ${AUTH_SECRET}
      DATABASE_URL: Server=aptabase_db;Port=5432;User Id=${POSTGRES_USER};Password=${POSTGRES_PASSWORD};Database=${POSTGRES_DB}
      CLICKHOUSE_URL: Host=aptabase_events_db;Port=8123;Username=${CLICKHOUSE_USER};Password=${CLICKHOUSE_PASSWORD}
    networks:
      - aptabase-net
    depends_on:
      aptabase_db:
        condition: service_healthy
      aptabase_events_db:
        condition: service_healthy

networks:
  aptabase-net:
    driver: bridge

volumes:
  db-data:
    driver: local
  events-db-data:
    driver: local
```

---

## 📦 SDKs Disponíveis

- [Android (Kotlin / Java)](https://github.com/aptabase/aptabase-kotlin)
- [Flutter](https://github.com/aptabase/aptabase_flutter)
- [React Native](https://github.com/aptabase/aptabase-react-native)
- [Web Apps (JavaScript / TypeScript / React / Next.js)](https://github.com/aptabase/aptabase-js)
- [Swift (iOS / macOS)](https://github.com/aptabase/aptabase-swift)
- [Tauri](https://github.com/aptabase/tauri-plugin-aptabase)
- [Electron](https://github.com/aptabase/aptabase-electron)
- [.NET MAUI](https://github.com/aptabase/aptabase-maui)
- [Unity Engine](https://github.com/aptabase/aptabase-unity)

---

## 📄 Licença

O Aptabase é disponibilizado sob a licença [AGPLv3](./LICENSE). Os SDKs clientes utilizam a licença MIT.
