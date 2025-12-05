# Google Photos Clone - REST API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication
API sử dụng Laravel Sanctum để xác thực. Sau khi đăng nhập, bạn nhận được `token` và sử dụng trong header:
```
Authorization: Bearer {token}
```

---

## Endpoints

### 🔐 Authentication

#### POST /auth/register
Đăng ký tài khoản mới.

**Request Body:**
```json
{
  "name": "Tên người dùng",
  "email": "email@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Response (201):**
```json
{
  "message": "Đăng ký thành công.",
  "user": { "id": 1, "name": "...", "email": "..." },
  "token": "1|abc123..."
}
```

#### POST /auth/login
Đăng nhập.

**Request Body:**
```json
{
  "email": "email@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Đăng nhập thành công.",
  "user": { ... },
  "token": "1|abc123..."
}
```

#### POST /auth/logout
Đăng xuất (yêu cầu token).

#### GET /auth/user
Lấy thông tin user hiện tại.

#### PUT /auth/password
Cập nhật mật khẩu.

#### POST /auth/forgot-password
Gửi email reset mật khẩu.

#### POST /auth/reset-password
Reset mật khẩu với token.

---

### 👤 Profile

#### GET /profile
Lấy thông tin profile.

#### PATCH /profile
Cập nhật thông tin profile.

**Request Body:**
```json
{
  "name": "Tên mới",
  "email": "email@example.com"
}
```

#### POST /profile/avatar
Upload ảnh đại diện.

**Request (multipart/form-data):**
- `avatar`: File ảnh (max 2MB)

#### GET /profile/storage
Lấy thông tin dung lượng lưu trữ.

**Response:**
```json
{
  "storage": {
    "used": 1073741824,
    "quota": 10737418240,
    "available": 9663676416,
    "used_human": "1 GB",
    "quota_human": "10 GB",
    "percentage": 10.0
  }
}
```

#### DELETE /profile
Xóa tài khoản.

---

### 📷 Photos

#### GET /photos
Lấy danh sách ảnh.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | int | Trang (default: 1) |
| per_page | int | Số ảnh/trang (default: 50, max: 100) |
| q | string | Tìm kiếm theo tên/địa điểm |
| type | string | `image` hoặc `video` |
| from | date | Từ ngày (YYYY-MM-DD) |
| to | date | Đến ngày (YYYY-MM-DD) |
| sort | string | `newest`, `oldest`, `name_asc`, `name_desc`, `size_asc`, `size_desc` |
| size | string | `small` (<1MB), `medium` (1-5MB), `large` (>5MB) |
| format | string | Filter theo format (jpeg, png, etc.) |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "path": "photos/abc.jpg",
      "thumb_path": "thumbs/abc.jpg",
      "mime": "image/jpeg",
      "size": 1024000,
      "is_favorite": false,
      "created_at": "2024-01-01T00:00:00Z",
      "captured_at": "2024-01-01T00:00:00Z",
      "location_text": "Hà Nội, Việt Nam",
      "exif": { ... }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 50,
    "total": 500
  }
}
```

#### POST /photos
Upload ảnh/video.

**Request (multipart/form-data):**
- `photos[]`: Mảng file ảnh/video

**Supported formats:**
- Images: jpeg, jpg, png, gif, bmp, webp, svg
- Videos: mp4, mov, avi, wmv, flv, webm, mkv

#### GET /photos/{id}
Lấy chi tiết 1 ảnh.

#### DELETE /photos/{id}
Xóa ảnh (chuyển vào thùng rác).

#### POST /photos/{id}/restore
Khôi phục ảnh từ thùng rác.

#### DELETE /photos/{id}/force
Xóa vĩnh viễn ảnh.

#### POST /photos/{id}/favorite
Toggle yêu thích.

#### GET /photos/favorites
Lấy danh sách ảnh yêu thích.

#### GET /photos/trash
Lấy danh sách ảnh trong thùng rác.

#### POST /photos/share-email
Chia sẻ ảnh qua email.

**Request Body:**
```json
{
  "photo_ids": [1, 2, 3],
  "emails": ["friend@example.com"],
  "message": "Check out these photos!"
}
```

