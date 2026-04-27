# Crypto Alert Bot

Bot Telegram in TypeScript per cercare token nella coin list di CoinGecko, leggere il prezzo attuale in USD e ricevere alert automatici sulle cryptovalute.

## Funzionalita

- `/prezzo <symbol>` cerca il simbolo nella coin list di CoinGecko e mostra i risultati tramite pulsanti inline
- selezione del token corretto tramite `CoinGecko ID`
- `/alert <symbol> <prezzo_usd>` registra alert bidirezionali sopra/sotto soglia
- `/alerts_attivi` mostra la lista degli alert attivi con dettaglio, prezzo attuale ed eliminazione del singolo alert
- `/elimina_alerts` elimina tutti gli alert previa conferma
- refresh coin list da CoinGecko all'avvio ed ogni 24 ore
- job alert ogni 5 minuti in produzione
- MongoDB con Prisma
- validazione input con Zod
- tipizzazione stretta, senza `any`

## Stack

- TypeScript strict
- Gramio
- Prisma + MongoDB
- Axios
- Cron
- Zod
- Pino

## Struttura

```
├── 📁 prisma
│   └── 📄 schema.prisma
├── 📁 src
│   ├── 📁 consts
│   │   ├── 📄 api.ts
│   │   └── 📄 coingecko.ts
│   ├── 📁 dto
│   │   ├── 📄 create-alert.dto.ts
│   │   ├── 📄 create-search-session.dto.ts
│   │   ├── 📄 create-user.dto.ts
│   │   ├── 📄 update-alert.dto.ts
│   │   └── 📄 update-user.dto.ts
│   ├── 📁 enums
│   │   ├── 📄 callback-id.enum.ts
│   │   ├── 📄 callback-key.enum.ts
│   │   └── 📄 command-type.enum.ts
│   ├── 📁 handlers
│   │   ├── 📁 alert
│   │   │   └── 📄 alert-handler.ts
│   │   ├── 📁 api
│   │   │   └── 📄 api-handler.ts
│   │   ├── 📁 bot
│   │   │   ├── 📄 00-bot-handler.ts
│   │   │   ├── 📄 01-commands-basic.helper.ts
│   │   │   ├── 📄 02-commands-helper.ts
│   │   │   ├── 📄 03-callbacks-helper.ts
│   │   │   ├── 📄 04-callbacks-data.ts
│   │   │   └── 📄 05-user-handler.ts
│   │   ├── 📁 coingecko
│   │   │   └── 📄 coingecko-handler.ts
│   │   ├── 📁 database
│   │   │   └── 📄 database-handler.ts
│   │   ├── 📁 error
│   │   │   └── 📄 error-handler.ts
│   │   └── 📁 server
│   │       └── 📄 server-handler.ts
│   ├── 📁 interfaces
│   │   ├── 📄 alert-group.interface.ts
│   │   └── 📄 coingecko-error-response.interface.ts
│   ├── 📁 jobs
│   │   ├── 📄 alert-price.job.ts
│   │   └── 📄 coin-list-sync.job.ts
│   ├── 📁 lifecycle
│   │   └── 📄 shutdown.ts
│   ├── 📁 logger
│   │   └── 📄 logger.ts
│   ├── 📁 schemas
│   │   ├── 📄 coingecko-api.schema.ts
│   │   ├── 📄 input-validator.schema.ts
│   │   └── 📄 search-session.schema.ts
│   ├── 📁 types
│   │   ├── 📄 custom-context.type.ts
│   │   └── 📄 telegram-options-custom.type.ts
│   ├── 📁 utils
│   │   └── 📄 price-formatter.ts
│   └── 📄 main.ts
├── ⚙️ .env.example
├── ⚙️ .gitignore
├── 📝 README.md
├── ⚙️ docker-compose.yml
├── ⚙️ package-lock.json
├── ⚙️ package.json
└── ⚙️ tsconfig.json
```

## Setup

1. Installa le dipendenze

```bash
npm install
```

2. Crea `.env` partendo da `.env.example`

```env
BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=DATABASE_URL=mongodb://localhost:27017/crypto_alert_italia_bot
COINGECKO_API_KEY=your_demo_key
PORT=3000
NODE_ENV=development
```

3. Genera il client Prisma e applica lo schema

```bash
npx prisma generate
npx prisma db push
```

4. Avvia il bot

```bash
npm run dev
```

## Comandi

```text
/prezzo btc
/alert btc 80000
/alerts_attivi
/elimina_alerts
/start
/help
```

## Flusso `/prezzo`

1. L'utente invia `/prezzo btc`
2. Il bot cerca `btc` nella coin list salvata da CoinGecko
3. Il bot mostra i token trovati con `id`, `symbol`, `name` e pulsanti inline
4. L'utente preme ad esempio `Bitcoin`
5. Il bot chiama `simple/price` con `ids=bitcoin`
6. Il bot invia il prezzo in USD con messaggio formattato

## Flusso `/alert`

1. L'utente invia `/alert btc 80000`
2. Il bot cerca `btc` nella coin list
3. L'utente seleziona il token corretto
4. Il bot salva l'alert con `coinId`, `symbol`, `name`, soglia e ultima condizione rilevata
5. Il job eseguito ogni 5 minuti controlla i prezzi in batch con `simple/price`
6. Se il prezzo passa sopra o sotto la soglia, il bot invia la notifica Telegram

## Verifica locale

Comando eseguito:

```bash
npx prisma generate
npm run typecheck
```
