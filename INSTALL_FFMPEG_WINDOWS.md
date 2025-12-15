# Hướng dẫn cài FFmpeg trên Windows

## Cách 1: Tải FFmpeg từ ffmpeg.org (Khuyến nghị)

### Bước 1: Tải FFmpeg
1. Truy cập: https://ffmpeg.org/download.html
2. Click vào link Windows builds (gssplit hoặc BtbN builds)
3. Tải bản **full** (không phải essentials)
4. Giải nén vào thư mục, ví dụ: `C:\ffmpeg`

### Bước 2: Thêm vào Environment PATH
1. Mở **Environment Variables**:
   - **Windows 11/10**: Nhấn `Win + X` → chọn **System** → **About** → **Advanced system settings** → **Environment Variables**
   - Hoặc tìm "Edit the system environment variables"

2. Trong cửa sổ **Environment Variables**:
   - Click **New** (dưới **User variables**)
   - **Variable name**: `Path`
   - **Variable value**: `C:\ffmpeg\bin` (hoặc đường dẫn thư mục bin của FFmpeg)
   - Click **OK**

3. Khởi động lại terminal/PowerShell

### Bước 3: Kiểm tra cài đặt
```powershell
ffmpeg -version
```

Nếu hiện version info, cài đặt thành công ✅

---

## Cách 2: Dùng Chocolatey (Nếu đã cài)

```powershell
choco install ffmpeg -y
```

Rồi kiểm tra:
```powershell
ffmpeg -version
```

---

## Cách 3: Dùng Windows Package Manager (winget)

```powershell
winget install ffmpeg
```

---

## Cấu hình Laravel (Optional)

Nếu FFmpeg không ở trong PATH, thêm vào `.env`:

```env
FFMPEG_PATH=C:\ffmpeg\bin\ffmpeg.exe
```

---

## Kiểm tra FFmpeg hoạt động

```powershell
# Thử extract frame từ video (1 giây đầu)
ffmpeg -ss 00:00:01 -i "video.mp4" -frames:v 1 -vf "scale=400:-1" -y "thumb.jpg"
```

---

## Sau cài FFmpeg

1. **Restart Laravel queue worker**:
   ```powershell
   php artisan queue:work
   ```

2. **Upload video mới** hoặc regenerate thumbnail cũ:
   ```powershell
   php artisan queue:work  # Để job chạy
   ```

3. **Kiểm tra logs**:
   ```powershell
   tail -f storage/logs/laravel.log
   ```

Thumbnail video sẽ được tạo tự động khi upload! 🎥

---

## Lỗi thường gặp

| Lỗi | Giải pháp |
|-----|----------|
| `ffmpeg is not recognized` | Thêm `C:\ffmpeg\bin` vào PATH, restart terminal |
| `FFmpeg execution failed` | Kiểm tra đường dẫn video có lỗi, logs trong storage/logs |
| Thumbnail vẫn không hiện | Chạy `php artisan queue:work` ở terminal riêng |

