# BankEase API Documentation

> **Demo/Student Project** — All banking data is simulated. Do not use real credentials.

---

## Base URL

```
http://localhost:5000
```

---

## Response Format

Every response follows this consistent shape:

```json
{
  "success": true | false,
  "message": "Human-readable description",
  "<data key>": { ... }
}
```

Error responses always set `"success": false` and include `"message"`.

---

## Authentication

BankEase uses **JSON Web Tokens (JWT)**. After registering or logging in, every protected endpoint requires the token to be sent in the `Authorization` header.

### How to send the token

```
Authorization: Bearer <JWT_TOKEN>
```

**Example:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- The token expires after **7 days** (controlled by `JWT_EXPIRES_IN` in `.env`).
- Omitting the header on a protected route returns **HTTP 401**.
- A token for a deactivated account returns **HTTP 403**.

---

## 1. Authentication Endpoints

### 1.1 Register

**`POST /api/auth/register`** — Public

Creates a new user account and returns a JWT.

**Request body:**
```json
{
  "name": "Akshat Harshavardhan",
  "email": "akshat@example.com",
  "phone": "9876543210",
  "password": "SecurePass@123"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | Trimmed |
| `email` | string | ✅ | Lowercased, must be valid email format, unique |
| `phone` | string | ✅ | Unique |
| `password` | string | ✅ | Hashed with bcrypt before storage — never stored in plain text |

**Success — HTTP 201:**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "<JWT>",
  "user": {
    "id": "6ab01ce10fca3904dcc8700e",
    "name": "Akshat Harshavardhan",
    "email": "akshat@example.com",
    "phone": "9876543210",
    "profileImage": null,
    "isActive": true,
    "createdAt": "2026-09-21T10:00:00.000Z"
  }
}
```

**Error responses:**

| Status | Message |
|---|---|
| 400 | `name, email, phone, and password are all required` |
| 400 | `Please provide a valid email address` |
| 409 | `An account with this email already exists` |
| 409 | `An account with this phone number already exists` |

---

### 1.2 Login

**`POST /api/auth/login`** — Public

Authenticates an existing user and returns a JWT.

**Request body:**
```json
{
  "email": "akshat@example.com",
  "password": "SecurePass@123"
}
```

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |
| `password` | string | ✅ |

