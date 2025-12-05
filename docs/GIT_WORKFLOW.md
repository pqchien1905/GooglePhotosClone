# Git Workflow Guide - Google Photos Clone

## 📋 Quy trình làm việc với Git cho nhóm

### Nguyên tắc quan trọng
- ❌ **KHÔNG BAO GIỜ commit trực tiếp vào `main`**
- ✅ Luôn tạo branch riêng cho từng feature/task
- ✅ Tạo Pull Request (PR) để merge vào `main`
- ✅ Nhóm trưởng review và merge PR

---

## 🚀 Bắt đầu làm việc

### 1. Clone repositories

```bash
# Clone Backend (Laravel)
git clone https://github.com/pqchien1905/GooglePhotosClone.git
cd GooglePhotosClone

# Clone Frontend (Next.js) - nếu đã có repo riêng
git clone https://github.com/pqchien1905/gpc-frontend.git
```

### 2. Cấu hình Git (chỉ làm 1 lần)

```bash
git config user.name "Tên của bạn"
git config user.email "email@example.com"
```

---

## 🌿 Quy trình tạo Feature Branch

### Bước 1: Cập nhật main mới nhất

```bash
# Chuyển về main
git checkout main

# Lấy code mới nhất
git pull origin main
```

### Bước 2: Tạo branch mới

**Quy tắc đặt tên branch:**
- `feature/ten-tinh-nang` - Thêm tính năng mới
- `fix/ten-loi` - Sửa bug
- `refactor/ten-module` - Cải thiện code
- `docs/ten-tai-lieu` - Cập nhật tài liệu

```bash
# Ví dụ: Tạo branch cho tính năng upload ảnh
git checkout -b feature/upload-photo

# Ví dụ: Tạo branch sửa lỗi login
git checkout -b fix/login-error

# Ví dụ: Tạo branch theo task được giao
git checkout -b feature/task-123-add-album-sharing
```

### Bước 3: Code và commit

```bash
# Kiểm tra trạng thái
git status

# Thêm file đã thay đổi
git add .

# Hoặc thêm từng file cụ thể
git add app/Http/Controllers/PhotoController.php

# Commit với message rõ ràng
git commit -m "feat: thêm chức năng upload ảnh"
```

**Quy tắc viết commit message:**
```
<type>: <mô tả ngắn gọn>

Các type:
- feat: Thêm tính năng mới
- fix: Sửa bug
- refactor: Cải thiện code (không thêm/sửa tính năng)
- docs: Cập nhật tài liệu
- style: Sửa format code (không ảnh hưởng logic)
- test: Thêm/sửa test
```

### Bước 4: Push branch lên GitHub

```bash
# Push lần đầu tiên
git push -u origin feature/upload-photo

# Các lần sau
git push
```

---

## 📝 Tạo Pull Request (PR)

### Bước 1: Vào GitHub
1. Truy cập repository trên GitHub
2. Click "Compare & pull request" (nút màu xanh)

### Bước 2: Điền thông tin PR
```markdown
## Mô tả
- Đã thêm chức năng upload ảnh
- Tạo API endpoint POST /api/photos
- Xử lý resize và tạo thumbnail

## Checklist
- [ ] Code đã test local
- [ ] Không có lỗi TypeScript/PHP
- [ ] Đã viết unit test (nếu cần)

## Screenshots (nếu có UI)
[Đính kèm ảnh màn hình]
```

### Bước 3: Gửi PR
- Click "Create pull request"
- Tag nhóm trưởng để review

---

## 👀 Review và Merge (Dành cho Nhóm trưởng)

### Kiểm tra code
```bash
# Fetch branch của người khác
git fetch origin

# Checkout branch đó
git checkout feature/upload-photo

# Test local
php artisan serve
npm run dev
```

### Merge trên GitHub
1. Review code changes
2. Comment nếu cần chỉnh sửa
3. Approve nếu OK
4. Click "Merge pull request"
5. Delete branch sau khi merge (tùy chọn)

---

## 🔄 Cập nhật branch của bạn với main mới nhất

Khi `main` có thay đổi mới từ người khác:

```bash
# Đang ở branch của bạn
git checkout feature/your-branch

# Lấy main mới nhất
git fetch origin main

# Merge main vào branch của bạn
git merge origin/main

# Hoặc dùng rebase (gọn hơn)
git rebase origin/main

# Giải quyết conflict nếu có, sau đó push
git push
```

---

## ⚠️ Giải quyết Conflict

Khi có conflict:

```bash
# Git sẽ báo conflict ở file nào
# Mở file đó và tìm:
<<<<<<< HEAD
Code của bạn
=======
Code từ main
>>>>>>> origin/main

# Chỉnh sửa để giữ code đúng, xóa các marker
# Sau đó:
git add .
git commit -m "fix: resolve merge conflicts"
git push
```

---

## 📊 Các lệnh Git thường dùng

```bash
# Xem trạng thái
git status

# Xem lịch sử commit
git log --oneline

# Xem tất cả branch
git branch -a

# Xóa branch local
git branch -d feature/old-branch

# Hủy thay đổi chưa commit
git checkout -- .

# Hủy commit gần nhất (giữ lại thay đổi)
git reset --soft HEAD~1

# Lưu tạm thay đổi
git stash
git stash pop
```

---

## 🎯 Workflow theo Task

### Ví dụ: Bạn được giao task "Thêm chức năng xóa album"

```bash
# 1. Cập nhật main
git checkout main
git pull origin main

# 2. Tạo branch
git checkout -b feature/delete-album

# 3. Code xong, commit
git add .
git commit -m "feat: thêm chức năng xóa album"

# 4. Push lên GitHub
git push -u origin feature/delete-album

# 5. Tạo PR trên GitHub
# 6. Đợi nhóm trưởng review và merge
```

---

## 📁 Cấu trúc Branch

```
main (protected - chỉ nhóm trưởng merge)
├── feature/upload-photo (Thành viên A)
├── feature/album-crud (Thành viên B)
├── fix/login-bug (Thành viên C)
└── feature/share-link (Thành viên D)
```

---

## ❓ FAQ

**Q: Commit lỡ vào main rồi?**
```bash
# Quay lại commit trước đó
git reset --soft HEAD~1
git stash
git checkout -b feature/your-branch
git stash pop
git add .
git commit -m "your message"
git push -u origin feature/your-branch
```

**Q: Push nhầm branch?**
```bash
# Xóa branch trên remote
git push origin --delete wrong-branch-name
```

**Q: Muốn xem thay đổi của người khác?**
```bash
git fetch origin
git checkout origin/feature/other-persons-branch
```

---

## 📞 Liên hệ hỗ trợ

Nếu gặp vấn đề với Git, liên hệ nhóm trưởng hoặc tham khảo:
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