---

### 🎬 Videos

#### GET /videos
Lấy danh sách video (tương tự photos).

#### POST /videos/share-email
Chia sẻ video qua email.

---

### 📁 Albums

#### GET /albums
Lấy danh sách albums (paginated).

#### GET /albums/list
Lấy tất cả albums (cho picker/modal).

#### POST /albums
Tạo album mới.

**Request Body:**
```json
{
  "name": "Tên album",
  "photo_ids": [1, 2, 3]
}
```

#### GET /albums/{id}
Lấy chi tiết album kèm danh sách ảnh.

#### PATCH /albums/{id}
Cập nhật album.

**Request Body:**
```json
{
  "name": "Tên mới",
  "cover_photo_id": 1
}
```

#### DELETE /albums/{id}
Xóa album.

#### POST /albums/{id}/photos
Thêm ảnh vào album.

**Request Body:**
```json
{
  "photo_ids": [4, 5, 6]
}
```

#### DELETE /albums/{id}/photos/{photoId}
Xóa ảnh khỏi album.

#### POST /albums/share-email
Chia sẻ albums qua email.

---

### 👥 Friends

#### GET /friends
Lấy tất cả mối quan hệ bạn bè.

**Response:**
```json
{
  "friends": [...],
  "incoming": [...],
  "outgoing": [...],
  "blocked": [...]
}
```

#### GET /friends/list
Lấy danh sách bạn bè đã chấp nhận (cho share picker).

#### POST /friends
Gửi lời mời kết bạn.

**Request Body:**
```json
{
  "email": "friend@example.com"
}
```

#### PATCH /friends/{id}
Chấp nhận lời mời kết bạn.

#### DELETE /friends/{id}
Xóa bạn bè / hủy lời mời.

#### POST /friends/{id}/block
Chặn người dùng.

#### POST /friends/{id}/unblock
Bỏ chặn người dùng.

#### POST /friends/share
Chia sẻ ảnh/album với bạn bè.

**Request Body:**
```json
{
  "friend_ids": [1, 2],
  "photo_ids": [1, 2, 3],
  "album_id": null,
  "message": "Check this out!"
}
```

---

### 📤 Shares

#### GET /shares/received
Lấy danh sách chia sẻ đã nhận.

#### GET /shares/sent
Lấy danh sách chia sẻ đã gửi.

#### POST /shares/{id}/read
Đánh dấu đã đọc.

---

### 🔗 Share Links

#### GET /share-links
Lấy danh sách share links của user.

#### POST /share-links
Tạo share link.

**Request Body:**
```json
{
  "type": "album",
  "id": 1,
  "expires_in_days": 7
}
```

**Response:**
```json
{
  "url": "http://localhost:8000/api/share/abc123",
  "token": "abc123",
  "expires_at": "2024-01-08T00:00:00Z"
}
```

#### DELETE /share-links/{id}
Xóa share link.

#### GET /share/{token} (Public)
Xem nội dung được chia sẻ (không cần auth).

#### GET /share/{token}/download (Public)
Tải album dưới dạng ZIP.

---

### 🔔 Notifications

#### GET /notifications
Lấy danh sách thông báo.

#### GET /notifications/unread-count
Lấy số thông báo chưa đọc.

#### POST /notifications/{id}/read
Đánh dấu đã đọc.

#### POST /notifications/read-all
Đánh dấu tất cả đã đọc.

#### DELETE /notifications/{id}
Xóa thông báo.

---

## Error Responses

Tất cả lỗi trả về format:
```json
{
  "message": "Mô tả lỗi",
  "errors": {
    "field": ["Chi tiết lỗi"]
  }
}
```

**HTTP Status Codes:**
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `410` - Gone (expired)
- `422` - Validation Error
- `500` - Server Error

---

## Postman Collection

Import file `postman_collection.json` vào Postman để test API.

1. Import collection
2. Chạy request "Register" hoặc "Login" trước
3. Token sẽ tự động được lưu vào collection variable
4. Các request khác sẽ tự động sử dụng token này
