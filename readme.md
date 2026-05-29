# 🛠️ ChatDemo — Backend API

Backend cho ứng dụng chat real-time lấy cảm hứng từ Zalo.  
Xây dựng với Node.js + Express, JWT authentication, Socket.IO, Redis, và tích hợp AI gợi ý câu trả lời.

📦 **Repo:** [github.com/truongvd05/chatdemo](https://github.com/truongvd05/chatdemo) &nbsp;|&nbsp; 📖 **Swagger:** `/docs`

---

## ✨ Features

- **JWT Authentication** — Access Token + Refresh Token rotation
- **Real-time messaging** — Socket.IO (WebSocket)
- **Group & direct chat** — quản lý cuộc trò chuyện, thêm/xóa thành viên, phân quyền admin
- **AI suggest** — gợi ý câu trả lời thông minh dựa trên ngữ cảnh hội thoại (OpenRouter)
- **Admin system** — role-based access control
- **Redis** — rate limiting & token storage
- **Rate limiting** — chống spam trên các endpoint nhắn tin
- **Secure password reset** — token được hash trước khi lưu DB
- **Notification system** — thông báo tin nhắn mới, sự kiện nhóm
- **Cron job** — tự động xóa token hết hạn
- **File upload** — hỗ trợ gửi ảnh, video, PDF

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
| AI                 | OpenRouter (Vercel AI SDK)   |
| File storage       | Cloudinary                   |
| API Docs           | Swagger (`/docs`)            |

---

## 📁 Project Structure

```
src/
├── controllers/    # Nhận request, validate, trả response
├── services/       # Business logic
├── middlewares/    # Auth, role check, rate limit, parse params
├── routes/         # Định nghĩa API routes
├── schemas/        # Validate input (Zod)
├── utils/          # Helper functions
├── socket/         # Socket.IO event handlers
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
git clone https://github.com/truongvd05/chatdemo

# 2. Cài đặt từng service riêng

# Backend
cd be-chat-bot
npm install
cp .env.example .env        # chỉnh sửa .env
npx prisma generate
npx prisma migrate deploy
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

AI_OPENROUTER_API_KEY=your_openrouter_api_key
AI_MODEL=google/gemini-2.0-flash-001

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
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

## 🤖 AI Suggest Flow

```
User A gửi tin nhắn
  │
  ▼
Socket: send_message
  │
  ├─ emit "bot_thinking" → true   (UI hiển thị loading)
  │
  ├─ Lấy 10 tin nhắn gần nhất làm context
  │
  ├─ Gọi OpenRouter API → 3 gợi ý câu trả lời
  │
  ├─ emit "bot_suggest" → suggestions[]
  │
  └─ emit "bot_thinking" → false  (UI ẩn loading)

Chỉ áp dụng cho DIRECT conversation.
Người dùng có thể bật/tắt tính năng này trong cài đặt.
```

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

| Method | Endpoint                           | Mô tả                         |
| ------ | ---------------------------------- | ----------------------------- |
| POST   | `/direct`                          | Tạo cuộc trò chuyện trực tiếp |
| POST   | `/group`                           | Tạo nhóm chat                 |
| GET    | `/`                                | Lấy tất cả conversations      |
| GET    | `/:conversationId`                 | Lấy chi tiết 1 conversation   |
| PUT    | `/:conversationId`                 | Đổi tên conversation          |
| DELETE | `/:conversationId`                 | Xóa conversation              |
| POST   | `/:conversationId/members`         | Thêm thành viên vào nhóm      |
| DELETE | `/:conversationId/members`         | Xóa thành viên khỏi nhóm      |
| POST   | `/:conversationId/members/promote` | Thăng quyền admin             |
| POST   | `/:conversationId/leave`           | Rời nhóm                      |

---

### Messages — `/api/messages`

| Method | Endpoint                                    | Mô tả                  | Ghi chú      |
| ------ | ------------------------------------------- | ---------------------- | ------------ |
| GET    | `/conversations/:conversationId`            | Lấy danh sách tin nhắn |              |
| POST   | `/conversations/:conversationId`            | Gửi tin nhắn + file    | Rate limited |
| PUT    | `/:messageId/conversations/:conversationId` | Chỉnh sửa tin nhắn     |              |
| DELETE | `/:messageId/conversations/:conversationId` | Xóa tin nhắn           |              |

---

### AI — `/api/messages`

| Method | Endpoint                   | Mô tả                       | Ghi chú      |
| ------ | -------------------------- | --------------------------- | ------------ |
| POST   | `/suggest/:conversationId` | Lấy gợi ý câu trả lời từ AI | Rate limited |

---

### Users — `/api/users`

| Method | Endpoint      | Mô tả                      |
| ------ | ------------- | -------------------------- |
| GET    | `/search`     | Tìm kiếm người dùng        |
| PUT    | `/profile`    | Cập nhật thông tin cá nhân |
| PATCH  | `/ai-suggest` | Bật/tắt tính năng AI gợi ý |
| POST   | `/unfriend`   | Hủy kết bạn                |

---

### Admin — `/api/admin`

> Yêu cầu role `ADMIN`

| Method | Endpoint               | Mô tả                                     |
| ------ | ---------------------- | ----------------------------------------- |
| GET    | `/users`               | Lấy danh sách user                        |
| PUT    | `/users/:userId/ban`   | Ban user                                  |
| PUT    | `/users/:userId/unban` | Unban user                                |
| GET    | `/groups`              | Lấy danh sách nhóm                        |
| GET    | `/stats/daily`         | Thống kê người dùng hằng ngày (real-time) |

---

## 🔌 Real-time — Socket.IO Events

### Client → Server

| Event          | Payload                                        | Mô tả              |
| -------------- | ---------------------------------------------- | ------------------ |
| `send_message` | `{ conversationId, content, parentMessageId }` | Gửi tin nhắn       |
| `edit_message` | `{ messageId, conversationId, content }`       | Chỉnh sửa tin nhắn |
| `typing`       | `{ conversationId }`                           | Đang gõ            |

### Server → Client

| Event                  | Mô tả                                    |
| ---------------------- | ---------------------------------------- |
| `receive_message`      | Tin nhắn mới                             |
| `message_edited`       | Tin nhắn đã được chỉnh sửa               |
| `bot_thinking`         | AI đang xử lý gợi ý (`true`/`false`)     |
| `bot_suggest`          | Danh sách gợi ý câu trả lời từ AI        |
| `typing_users`         | Danh sách người đang gõ                  |
| `group_event`          | Sự kiện nhóm (kick, leave, add, promote) |
| `conversation_updated` | Conversation có thay đổi                 |
| `unread_count`         | Số tin chưa đọc                          |
| `new_notification`     | Thông báo mới                            |
| `online_users`         | Danh sách user đang online               |

---

## 🗺️ Roadmap

- [ ] Logging & monitoring (Winston / Grafana)
- [ ] Unit & integration testing
- [ ] CI/CD pipeline
- [ ] Full-text search cho tin nhắn
- [ ] Emoji & reactions
- [ ] Message pinning
- [ ] Voice & video call

---

## 📌 Notes

- Đảm bảo MySQL và Redis đang chạy trước khi start server
- Dùng Swagger tại `/docs` để test API
- Restart server sau khi thay đổi `.env`
- AI suggest chỉ hoạt động với DIRECT conversation, không áp dụng cho GROUP

---

## 👤 Author

**Vũ Đình Trường**  
📧 truongbk444@gmail.com  
🐙 [github.com/truongvd05](https://github.com/truongvd05)
