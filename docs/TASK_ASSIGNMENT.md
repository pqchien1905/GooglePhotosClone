# 📋 Phân công nhiệm vụ - Google Photos Clone

## 👥 Thành viên nhóm

| STT | Tên | Role | Branch prefix |
|-----|-----|------|---------------|
| 1 | [Tên nhóm trưởng] | Leader - Review & Merge | - |
| 2 | [Thành viên A] | Backend Developer | `feature/be-` |
| 3 | [Thành viên B] | Frontend Developer | `feature/fe-` |
| 4 | [Thành viên C] | Full-stack | `feature/fs-` |

---

## 📝 Danh sách Task

### 🔴 Priority 1 - Cần làm ngay

| Task ID | Mô tả | Người làm | Branch | Status |
|---------|-------|-----------|--------|--------|
| BE-01 | Test tất cả API với Postman, fix bug nếu có | | `fix/be-api-bugs` | ⬜ Todo |
| FE-01 | Hoàn thiện trang Login/Register (styling, validation) | | `feature/fe-auth-pages` | ⬜ Todo |
| FE-02 | Hoàn thiện trang Photos (grid, upload, delete) | | `feature/fe-photos-page` | ⬜ Todo |
| FE-03 | Kết nối Frontend với Backend API (test thực tế) | | `feature/fe-api-integration` | ⬜ Todo |

### 🟡 Priority 2 - Quan trọng

| Task ID | Mô tả | Người làm | Branch | Status |
|---------|-------|-----------|--------|--------|
| FE-04 | Hoàn thiện trang Albums (list, detail, CRUD) | | `feature/fe-albums` | ⬜ Todo |
| FE-05 | Hoàn thiện trang Videos | | `feature/fe-videos` | ⬜ Todo |
| FE-06 | Hoàn thiện trang Friends (list, requests) | | `feature/fe-friends` | ⬜ Todo |
| FE-07 | Hoàn thiện trang Shares | | `feature/fe-shares` | ⬜ Todo |
| BE-02 | Viết Unit Tests cho API | | `feature/be-unit-tests` | ⬜ Todo |

### 🟢 Priority 3 - Nice to have

| Task ID | Mô tả | Người làm | Branch | Status |
|---------|-------|-----------|--------|--------|
| FE-08 | Responsive design (mobile) | | `feature/fe-responsive` | ⬜ Todo |
| FE-09 | Dark mode | | `feature/fe-dark-mode` | ⬜ Todo |
| BE-03 | Video thumbnail với FFmpeg | | `feature/be-video-thumb` | ⬜ Todo |
| BE-04 | Auto album theo location | | `feature/be-location-album` | ⬜ Todo |

---

## 📌 Trạng thái

- ⬜ Todo - Chưa bắt đầu
- 🔄 In Progress - Đang làm
- 👀 In Review - Đang chờ review
- ✅ Done - Hoàn thành

---

## 🔄 Quy trình làm task

### Bước 1: Nhận task
```bash
# Cập nhật main
git checkout main
git pull origin main

# Tạo branch theo Task ID
git checkout -b feature/fe-auth-pages
```

### Bước 2: Code
- Làm theo yêu cầu của task
- Commit thường xuyên với message rõ ràng:
```bash
git add .
git commit -m "feat: hoàn thiện form login với validation"
```

### Bước 3: Push & tạo PR
```bash
git push -u origin feature/fe-auth-pages
```
- Vào GitHub tạo Pull Request
- Gắn tag nhóm trưởng để review

### Bước 4: Review & Merge (Nhóm trưởng)
- Review code
- Comment nếu cần sửa
- Merge khi OK

---

## 📅 Timeline (Ví dụ)

| Tuần | Mục tiêu |
|------|----------|
| Tuần 1 | Hoàn thành Priority 1 (Login, Register, Photos cơ bản) |
| Tuần 2 | Hoàn thành Priority 2 (Albums, Videos, Friends, Shares) |
| Tuần 3 | Testing, fix bugs, hoàn thiện UI |
| Tuần 4 | Deploy, viết báo cáo |

---

## 📞 Liên hệ

- Nhóm trưởng: [Tên] - [SĐT/Zalo]
- Nhóm Zalo/Discord: [Link]
