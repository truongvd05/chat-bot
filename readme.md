# Chat Bot Backend API Documentation

## API Documentation

- Swagger UI: /docs

## Overview

This backend provides a complete system for:

User authentication (JWT + Refresh Token Rotation)
Chat conversation & messaging
Real-time AI streaming using Server-Sent Events (SSE)
Rate limiting (anti-spam)
Scalable architecture with Redis & Prisma

## Architecture Overview

RESTful API design using Node.js + Express
JWT authentication with refresh token rotation
Redis integration for:
rate limiting
token storage
Secure password reset flow:
token hashing before storing in database
Cron job:
auto-delete expired reset tokens
Real-time streaming via SSE for AI responses

## Token Strategy

-- Access Token
Short-lived (15 minutes)
Used for API & SSE requests
Refresh Token
Stored in database
Rotated on each refresh
Deleted on logout (prevent reuse)

## Tech Stack

-- Backend
Node.js
Express
-- Database & ORM
Prisma ORM
MySQL / PostgreSQL

-- Authentication
JWT (Access + Refresh Token)

-- Realtime & Performance
Server-Sent Events (SSE)
Redis (rate limit, token)

## Getting Started

1. Clone repository
   git clone https://github.com/truongvd05/chat-bot.git
   cd chat-bot
2. Install dependencies
   npm install

3. Environment variables
   Create .env file:
   DATABASE_URL=
   JWT_SECRET=
   JWT_REFRESH_SECRET=
   ACCESS_TOKEN_EXPIRES_IN=15m
   REFRESH_TOKEN_EXPIRES_IN=7d
   REDIS_URL=
   CLIENT_URL=http://localhost:5173

4. Prisma setup
   npx prisma generate
   npx prisma migrate deploy

5. Run server
   npm run dev

## 4. Authentication API

Base path:

```
/api/auth
```

### 4.1 Register

`POST /api/auth/register`

```json
{
    "name": "yourname",
    "email": "user@gmail.com",
    "password": "123456",
    "confirm_password": "123456"
}
```

---

### 4.2 Login

`POST /api/auth/login`

```json
{
    "email": "user@gmail.com",
    "password": "123456"
}
```

Response:

```json
{
    "accessToken": "...",
    "refreshToken": "..."
}
```

---

### 4.3 Refresh access token

`POST /api/auth/refresh`

```json
{
    "refresh_token": "..."
}
```

---

### 4.4 Logout

`POST /api/auth/logout`

Header:

```
Authorization: Bearer <access_token>
```

### 4.5 reset-password

`POST /api/auth/reset-password`

```json
{
    "password": "...",
    "new-password": "..."
}
```

Header:

```
Authorization: Bearer <access_token>
```

---

### 4.6 Get current user

`GET /api/auth/me`

---

### 4.7 forgot password

`POST /api/auth/forgot-password`

```json
{
    "email": "..."
}
```

### 4.8 change password

`POST /api/auth/change-password`

```json
{
    "password": "...",
    "new-password": "...",
    "confirm_password": "..."
}
```

Header:

```
Authorization: Bearer <access_token>
```

### 4.9 verify email

`POST /api/auth/verify-email`

```json
{
    "token": "..."
}
```

Header:

```
Authorization: Bearer <access_token>
```

### 4.10 resen verify email

`POST /api/auth/resen-verify-email`

```

Header:

```

Authorization: Bearer <access_token>

```

## 5. Conversation API

Base path:

```

/api/conversations

```

> Tất cả endpoint yêu cầu header:

```

Authorization: Bearer <access_token>

---

## 5.1 Create conversation

`POST /direct` tạo chat user-user
`POST /bot` tạo chat user-bot

---

### 5.2 Rename conversation

<!-- đổi tên conversation với bot -->

`put /:conversationId`

```json
{
    "title": "Chat with AI"
}
```

---

### 5.3 Get all conversations

<!-- lấy conversation type DIRECT, GOURP -->

`GET /`

<!-- lấy conversation với type = BOT -->

`GET /bots`

---

### 5.4 Get one conversation

<!-- lấy 1 conversation với type DIRECT, GROUP -->

`GET /:conversationId`

<!-- lấy 1 conversation với type BOT -->

`GET /bot/:conversationId`

---

### 5.5 Delete conversation

`DELETE /:conversationId`

---

## 6. Message API

Base path:

`/api/message`

```

> Tất cả endpoint yêu cầu header:

```

Authorization: Bearer <access_token>

````

---

### 6.1 Get messages

`GET /conversation/:conversationId`

---

### 6.2 Send message

`POST /conversations/:conversationId`

<!-- send với bot -->

```json
{
    "message": "Hello AI"
}
````

<!-- send với user -->

```json
{
    "message": "Hello AI",
    "targetUserId": "1"
}
```

> Có rate limit để chống spam

---

### 6.3 Edit message

`PUT /:conversationId`

```json
{
    "messageId": 10,
    "content": "Updated content"
}
```

## dùng với chat user-user

### 6.4 Delete message

`DELETE /:conversationId`

```json
{
    "messageId": 10
}
```

## dùng với chat user-user

---

## 7. Streaming (SSE)

### Stream AI response

`GET /stream/:conversationId`

Response headers:

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

Event example:

```
data: {"content": "AI response chunk"}
```

---

## 8. Kiến trúc thư mục

```
src/
 ├─ controllers/
 ├─ services/
 ├─ middlewares/
 ├─ routes/
 ├─ utils/
 └─ schedules/
 └─ service/
 └─ utils/
 └─ schemas/


```

- **controllers**: nhận request, sử lí validate / response
- **services**: xử lý business logic
- **middlewares**: auth, rate limit
- **utils**: helper functions
- **schema**: validate input

---

📌 Notes
Ensure database & Redis are running before starting server
Restart server after updating .env
Use Swagger (/docs) for API testing

## 9. In Progress / Planned

- Video upload support
- Notification System
- Unit & integration testing
- Unit & integration testing
- Logging & monitoring (Winston / Grafana)
- CI/CD pipeline

-- Potential Enhancements
😊 Emoji & reactions
📌 Message pinning
🔍 Full-text search for messages
👥 Group chat improvements (roles, permissions)
📱 Mobile optimization (PWA / React Native)

---

## 10 Project Goals

Practice backend architecture
Implement authentication & security
Build real-time streaming system

✍️ Author: TruongVD
