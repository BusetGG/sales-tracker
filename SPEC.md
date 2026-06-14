# Sales Tracker Personal - Specification Document

## 1. Concept & Vision

**Sales Tracker Personal** adalah aplikasi PWA mobile-first yang dirancang khusus untuk sales lapangan perorangan. Aplikasi ini memungkinkan pencatatan kunjungan toko, tagihan, retur barang, dan agenda follow-up dengan kemampuan offline-first dan sinkronisasi otomatis ke Google Sheets dan Google Drive. Desain minimalis namun fungsional dengan fokus pada kemudahan penggunaan satu tangan saat bekerja di lapangan.

## 2. Design Language

### Aesthetic Direction
Modern Material Design 3 dengan sentuhan profesional Indonesia - clean, trustworthy, dan efficient. Terinspirasi dari aplikasi banking modern namun dengan aksen yang lebih hangat.

### Color Palette
```
Primary:     #2563EB (Royal Blue)
Primary Dark: #1D4ED8
Primary Light: #3B82F6
Secondary:   #10B981 (Emerald)
Accent:      #F59E0B (Amber)
Background:  #F8FAFC (Light) / #0F172A (Dark)
Surface:     #FFFFFF (Light) / #1E293B (Dark)
Text Primary: #1E293B (Light) / #F1F5F9 (Dark)
Text Secondary: #64748B
Success:     #10B981
Warning:     #F59E0B
Error:       #EF4444
Border:      #E2E8F0 (Light) / #334155 (Dark)
```

### Typography
- **Primary Font**: Inter (Google Fonts) - clean, modern, excellent readability
- **Fallback**: system-ui, -apple-system, sans-serif
- **Scale**:
  - Heading 1: 28px/700
  - Heading 2: 24px/600
  - Heading 3: 20px/600
  - Body: 16px/400
  - Caption: 14px/400
  - Small: 12px/400

### Spatial System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 48px
- Card padding: 16px
- Section gap: 24px
- Touch target minimum: 48px

### Motion Philosophy
- **Micro-interactions**: 150ms ease-out for buttons, toggles
- **Page transitions**: 200ms slide-up for modals, 300ms for page changes
- **Loading states**: Skeleton pulse 1.5s infinite
- **Feedback**: Scale 0.95 on press, haptic-style visual feedback

### Visual Assets
- **Icons**: Lucide React - consistent 24px stroke width 2
- **Photos**: Lazy loaded with blur placeholder, rounded-lg corners
- **Empty states**: Custom illustrations using Lucide icons composition

## 3. Layout & Structure

### Page Architecture
```
┌─────────────────────────────────┐
│         Status Bar              │
├─────────────────────────────────┤
│                                 │
│         Main Content            │
│         (Scrollable)            │
│                                 │
│                                 │
├─────────────────────────────────┤
│      Bottom Navigation          │
│   [Dashboard][Toko][Kunjungan]  │
│          [Agenda][Laporan]      │
└─────────────────────────────────┘
```

### Responsive Strategy
- Mobile-first: 320px - 480px primary target
- Tablet: 481px - 768px - 2 column grid for lists
- Desktop: 769px+ - Max-width 480px centered (mobile simulation)

### Content Flow
- Cards stack vertically with 12px gaps
- Sections separated by 24px
- FAB positioned 16px from right edge, 80px from bottom
- Safe area padding: 16px horizontal, env(safe-area-inset-bottom)

## 4. Features & Interactions

### Authentication Flow
1. App opens → Check IndexedDB for stored session
2. If no session → Show Login page with Google button
3. If session exists → Validate token, load Dashboard
4. Google OAuth → Get access token, refresh token, user profile
5. Store in IndexedDB: name, email, photo, tokens
6. On logout → Clear IndexedDB, redirect to login

### Dashboard Features
- **Summary Cards**: 4 cards in 2x2 grid
  - Kunjungan Hari Ini (count + icon)
  - Total Tagihan Hari Ini (formatted currency)
  - Total Retur Hari Ini (count)
  - Agenda Hari Ini (count)
- **Quick Actions**: 3 large buttons in row
  - Tambah Kunjungan → Navigate to /visits/new
  - Tambah Toko → Navigate to /stores/new
  - Lihat Agenda → Navigate to /agenda
- **Sync Status**: Colored indicator with text
  - Green + "Online & Sinkron" when all synced
  - Yellow + "Menunggu Sinkronisasi" when pending
  - Red + "Offline" when no connection

### Store Management
**List View**:
- Search bar with debounce (300ms)
- List items show: name, area, last visit date
- Swipe actions: Edit (left), Delete (right)
- Pull to refresh

