# Google Photos Clone - Project Instructions

## Project Overview
Laravel 12 + Inertia.js + React 19 + TypeScript photo management app with Google Photos-style UI.

## Tech Stack
- **Backend**: Laravel 12, SQLite/MySQL, Queue system
- **Frontend**: React 19, TypeScript, Inertia.js, Tailwind CSS
- **Image Processing**: Intervention Image v3
- **Build**: Vite
- **Language**: Vietnamese UI

## Completed Features
- ✅ Authentication (styled to match Google Photos)
- ✅ Photo & Video upload, view, trash, restore, delete
- ✅ Video/GIF support (MP4, MOV, AVI, WMV, FLV, WEBM, MKV)
- ✅ Album CRUD (create, rename, delete, add/remove photos, set cover)
- ✅ Sharing system with public links (token-based, expiry support)
- ✅ Share to friends (photos/albums)
- ✅ Friends system (requests, accept, remove, block)
- ✅ Notifications (shares, friend requests)
- ✅ Auto album creation by date (artisan command)
- ✅ Storage quota tracking (10GB default per user)
- ✅ Google Photos Layout (sidebar, search, user menu)
- ✅ Vietnamese translations throughout

## Key Files
- **Controllers**: `app/Http/Controllers/{Photo,Album,ShareLink}Controller.php`
- **Models**: `app/Models/{Photo,Album,ShareLink,User}.php`
- **Layout**: `resources/js/Layouts/GooglePhotosLayout.tsx` (NEW - use this for all pages)
- **Pages**: `resources/js/Pages/{Photos,Albums,Auth,Shared}/*.tsx`
- **Components**: `resources/js/Components/{UploadDropzone,PhotoViewerModal,ShareButton}.tsx`

## Important Patterns
- Use `GooglePhotosLayout` for all authenticated pages
- CSRF: Use axios (automatic token handling) instead of fetch
- Sharing: Payload format `{type: 'album'|'photo', id: number}`
- Images: `Image::make()` (Intervention Image v3 syntax)
- Auth: Routes in `routes/auth.php` and `web.php`

## Development Guidelines

### Code Style
- Use TypeScript for all React components
- Follow Laravel conventions (controllers, models, migrations)
- Keep Vietnamese labels consistent across UI
- Use Tailwind utility classes for styling

### Database
- Soft deletes for photos (trash feature)
- Unique constraint: `user_id + sha256` for photos (prevent duplicates)
- Migrations in `database/migrations/`

### Routes
- Auth routes: `routes/auth.php`
- Main routes: `routes/web.php`
- Public share route: `GET /share/{token}` (no middleware)

### Image Processing
- Use `Image::make()` (Intervention Image v3)
- Jobs: `GenerateThumbnail`, `OptimizeImage`, `ExtractMetadata`
- Queue system configured in `.env`

### Frontend
- Always use `GooglePhotosLayout` for authenticated pages
- Use axios for API calls (automatic CSRF)
- Grid layout: responsive columns (2-6), 4px gaps
- Photo viewer: modal with navigation, delete, EXIF

### Testing
- Build: `npm run build`
- Dev: `npm run dev` + `php artisan serve`
- Tasks available: `php: serve`, `vite: dev`, `dev: full`

## Remaining Features
1. Video thumbnail extraction with FFmpeg
2. Location-based auto albums
3. Unit & feature tests
4. Production deployment guide
