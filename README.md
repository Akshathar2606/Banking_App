# BankEase — Mobile Banking Application

BankEase is a college/demo mobile banking application built with **React Native (Expo)**, **Node.js**, **Express**, and **MongoDB**.

The application demonstrates common banking features such as authentication, dashboard, accounts, transactions, cards, bills, beneficiaries, and profile management.

---

## Features

- User Registration
- User Login with JWT Authentication
- Dashboard with account balance
- Recent transactions
- Money transfer demo
- Bill payment demo
- Bank cards
- Beneficiaries
- Transaction history
- Profile
- Logout

> Note: Some banking data is currently **demo/dummy data** for demonstration purposes.

---

## Tech Stack

### Frontend
- React Native
- Expo
- TypeScript

### Backend
- Node.js
- Express.js
- TypeScript/JavaScript

### Database
- MongoDB Atlas
- Mongoose

### Authentication
- JWT
- bcryptjs

---

## Project Structure

```text
Banking_App/
│
├── frontend/              # React Native / Expo frontend
│
├── src/                   # Backend source code
│   ├── config/            # Database configuration
│   ├── controllers/       # Backend controllers
│   ├── middleware/        # Authentication middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── services/          # Backend services
│   ├── tests/             # Backend tests
│   └── server.ts          # Backend server
│
├── .env.example           # Environment variable template
├── .gitignore
├── package.json
├── package-lock.json
└── README.md