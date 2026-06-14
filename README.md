# My App

A starter project built with React 19 + Node 24 + Express + SQLite + Passport.js.

## Prerequisites

- Node 24.x (LTS)
- `nodemon` installed globally (`npm install -g nodemon`)

## Setup & Run

### 1. Server

```bash
cd server
npm install
nodemon index.js
```

The server starts on **http://localhost:3001**

### 2. Client

```bash
cd client
npm install
npm run dev
```

The React app starts on **http://localhost:5173**

Open **http://localhost:5173** in your browser.

## Seeded Users

| Name   | Email                | Password    |
|--------|----------------------|-------------|
| sadjad | sadjad@example.com   | sadjad1234  |
| ali    | ali@example.com      | ali1234     |
| momo   | momo@example.com     | momo1234    |

## API Endpoints

| Method | Path                      | Auth required | Description         |
|--------|---------------------------|---------------|---------------------|
| POST   | /api/sessions             | No            | Login               |
| GET    | /api/sessions/current     | Yes           | Get logged-in user  |
| DELETE | /api/sessions/current     | Yes           | Logout              |
