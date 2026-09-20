# BankEase — Database Layer

This folder contains the **standalone database setup** for the BankEase college/demo mobile banking application.

It connects to **MongoDB Atlas** using **Mongoose** and **Node.js**.

> This is the database layer only. No APIs, no frontend, no authentication — just the database connection, which will be extended with schemas and models in the next step.

---

## Project Structure

```
database/
├── src/
│   ├── config/
│   │   └── database.js        ← MongoDB connection module
│   └── tests/
│       └── testConnection.js  ← Connection test script
├── .env                       ← Your private connection string (DO NOT COMMIT)
├── .env.example               ← Safe template to share with others
├── .gitignore                 ← Keeps .env out of version control
├── package.json               ← Project config and npm scripts
└── README.md                  ← This file
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) installed on your computer
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account with a cluster created

---

## Step 1 — Install Dependencies

Open a terminal, navigate to this `database/` folder, and run:

```bash
npm install
```

This installs:
- **mongoose** — connects Node.js to MongoDB
- **dotenv** — loads your `.env` file securely

---

## Step 2 — Add Your MongoDB Connection String

1. Open the `.env` file in this folder.
2. Replace the placeholder with your real MongoDB Atlas connection string:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
```

You can find your connection string in MongoDB Atlas:
> **Clusters → Connect → Connect your application → Node.js**

> ⚠️ **IMPORTANT:** Never share your `.env` file. It is listed in `.gitignore` so it won't be committed to Git.

---

## Step 3 — Test the Database Connection

Run the following command from inside the `database/` folder:

```bash
npm run db:test
```

### What successful output looks like

```
------------------------------------------
  BankEase - MongoDB Connection Test
------------------------------------------
Attempting to connect to MongoDB Atlas...

MongoDB connected successfully
Host: cluster0.xxxxx.mongodb.net
Database name: bankease

Connection closed. Test complete.
------------------------------------------
```

### What a failed connection looks like

```
Connection failed.
Error: Authentication failed.

Please check:
  1. Your .env file exists and contains MONGODB_URI
  2. The connection string is correct (no placeholder text)
  3. Your IP address is whitelisted in MongoDB Atlas
  4. Your Atlas username and password are correct
```

---

## Security Rules

| Rule | Detail |
|------|--------|
| `.env` is in `.gitignore` | It will never be committed to Git |
| `.env.example` is safe to share | It contains only a placeholder, no real credentials |
| Connection string is never hardcoded | It is always read from `process.env.MONGODB_URI` |
| Credentials are never printed | Logs show host/db name only, not the URI |

---

## Common Errors and Fixes

| Error | Fix |
|-------|-----|
| `MONGODB_URI is not defined` | Make sure your `.env` file exists and has `MONGODB_URI=...` |
| `still contains a placeholder` | Replace `<MY_MONGODB_CONNECTION_STRING>` in `.env` with your real URI |
| `Authentication failed` | Check your Atlas username and password in the connection string |
| `IP not whitelisted` | In Atlas, go to **Network Access** and add your current IP |
| `Cannot find module 'mongoose'` | Run `npm install` first |

---

## What's Next

In the next step, we will design the **BankEase collections and Mongoose schemas**, including users, accounts, and transactions.
