# Crypto Alert Bot

Bot Telegram in TypeScript per cercare token nella coin list di CoinGecko, leggere il prezzo attuale in USD e ricevere alert automatici sulle cryptovalute.

## Funzionalita

- `/prezzo <symbol>` cerca il simbolo nella coin list di CoinGecko e mostra i risultati tramite pulsanti inline
- selezione del token corretto tramite `CoinGecko ID`
- `/alert <symbol> <prezzo_usd>` registra alert bidirezionali sopra/sotto soglia
- `/alerts_attivi` mostra la lista degli alert attivi con dettaglio, prezzo attuale ed eliminazione del singolo alert
- `/elimina_alerts` elimina tutti gli alert previa conferma
- refresh coin list da CoinGecko all'avvio e ogni 6 ore
- job alert ogni 2 minuti in produzione
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

Il progetto replica l'impostazione di `BorsaItalianaAlert`:

```text
src/
  consts/
  dto/
  enums/
  handlers/
    alert/
    api/
    bot/
    coingecko/
    database/
    error/
    server/
  jobs/
  lifecycle/
  logger/
  schemas/
  types/
  utils/
  main.ts
prisma/
  schema.prisma
```

## Setup

1. Installa le dipendenze

```bash
npm install
```

2. Crea `.env` partendo da `.env.example`

```env
BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=mongodb://localhost:27017/crypto_alert_bot
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
/alert btc 70000
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

1. L'utente invia `/alert btc 70000`
2. Il bot cerca `btc` nella coin list
3. L'utente seleziona il token corretto
4. Il bot salva l'alert con `coinId`, `symbol`, `name`, soglia e ultima condizione rilevata
5. Il job eseguito ogni 2 minuti controlla i prezzi in batch con `simple/price`
6. Se il prezzo passa sopra o sotto la soglia, il bot invia la notifica Telegram

## Verifica locale

Comando eseguito:

```bash
npx prisma generate
npm run typecheck
```
