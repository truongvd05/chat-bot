# 🛠️ ChatDemo — Backend API

Backend for a real-time chat application inspired by Zalo.  
Built with Node.js + Express, featuring JWT authentication, real-time messaging via Socket.IO, Redis caching, and an admin role system.

📦 **Repo:** [github.com/truongvd05/chatdemo](https://github.com/truongvd05/chatdemo) &nbsp;|&nbsp; 📖 **Swagger:** `/docs`

---

## ✨ Features

- **JWT Authentication** — Access Token + Refresh Token rotation
- **Real-time messaging** — Socket.IO (WebSocket)
- **Group & direct chat** — conversation management
- **Admin system** — role-based access control
- **Redis** — rate limiting & token storage
- **Rate limiting** — anti-spam on message endpoints
- **Secure password reset** — token hashed before storing in DB
- **Cron job** — auto-delete expired reset tokens

---

## 🧰 Tech Stack

| Layer              | Technology                   |
| ------------------ | ---------------------------- |
| Runtime            | Node.js                      |
| Framework          | Express                      |
| ORM                | Prisma                       |
| Database           | MySQL                        |
| Cache & Rate limit | Redis                        |
| Real-time          | Socket.IO                    |
| Auth               | JWT (Access + Refresh Token) |
| API Docs           | Swagger (`/docs`)            |

---

## 📁 Project Structure

```
src/
├── controllers/    # Nhận request, validate, trả response
├── services/       # Business logic
├── middlewares/    # Auth, role check, rate limit
├── routes/         # Định nghĩa API routes
├── schemas/        # Validate input (Zod / Joi)
├── utils/          # Helper functions
└── schedules/      # Cron jobs (vd: xóa token hết hạn)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- MySQL đang chạy
- Redis đang chạy

### Installation

```bash
# 1. Clone repository
git clone https://github.com/truongvd05/chatdemo.git
cd chatdemo

# 2. Install dependencies
npm install

# 3. Cấu hình environment
cp .env.example .env
# Chỉnh sửa .env theo hướng dẫn bên dưới

# 4. Prisma setup
npx prisma generate
npx prisma migrate deploy

# 5. Chạy server
npm run dev
```

---

## ⚙️ Environment Variables

```env
DATABASE_URL=mysql://user:password@localhost:3306/chatdemo

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

REDIS_URL=redis://localhost:6379

CLIENT_URL=http://localhost:5173
```

> ⚠️ Restart server sau khi thay đổi `.env`.

---

## 🔐 Token Strategy

| Token         | TTL     | Lưu ở đâu       | Ghi chú                                |
| ------------- | ------- | --------------- | -------------------------------------- |
| Access Token  | 15 phút | Memory (client) | Dùng cho mọi API request               |
| Refresh Token | 7 ngày  | Database        | Rotate mỗi lần refresh, xóa khi logout |

---

## 🔑 Authentication Flow

```
Login
  │
  ▼
Access Token (15m) + Refresh Token (7d)
  │
  ├─ Request succeeds ───────────────► Response
  │
  └─ 401 Unauthorized
         │
         ▼
  POST /api/auth/refresh
         │
         ├─ Valid ──► New Access Token + New Refresh Token
         │
         └─ Invalid ──► 401 → Client redirects to Login
```

---

## 👑 Admin Role System

Các endpoint admin yêu cầu header:

```
Authorization: Bearer <access_token>
```

Middleware kiểm tra `role` trong JWT payload. Nếu không phải admin → `403 Forbidden`.

---

## 📡 API Reference

### Auth — `/api/auth`

| Method | Endpoint               | Mô tả                       | Auth |
| ------ | ---------------------- | --------------------------- | ---- |
| POST   | `/register`            | Đăng ký tài khoản           | ✗    |
| POST   | `/login`               | Đăng nhập                   | ✗    |
| POST   | `/refresh`             | Lấy access token mới        | ✗    |
| POST   | `/logout`              | Đăng xuất                   | ✓    |
| GET    | `/me`                  | Lấy thông tin user hiện tại | ✓    |
| POST   | `/forgot-password`     | Gửi email reset password    | ✗    |
| POST   | `/reset-password`      | Đặt lại mật khẩu            | ✓    |
| POST   | `/change-password`     | Đổi mật khẩu                | ✓    |
| POST   | `/verify-email`        | Xác thực email              | ✓    |
| POST   | `/resend-verify-email` | Gửi lại email xác thực      | ✓    |

---

### Conversations — `/api/conversations`

> Tất cả endpoint yêu cầu `Authorization: Bearer <access_token>`

| Method | Endpoint           | Mô tả                                     |
| ------ | ------------------ | ----------------------------------------- |
| POST   | `/direct`          | Tạo cuộc trò chuyện trực tiếp (user–user) |
| GET    | `/`                | Lấy tất cả conversations (DIRECT, GROUP)  |
| GET    | `/:conversationId` | Lấy chi tiết 1 conversation               |
| PUT    | `/:conversationId` | Đổi tên conversation                      |
| DELETE | `/:conversationId` | Xóa conversation                          |

---

### Messages — `/api/message`

> Tất cả endpoint yêu cầu `Authorization: Bearer <access_token>`

| Method | Endpoint                         | Mô tả                  | Ghi chú      |
| ------ | -------------------------------- | ---------------------- | ------------ |
| GET    | `/conversation/:conversationId`  | Lấy danh sách tin nhắn |              |
| POST   | `/conversations/:conversationId` | Gửi tin nhắn           | Rate limited |
| PUT    | `/:conversationId`               | Chỉnh sửa tin nhắn     | User–user    |
| DELETE | `/:conversationId`               | Xóa tin nhắn           | User–user    |

**Body gửi tin nhắn:**

```json
{
    "message": "Xin chào!",
    "targetUserId": "1"
}
```

---

### Admin — `/api/admin`

> Yêu cầu `Authorization: Bearer <access_token>` + role `admin`

| Method | Endpoint                  | Mô tả                                     |
| ------ | ------------------------- | ----------------------------------------- |
| GET    | `/users`                  | Lấy danh sách user                        |
| PUT    | `/users/:userId/ban`      | Ban user                                  |
| PUT    | `/users/:userId/unban`    | Unban user                                |
| PUT    | `/users/:userId/rename`   | Đổi tên user                              |
| GET    | `/groups`                 | Lấy danh sách group                       |
| PUT    | `/groups/:groupId/ban`    | Ban group                                 |
| PUT    | `/groups/:groupId/unban`  | Unban group                               |
| PUT    | `/groups/:groupId/rename` | Đổi tên group                             |
| GET    | `/stats/daily`            | Thống kê người dùng hằng ngày (real-time) |

---

## 🔌 Real-time — Socket.IO

| Event                | Mô tả                                 |
| -------------------- | ------------------------------------- |
| `message`            | Nhận/gửi tin nhắn mới                 |
| `typing`             | Typing indicator                      |
| `online` / `offline` | Trạng thái online                     |
| `admin:stats`        | Cập nhật thống kê real-time cho admin |

---

## 🗺️ Roadmap

- [ ] Logging & monitoring (Winston / Grafana)
- [ ] Unit & integration testing
- [ ] CI/CD pipeline
- [ ] Notification system
- [ ] Full-text search cho tin nhắn
- [ ] Emoji & reactions
- [ ] Message pinning
- [ ] Group roles & permissions

---

## 📌 Notes

- Đảm bảo MySQL và Redis đang chạy trước khi start server
- Dùng Swagger tại `/docs` để test API
- Restart server sau khi thay đổi `.env`

---

## 👤 Author

**Vũ Đình Trường**  
📧 truongbk444@gmail.com  
🐙 [github.com/truongvd05](https://github.com/truongvd05)
