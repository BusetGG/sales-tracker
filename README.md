# Sales Tracker Personal

Aplikasi PWA (Progressive Web App) untuk sales lapangan perorangan. Aplikasi ini memungkinkan pencatatan kunjungan toko, tagihan, retur barang, dan agenda follow-up dengan kemampuan offline-first dan sinkronisasi otomatis ke Google Sheets dan Google Drive.

## 🚀 Demo Online

Aplikasi dapat diakses online di: **https://[username].github.io/sales-tracker**

## Fitur Utama

- 📱 **Mobile-First PWA** - Dapat diinstal seperti aplikasi native di HP Android
- 📍 **Pencatatan Toko** - Nama, alamat, lokasi GPS, foto, dan catatan
- 👣 **Kunjungan** - Catat kunjungan dengan status, tagihan, dan retur
- 📦 **Retur Barang** - Kelola item retur dengan jumlah dan satuan
- 📅 **Agenda** - Follow up, janji bayar, ambil retur, dll
- 📊 **Laporan** - Harian, mingguan, bulanan dengan sortir toko
- ☁️ **Offline-First** - Berfungsi tanpa internet
- 🔄 **Auto Sync** - Sinkronisasi otomatis ke Google Sheets & Drive
- 📸 **Foto** - Ambil dan simpan foto faktur, retur, dan toko
- 💾 **Backup** - Export/Import data JSON
- ⏰ **Reminder** - Custom reminder dengan pin
- 🛒 **EMOS Tracking** - Lacak kunjungan EMOS

## Teknologi

- React 18 + Vite
- Tailwind CSS
- React Router
- Lucide React Icons
- IndexedDB (via idb)
- Google OAuth
- Google Sheets API
- Google Drive API
- Vite PWA Plugin

## 📦 Deploy ke GitHub Pages

### Prerequisites

1. Akun GitHub
2. Google OAuth Client ID & Secret

### Langkah 1: Buat Repository GitHub

1. Buka [GitHub](https://github.com)
2. Klik **New Repository**
3. Nama: `sales-tracker`
4. Visibility: **Public** (untuk GitHub Pages gratis)
5. Klik **Create Repository**

### Langkah 2: Push Kode ke GitHub

```bash
# Initialize git
cd sales-tracker
git init
git add .
git commit -m "Initial commit"

# Add remote (ganti dengan URL repository Anda)
git remote add origin https://github.com/USERNAME/sales-tracker.git

# Push
git branch -M main
git push -u origin main
```

### Langkah 3: Setup GitHub Secrets

1. Buka repository GitHub Anda
2. Go to **Settings** > **Secrets and variables** > **Actions**
3. Klik **New repository secret**
4. Tambahkan:
   - Name: `VITE_GOOGLE_CLIENT_ID`
   - Value: Client ID dari Google Cloud Console
5. Klik **Add secret**
6. Tambahkan secret kedua:
   - Name: `VITE_GOOGLE_CLIENT_SECRET`
   - Value: Client Secret dari Google Cloud Console

### Langkah 4: Enable GitHub Pages

1. Buka **Settings** > **Pages**
2. Source: **GitHub Actions**
3. Klik **Save**

### Langkah 5: Trigger Deployment

1. Buka tab **Actions** di repository
2. Deployment workflow akan berjalan otomatis
3. Atau klik **Run workflow** untuk deploy manual

### Langkah 6: Update Google OAuth Redirect URI

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buka **APIs & Services** > **Credentials**
3. Edit OAuth Client ID Anda
4. Tambahkan Authorized redirect URI baru:
   ```
   https://USERNAME.github.io/sales-tracker
   ```
5. Klik **Save**

## 🔧 Konfigurasi Lokal

```bash
# Clone repository
git clone https://github.com/USERNAME/sales-tracker.git
cd sales-tracker

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env dengan credentials Anda
```

### Environment Variables

```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-client-secret
VITE_REDIRECT_URI=http://localhost:5173
```

## Google OAuth Setup

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang ada
3. Enable APIs:
   - Google Sheets API
   - Google Drive API
4. Buka **APIs & Services** > **Credentials**
5. Buat **OAuth Client ID** (Web application)
6. Tambahkan Authorized redirect URIs:
   - `http://localhost:5173` (untuk development)
   - `https://USERNAME.github.io/sales-tracker` (untuk production)
7. Copy credentials ke environment variables

## Google Sheets Structure

Saat login pertama kali, spreadsheet akan dibuat otomatis dengan struktur:

- **Toko**: ID, Nama, Alamat, HP, Area, Lat, Long, Catatan
- **Kunjungan**: ID, Tanggal, NamaToko, StoreID, StatusKunjungan, Tagihan, StatusTagihan, Catatan
- **Retur**: ID, KunjunganID, Tanggal, NamaToko, NoFaktur, NamaBarang, Jumlah, Satuan
- **Agenda**: ID, Tanggal, NamaToko, StoreID, Kategori, Status, Catatan

## Google Drive Structure

Folder `Sales Tracker` akan dibuat otomatis dengan subfolder:

- `/Foto Toko` - Foto depan toko
- `/Foto Faktur` - Foto faktur kunjungan
- `/Foto Retur` - Foto retur barang
- `/Backup` - File backup JSON

## Mode Demo

Jika tidak memiliki akun Google, klik **Mode Demo** di halaman login untuk mencoba aplikasi tanpa sinkronisasi.

## Instalasi sebagai PWA

1. Buka aplikasi di browser Chrome
2. Klik menu browser > "Tambahkan ke layar utama"
3. Aplikasi akan terinstal seperti aplikasi native

## 📝 Update Kode

```bash
# Pull latest changes
git pull origin main

# Make changes
# ... edit files ...

# Commit and push
git add .
git commit -m "Your commit message"
git push
```

Deployment akan berjalan otomatis setelah push ke branch main.

## Lisensi

MIT License