**Add/Edit Form**:
- Fields: Nama*, Alamat*, HP, Area, Catatan
- Location button: Get GPS coordinates
- Photo button: Open camera or gallery
- Form validation on submit

**Detail View**:
- Header: Store photo (or placeholder)
- Info section: All store data
- Action buttons: WhatsApp, Telepon, Maps
- Visit history: Chronological list

### Visit Management (Core Feature)
**Create Visit Flow**:
1. Select store (searchable dropdown)
2. Visit status: Radio buttons (Dikunjungi/Tutup/Tidak Ada)
3. If "Dikunjungi":
   - Bill section: Amount input, status select
   - Return section: Dynamic list of items
   - Photo section: Facture & return photos
4. Notes textarea
5. Submit → Save to IndexedDB with syncStatus="pending"

**Return Item Input**:
- Dynamic add/remove
- Fields: Item name, quantity, unit
- Visual: Card list with delete button

**Photo Capture**:
- Camera capture or gallery select
- Preview with delete option
- Auto-compress before storage

### Agenda Management
**View Modes**:
- Today tab: Today's agenda items
- Upcoming tab: Future items sorted by date

**Agenda Card**:
- Category badge (Janji Bayar/Follow Up/Ambil Retur/Lainnya)
- Title, store name, date, notes preview
- Status indicator (Pending=orange, Done=green)
- Tap to toggle status

**Create/Edit Form**:
- Store selector
- Category dropdown
- Date picker
- Title input
- Notes textarea

### Report Generation
**Date Selection**:
- Default: Today
- Calendar picker for custom range

**Report Content**:
```
📊 LAPORAN HARIAN
📅 [Tanggal]

━━━━━━━━━━━━━━━━━━
📍 KUNJUNGAN
Jumlah Kunjungan: [X]

━━━━━━━━━━━━━━━━━━
💰 TAGIHAN
Total Tagihan: Rp [XXX,XXX]

━━━━━━━━━━━━━━━━━━
📦 RETUR
[Item 1] - [Jumlah] [Satuan]
[Item 2] - [Jumlah] [Satuan]

━━━━━━━━━━━━━━━━━━
📝 CATATAN
[Catatan kunjungan]
━━━━━━━━━━━━━━━━━━
```

**Actions**:
- Copy to clipboard
- Share via WhatsApp (web share API)

### Settings & Profile
- Google profile display
- Dark mode toggle
- Manual sync button
- Export backup (JSON download)
- Import backup (JSON file upload)
- Logout with confirmation

### Sync System
**Sync Logic**:
1. On data save: Mark as pending sync
2. When online: Process pending queue FIFO
3. Sync order: Stores → Visits → Returns → Agendas
4. On success: Mark as synced, update remote IDs
5. On failure: Keep pending, retry with exponential backoff

**Conflict Resolution**:
- Local timestamp wins for offline edits
- Remote data preserved in backup folder

## 5. Component Inventory

### BottomNav
- 5 tabs with icons and labels
- Active state: Primary color, filled icon
- Inactive: Gray, outline icon
- Fixed position, 64px height

### Card
- White background, rounded-xl (12px)
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Padding: 16px
- Hover: Slight lift (translateY -2px)

### Button
- Primary: Blue bg, white text, rounded-lg
- Secondary: White bg, blue text, blue border
- Danger: Red bg, white text
- Sizes: sm(32px), md(44px), lg(52px)
- Pressed state: Scale 0.95
- Disabled: 50% opacity

### Input
- Height: 48px
- Border: 1px solid border color
- Focus: Blue border, subtle shadow
- Error: Red border, error text below
- Label above, floating or static

### FAB (Floating Action Button)
- 56px circle, primary color
- Shadow: 0 4px 12px rgba(0,0,0,0.15)
- Icon: Plus
- Position: bottom-right, 16px margin
- Extended variant for primary actions

### Toast
- Fixed bottom center, above nav
- Types: success (green), error (red), info (blue)
- Auto-dismiss: 3 seconds
- Swipe to dismiss

### Skeleton
- Animated gradient pulse
- Match component dimensions
- Gray base color with lighter overlay

### Modal/Sheet
- Bottom sheet style
- Drag handle at top
- Backdrop blur
- Slide up animation

### Empty State
- Centered icon (64px, gray)
- Title text
- Subtitle text
- Optional action button

## 6. Technical Approach

