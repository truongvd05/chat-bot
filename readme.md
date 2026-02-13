# Chat Bot Backend API Documentation

## API Documentation

- Swagger UI: /docs

## 1. Giới thiệu

Đây là backend cho một hệ thống **chat bot / chat conversation** tương tự ChatGPT, được xây dựng bằng **Node.js + Express + Prisma**.

## Architecture Overview

Thiết kế và xây dựng hệ thống RESTful APIs sử dụng Node.js và Express:

Triển khai cơ chế xác thực JWT với refresh token rotation, đảm bảo bảo mật và quản lý phiên đăng nhập hiệu quả
Tích hợp Redis để thực hiện rate limiting và quản lý refresh token
Xây dựng tính năng quên mật khẩu với hệ thống gửi email, sử dụng cơ chế hash token trước khi lưu vào cơ sở dữ liệu để tăng cường bảo mật
Triển khai cron job tự động xoá các PasswordResetToken hết hạn nhằm tối ưu và làm sạch dữ liệu hệ thống
Sử dụng SSE (Server-Sent Events) để xử lý streaming response theo thời gian thực cho tính năng chat/AI

## Token Strategy

- Access token: short-lived, dùng cho API & SSE
- Refresh token: lưu trong database gắn với user
- Khi logout, refresh token được xóa để chặn tái sử dụng

Dự án cung cấp:

- Xác thực người dùng (JWT + refresh token)
- Quản lý conversation & message
- Streaming phản hồi bằng **Server-Sent Events (SSE)**
- Rate limiting chống spam
- Prisma ORM + migration

Phù hợp cho:

- Frontend web / mobile
- Project portfolio Fresher Backend

---

## 2. Công nghệ sử dụng

- **Node.js / Express**
- **Prisma ORM**
- **JWT (Access Token + Refresh Token)**
- **SSE (Server-Sent Events)**
- **Redis (rate limit, token)**
- **PostgreSQL / MySQL** (tuỳ cấu hình Prisma)

---

## 3. Cài đặt & chạy project

### 3.1 Clone repository

```bash
git clone https://github.com/truongvd05/chat-bot.git
cd chat-bot
```

### 3.2 Cài dependencies

```bash
npm install
```

### 3.3 Environment variables

Tạo file `.env`:

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
REDIS_URL=
```

### 3.4 Prisma

```bash
npx prisma migrate deploy
npx prisma generate
```

### 3.5 Run server

```bash
npm run dev
```

---

## 4. Authentication API

Base path:

```
/api/auth
```

### 4.1 Register

`POST /api/auth/register`

```json
{
    "email": "user@gmail.com",
    "password": "123456"
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

```

- **controllers**: nhận request / response
- **services**: xử lý business logic
- **middlewares**: auth, rate limit
- **utils**: helper functions

---

## 9. Định hướng nâng cấp

- gửi được anh, emoji
- Input validation (Zod)
- Centralized error handler
- Unit / integration test
- Docker + CI/CD

---

## 10. Mục tiêu project

Project được xây dựng nhằm:

- Luyện tư duy backend
- Áp dụng auth, rate limit, streaming

✍️ Author: TruongVD