**Success — HTTP 200:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "<JWT>",
  "user": {
    "id": "6ab01ce10fca3904dcc8700e",
    "name": "Akshat Harshavardhan",
    "email": "akshat@example.com",
    "phone": "9876543210",
    "profileImage": null,
    "isActive": true,
    "createdAt": "2026-09-21T10:00:00.000Z"
  }
}
```

**Error responses:**

| Status | Message |
|---|---|
| 400 | `Email and password are required` |
| 401 | `Invalid email or password` |
| 403 | `Your account has been deactivated. Please contact support.` |

> ℹ️ The 401 message is intentionally generic — the API never reveals whether the email exists or the password was wrong.

---

## 2. Accounts Endpoints

All endpoints require authentication.

### 2.1 Get All Accounts

**`GET /api/accounts`** — 🔒 Protected

Returns all accounts belonging to the authenticated user.

**Request:** No body. No query parameters.

**Success — HTTP 200:**
```json
{
  "success": true,
  "accounts": [
    {
      "_id": "6ab086c25a452c2093e9709e",
      "userId": "6ab01ce10fca3904dcc8700e",
      "accountNumber": "SB100000001",
      "accountType": "savings",
      "balance": 25000,
      "currency": "INR",
      "status": "active",
      "createdAt": "2026-09-21T10:00:00.000Z",
      "updatedAt": "2026-09-21T10:00:00.000Z"
    }
  ]
}
```

**Error responses:**

| Status | Message |
|---|---|
| 401 | `Not authorized, no token provided` |

---

### 2.2 Get Account by ID

**`GET /api/accounts/:id`** — 🔒 Protected

Returns a single account. Only succeeds if the account belongs to the authenticated user.

**URL parameter:** `:id` — MongoDB `_id` of the account.

**Success — HTTP 200:**
```json
{
  "success": true,
  "account": {
    "_id": "6ab086c25a452c2093e9709e",
    "userId": "6ab01ce10fca3904dcc8700e",
    "accountNumber": "SB100000001",
    "accountType": "savings",
    "balance": 25000,
    "currency": "INR",
    "status": "active",
    "createdAt": "2026-09-21T10:00:00.000Z",
    "updatedAt": "2026-09-21T10:00:00.000Z"
  }
}
```

**Error responses:**

| Status | Message |
|---|---|
| 401 | `Not authorized, no token provided` |
| 403 | `Not authorized to access this account` |
| 404 | `Account not found` |

---

## 3. Transaction Endpoints

All endpoints require authentication.

### 3.1 Transfer Funds

**`POST /api/transactions/transfer`** — 🔒 Protected

Transfers funds between two accounts atomically using a MongoDB session. The source account must belong to the authenticated user. The recipient account may belong to any user.

**Request body:**
```json
{
  "fromAccountId": "6ab086c25a452c2093e9709e",
  "toAccountId":   "6ab086c25a452c2093e9709f",
  "amount":        1000,
  "description":   "Rent payment"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `fromAccountId` | string | ✅ | Must be owned by the authenticated user |
| `toAccountId` | string | ✅ | Must be different from `fromAccountId` |
| `amount` | number | ✅ | Must be greater than 0 |
| `description` | string | ❌ | Optional memo |

**Success — HTTP 201:**
```json
{
  "success": true,
  "message": "Transfer completed successfully",
  "transaction": {
    "_id": "6ab08e17e85d27e4abb12bb7",
    "userId": "6ab01ce10fca3904dcc8700e",
    "accountId": "6ab086c25a452c2093e9709e",
    "type": "transfer",
    "amount": 1000,
    "recipientId": "6ab086c25a452c2093e9709f",
    "recipientName": "SB100000002",
    "description": "Rent payment",
    "status": "completed",
    "reference": "TXN-MUALCPQ0-B4S6ER",
    "date": "2026-09-21T10:00:00.000Z",
    "createdAt": "2026-09-21T10:00:00.000Z",
    "updatedAt": "2026-09-21T10:00:00.000Z"
  }
}
```

**Error responses:**

| Status | Message |
|---|---|
| 400 | `fromAccountId, toAccountId, and amount are required` |
| 400 | `Amount must be a number greater than 0` |
| 400 | `Source and recipient accounts must be different` |
| 400 | `Source account is not active` |
| 400 | `Recipient account is not active` |
| 400 | `Insufficient balance in source account` |
| 403 | `Not authorized to transfer from this account` |
| 404 | `Source account not found` |
| 404 | `Recipient account not found` |

---

### 3.2 Get Transaction History

**`GET /api/transactions`** — 🔒 Protected

Returns all transactions belonging to the authenticated user, sorted newest first.

**Request:** No body. No query parameters.

**Success — HTTP 200:**
```json
{
  "success": true,
  "transactions": [
    {
      "_id": "6ab08e17e85d27e4abb12bb7",
      "userId": "6ab01ce10fca3904dcc8700e",
      "accountId": "6ab086c25a452c2093e9709e",
      "type": "transfer",
      "amount": 1000,
      "recipientId": "6ab086c25a452c2093e9709f",
      "recipientName": "SB100000002",
      "description": "Rent payment",
      "status": "completed",
      "reference": "TXN-MUALCPQ0-B4S6ER",
      "date": "2026-09-21T10:00:00.000Z",
      "createdAt": "2026-09-21T10:00:00.000Z",
      "updatedAt": "2026-09-21T10:00:00.000Z"
    }
  ]
}
```

**Transaction `type` values:** `transfer` | `deposit` | `withdrawal` | `bill_payment`

**Transaction `status` values:** `pending` | `completed` | `failed` | `cancelled`

**Error responses:**

| Status | Message |
|---|---|
| 401 | `Not authorized, no token provided` |

---

## 4. Bills Endpoints

All endpoints require authentication.

### 4.1 Get All Bills

**`GET /api/bills`** — 🔒 Protected

Returns all bills belonging to the authenticated user. Pending and overdue bills are sorted by `dueDate` ascending (most urgent first). When filtering by `status=paid` only, results are sorted by `createdAt` descending.

**Query parameters (optional):**

| Parameter | Values | Example |
|---|---|---|
| `status` | `pending`, `paid`, `overdue` (comma-separated) | `?status=pending` or `?status=pending,overdue` |

**Success — HTTP 200:**
```json
{
  "success": true,
  "message": "Bills retrieved successfully",
  "bills": [
    {
      "_id": "6ab0956829a1b06031b91cda",
      "userId": "6ab01ce10fca3904dcc8700e",
      "billerName": "BESCOM",
      "billType": "electricity",
      "consumerNumber": "ELEC001",
      "amount": 2000,
      "dueDate": "2026-09-28T00:00:00.000Z",
      "status": "pending",
      "paidAt": null,
      "createdAt": "2026-09-21T10:00:00.000Z"
    }
  ]
}
```

**Bill `billType` values:** `electricity` | `water` | `internet` | `mobile` | `other`

**Bill `status` values:** `pending` | `paid` | `overdue`

---

### 4.2 Get Bill by ID

**`GET /api/bills/:id`** — 🔒 Protected

Returns a single bill. Only succeeds if the bill belongs to the authenticated user.

**Success — HTTP 200:**
```json
{
  "success": true,
  "message": "Bill retrieved successfully",
  "bill": { ... }
}
```

**Error responses:**

| Status | Message |
|---|---|
| 403 | `Not authorized to access this bill` |
| 404 | `Bill not found` |

---

### 4.3 Pay a Bill

**`POST /api/bills/:id/pay`** — 🔒 Protected

Pays a bill atomically using a MongoDB session. The payment amount is **always taken from the bill document** — the client cannot specify or override it. Deducts from the specified account, marks the bill as `paid`, and creates a `bill_payment` transaction record.

**URL parameter:** `:id` — MongoDB `_id` of the bill.

**Request body:**
```json
{
  "accountId": "6ab086c25a452c2093e9709e"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `accountId` | string | ✅ | Account to debit — must belong to the authenticated user and be `active` |

**Success — HTTP 200:**
```json
{
  "success": true,
  "message": "Bill payment successful",
  "bill": {
    "_id": "6ab0956829a1b06031b91cda",
    "status": "paid",
    "paidAt": "2026-09-21T10:00:00.000Z",
    ...
  },
  "transaction": {
    "type": "bill_payment",
    "amount": 2000,
    "status": "completed",
    "reference": "TXN-MUAMGVUR-IKWQO1",
    ...
  }
}
```

**Error responses:**

| Status | Message |
|---|---|
| 400 | `accountId is required to specify which account to debit` |
| 400 | `This bill has already been paid` |
| 400 | `Payment account is not active` |
| 400 | `Insufficient balance. Required: <amount>, Available: <balance>` |
| 403 | `Not authorized to pay this bill` |
| 403 | `Not authorized to debit this account` |
| 404 | `Bill not found` |
| 404 | `Payment account not found` |

---

## 5. Cards Endpoints

All endpoints require authentication. **Card numbers are always masked in all responses** — only the last 4 digits are visible (e.g. `**** **** **** 1234`). This is a demo application; no real card data is stored.

### 5.1 Get All Cards

**`GET /api/cards`** — 🔒 Protected

Returns all cards belonging to the authenticated user with masked card numbers.

**Success — HTTP 200:**
```json
{
  "success": true,
  "message": "Cards retrieved successfully",
  "cards": [
    {
      "_id": "6ab14069f6e4ba04c0d94d7b",
      "userId": "6ab01ce10fca3904dcc8700e",
      "cardType": "debit",
      "cardNumber": "**** **** **** 1111",
      "cardHolderName": "AKSHAT HARSHAVARDHAN",
      "expiryMonth": 12,
      "expiryYear": 2027,
      "status": "active",
      "createdAt": "2026-09-21T10:00:00.000Z"
    }
  ]
}
```

**Card `cardType` values:** `debit` | `credit`

**Card `status` values:** `active` | `blocked` | `expired`

---

### 5.2 Get Card by ID

**`GET /api/cards/:id`** — 🔒 Protected

Returns a single card with masked card number. Only succeeds if the card belongs to the authenticated user.

**Success — HTTP 200:**
```json
{
  "success": true,
  "message": "Card retrieved successfully",
  "card": {
    "_id": "6ab14069f6e4ba04c0d94d7b",
    "cardType": "debit",
    "cardNumber": "**** **** **** 1111",
    "cardHolderName": "AKSHAT HARSHAVARDHAN",
    "expiryMonth": 12,
    "expiryYear": 2027,
    "status": "active",
    "createdAt": "2026-09-21T10:00:00.000Z"
  }
}
```

**Error responses:**

| Status | Message |
|---|---|
| 403 | `Not authorized to access this card` |
| 404 | `Card not found` |

---

### 5.3 Block a Card

**`PATCH /api/cards/:id/block`** — 🔒 Protected

Changes the card status to `blocked`. No request body required.

**Success — HTTP 200:**
```json
{
  "success": true,
  "message": "Card blocked successfully",
  "card": { "status": "blocked", ... }
}
```

**Error responses:**

| Status | Message |
|---|---|
| 400 | `Card is already blocked` |
| 400 | `Cannot block an expired card` |
| 403 | `Not authorized to modify this card` |
| 404 | `Card not found` |

---

### 5.4 Unblock a Card

**`PATCH /api/cards/:id/unblock`** — 🔒 Protected

Changes the card status back to `active`. No request body required.

**Success — HTTP 200:**
```json
{
  "success": true,
  "message": "Card unblocked successfully",
  "card": { "status": "active", ... }
}
```

**Error responses:**

| Status | Message |
|---|---|
| 400 | `Card is already active` |
| 400 | `Cannot unblock an expired card` |
| 403 | `Not authorized to modify this card` |
| 404 | `Card not found` |

---

## 6. Beneficiaries Endpoints

All endpoints require authentication. A beneficiary represents a saved recipient the user can transfer money to. The compound unique index on `(userId, accountNumber)` prevents the same user from saving the same account number twice.

### 6.1 Get All Beneficiaries

**`GET /api/beneficiaries`** — 🔒 Protected

Returns all beneficiaries belonging to the authenticated user, sorted by `createdAt` descending.

**Success — HTTP 200:**
```json
{
  "success": true,
  "message": "Beneficiaries retrieved successfully",
  "beneficiaries": [
    {
      "_id": "6ab144f4220a09be8292ef8f",
      "userId": "6ab01ce10fca3904dcc8700e",
      "name": "John Savings",
      "accountNumber": "ACC_JOHN_001",
      "bankName": "HDFC Bank",
      "ifscCode": "HDFC0000123",
      "nickname": "John",
      "isActive": true,
      "createdAt": "2026-09-21T10:00:00.000Z",
      "updatedAt": "2026-09-21T10:00:00.000Z"
    }
  ]
}
```

---

### 6.2 Get Beneficiary by ID

**`GET /api/beneficiaries/:id`** — 🔒 Protected

Returns a single beneficiary. Only succeeds if it belongs to the authenticated user.

**Success — HTTP 200:**
```json
{
  "success": true,
  "message": "Beneficiary retrieved successfully",
  "beneficiary": { ... }
}
```

**Error responses:**

| Status | Message |
|---|---|
| 403 | `Not authorized to access this beneficiary` |
| 404 | `Beneficiary not found` |

---

### 6.3 Add a Beneficiary

**`POST /api/beneficiaries`** — 🔒 Protected

Saves a new beneficiary for the authenticated user. The `userId` is always set from the authenticated session — it cannot be supplied in the request body.

**Request body:**
```json
{
  "name": "John Savings",
  "accountNumber": "ACC_JOHN_001",
  "bankName": "HDFC Bank",
  "ifscCode": "HDFC0000123",
  "nickname": "John"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | |
| `accountNumber` | string | ✅ | Unique per user |
| `bankName` | string | ✅ | |
| `ifscCode` | string | ✅ | Auto-uppercased |
| `nickname` | string | ❌ | Optional label (e.g. "Mom", "Landlord") |

**Success — HTTP 201:**
```json
{
  "success": true,
  "message": "Beneficiary added successfully",
  "beneficiary": {
    "_id": "6ab144f4220a09be8292ef8f",
    "userId": "6ab01ce10fca3904dcc8700e",
    "name": "John Savings",
    "accountNumber": "ACC_JOHN_001",
    "bankName": "HDFC Bank",
    "ifscCode": "HDFC0000123",
    "nickname": "John",
    "isActive": true,
    "createdAt": "2026-09-21T10:00:00.000Z",
    "updatedAt": "2026-09-21T10:00:00.000Z"
  }
}
```

**Error responses:**

| Status | Message |
|---|---|
| 400 | `name, accountNumber, bankName, and ifscCode are required` |
| 409 | `This account number is already saved as a beneficiary` |

---

### 6.4 Update a Beneficiary

**`PATCH /api/beneficiaries/:id`** — 🔒 Protected

Updates allowed fields of a beneficiary. `userId` and `accountNumber` are immutable and ignored even if included in the request body.

**Updatable fields:** `name`, `bankName`, `ifscCode`, `nickname`, `isActive`

**Request body (include only fields to change):**
```json
{
  "name": "John Updated",
  "bankName": "Axis Bank",
  "ifscCode": "UTIB0000456",
  "nickname": "Johnny",
  "isActive": false
}
```

**Success — HTTP 200:**
```json
{
  "success": true,
  "message": "Beneficiary updated successfully",
  "beneficiary": {
    "name": "John Updated",
    "bankName": "Axis Bank",
    "ifscCode": "UTIB0000456",
    "nickname": "Johnny",
    "isActive": false,
    "accountNumber": "ACC_JOHN_001",
    "updatedAt": "2026-09-21T10:05:00.000Z",
    ...
  }
}
```

**Error responses:**

| Status | Message |
|---|---|
| 400 | `No valid fields provided for update. Updatable fields: name, bankName, ifscCode, nickname, isActive` |
| 403 | `Not authorized to modify this beneficiary` |
| 404 | `Beneficiary not found` |

---

### 6.5 Delete a Beneficiary

**`DELETE /api/beneficiaries/:id`** — 🔒 Protected

Permanently deletes a beneficiary. Only the owner can delete their own beneficiaries.

**Request:** No body required.

**Success — HTTP 200:**
```json
{
  "success": true,
  "message": "Beneficiary deleted successfully"
}
```

**Error responses:**

| Status | Message |
|---|---|
| 403 | `Not authorized to delete this beneficiary` |
| 404 | `Beneficiary not found` |

---

## 7. Health Check

**`GET /api/health`** — Public

Verifies the API server is running.

**Success — HTTP 200:**
```json
{
  "success": true,
  "message": "BankEase API is running"
}
```

---

## Common HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK — request succeeded |
| 201 | Created — resource was created |
| 400 | Bad Request — validation failed or invalid input |
| 401 | Unauthorized — missing or invalid JWT |
| 403 | Forbidden — authenticated but not permitted |
| 404 | Not Found — resource does not exist |
| 409 | Conflict — duplicate resource (email, phone, account number) |
| 500 | Internal Server Error — unexpected failure |

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `5000`) |
| `MONGODB_URI` | MongoDB connection string (replica set required for transfers and bill payments) |
| `JWT_SECRET` | Secret key used to sign JWTs |
| `JWT_EXPIRES_IN` | Token expiry duration (default: `7d`) |

---

*Documentation generated from source code — `src/controllers/`, `src/routes/`, `src/middleware/`.*