### Project Structure
```
sales-tracker/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icons/
│   └── images/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── forms/
│   ├── pages/
│   ├── services/
│   │   ├── db.js (IndexedDB)
│   │   ├── auth.js (Google OAuth)
│   │   ├── sync.js (Google APIs)
│   │   └── backup.js
│   ├── hooks/
│   ├── contexts/
│   ├── utils/
│   └── lib/
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

### IndexedDB Schema
**Database**: sales_tracker_db (version 1)

**Stores Object Store**:
| Field | Type | Index |
|-------|------|-------|
| id | string (UUID) | primaryKey |
| nama | string | |
| alamat | string | |
| hp | string | |
| area | string | |
| latitude | number | |
| longitude | number | |
| foto | string (base64/URL) | |
| catatan | string | |
| createdAt | number (timestamp) | |
| updatedAt | number (timestamp) | |
| syncStatus | string | indexed |
| remoteId | string | |

**Visits Object Store**:
| Field | Type | Index |
|-------|------|-------|
| id | string (UUID) | primaryKey |
| storeId | string | indexed |
| storeName | string | |
| tanggal | number (timestamp) | indexed |
| statusKunjungan | string | |
| tagihan | number | |
| statusTagihan | string | |
| retur | array | |
| fotoFaktur | string | |
| fotoRetur | string | |
| catatan | string | |
| createdAt | number (timestamp) | |
| updatedAt | number (timestamp) | |
| syncStatus | string | indexed |

**Agendas Object Store**:
| Field | Type | Index |
|-------|------|-------|
| id | string (UUID) | primaryKey |
| storeId | string | indexed |
| storeName | string | |
| judul | string | |
| kategori | string | |
| tanggal | number (timestamp) | indexed |
| catatan | string | |
| status | string | indexed |
| createdAt | number (timestamp) | |
| updatedAt | number (timestamp) | |
| syncStatus | string | indexed |

**Settings Object Store**:
| Field | Type |
|-------|------|
| key | string (primaryKey) |
| value | any |

### Google OAuth Config
- Client ID: Environment variable
- Scopes: 
  - openid, email, profile
  - https://www.googleapis.com/auth/spreadsheets
  - https://www.googleapis.com/auth/drive.file
- Flow: Authorization Code with PKCE
- Token storage: IndexedDB (encrypted in production)

### Google Sheets Structure
**Spreadsheet Name**: Sales Tracker Data

**Sheet 1: Toko**
Headers: ID, Nama, Alamat, HP, Area, Lat, Long, Catatan, CreatedAt

**Sheet 2: Kunjungan**
Headers: ID, Tanggal, NamaToko, StoreID, StatusKunjungan, Tagihan, StatusTagihan, Catatan

**Sheet 3: Retur**
Headers: ID, KunjunganID, Tanggal, NamaToko, NoFaktur, NamaBarang, Jumlah, Satuan

**Sheet 4: Agenda**
Headers: ID, Tanggal, NamaToko, StoreID, Kategori, Status, Catatan

### Google Drive Structure
**Root Folder**: Sales Tracker

**Subfolders**:
- /Foto Toko - Store photos
- /Foto Faktur - Visit invoice photos
- /Foto Retur - Return photos
- /Backup - JSON backups

### Service Worker Strategy
- **Caching**: Cache-first for static assets
- **Network**: Network-first for API calls, fallback to cache
- **Background Sync**: Queue failed requests for retry
- **Offline Detection**: Navigator.onLine + heartbeat check

### PWA Manifest
```json
{
  "name": "Sales Tracker Personal",
  "short_name": "Sales Tracker",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#2563EB",
  "theme_color": "#2563EB",
  "orientation": "portrait",
  "icons": [...]
}
```

## 7. Data Flow

### Offline-First Architecture
```
User Action
    ↓
Save to IndexedDB (syncStatus: "pending")
    ↓
UI Update Immediately
    ↓
[If Online]
    ↓
Background Sync Service
    ↓
Upload to Google Sheets/Drive
    ↓
Update syncStatus: "synced"
Update remoteId
```

### Photo Upload Flow
```
Capture Photo
    ↓
Compress (max 1280px, 70% JPEG)
    ↓
Store as base64 in IndexedDB
    ↓
Upload to Google Drive (when online)
    ↓
Replace base64 with Drive URL
```

## 8. State Management

Using React Context for global state:
- **AuthContext**: User session, tokens
- **ThemeContext**: Dark mode toggle
- **SyncContext**: Online status, pending count, sync triggers

Local component state for forms and UI interactions.

## 9. Error Handling

- **Network Errors**: Queue for retry, show toast
- **Validation Errors**: Inline field errors
- **Auth Errors**: Redirect to login
- **Storage Errors**: Alert user, suggest export
- **Photo Errors**: Fallback placeholder

## 10. Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse PWA Score: > 90
- Bundle size: < 500KB gzipped
- IndexedDB operations: < 100ms