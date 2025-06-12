# 🌐 Frontend Drone Vision Dashboard (Next.js/React)

Repositori ini berisi kode `frontend` untuk `Drone Vision System`, yang dibangun menggunakan **Next.js** dan **React**. `Frontend` ini berfungsi sebagai `dashboard web` interaktif, memungkinkan pengguna untuk melihat `live stream` video yang sudah diproses dari `backend`, menyesuaikan `parameter stream`, dan melihat `metadata` analisis `computer vision` secara `real-time`.

## ✨ Fitur Utama

*   **Penerimaan `Live Stream`:** Menampilkan `stream` video yang sudah di-`overlay` dengan hasil analisis `Computer Vision` (deteksi orang, pengenalan wajah, kepadatan kerumunan) dari `backend`.
*   **Kontrol Kualitas `Stream` Dinamis:** Memungkinkan pengguna untuk menyesuaikan `parameter` seperti `Target FPS`, Kualitas Kompresi `JPEG`, Resolusi Tampilan (`Output Display Resolution`), dan yang terpenting, Resolusi Pemrosesan `CV` internal `backend` (`CV Processing Resolution`) secara `real-time`. Ini memberikan kontrol atas `trade-off` antara kualitas visual, kelancaran `stream`, dan performa `server`.
*   **Tampilan `Metadata` `CV` Komprehensif:** Menampilkan data analitik kunci seperti `jumlah total orang` yang terdeteksi, `status kerumunan` (Normal, Terdeteksi, Padat), `list` wajah yang dikenali beserta `confidence`nya, dan `visualisasi kepadatan` per zona `grid`.
*   **Navigasi Intuitif:** Menyediakan tombol untuk menghentikan `stream` atau kembali ke halaman `input URL` `stream` yang berbeda.
*   **Desain Responsif:** `Layout` berbasis `grid` yang memungkinkan `Camera Feed` dan `CV Analytics/Controls` terlihat berdampingan untuk `user experience` yang optimal.

## 🚀 Cara Menjalankan (Get Started)

Ikuti langkah-langkah di bawah ini untuk menjalankan `frontend` aplikasi `web` Anda.

### 1. Prasyarat

Pastikan Anda telah menginstal yang berikut ini di sistem Anda:

*   **Node.js** (Disarankan versi LTS)
*   **npm** (atau Yarn) - Pengelola `package` JavaScript (biasanya sudah termasuk dengan instalasi Node.js)
*   **`Backend` sedang berjalan:** Pastikan `backend` FastAPI Anda (`drone-vision-be`) sudah berjalan dan dapat diakses (biasanya di `http://localhost:8000`).

### 2. Penyiapan `Frontend`

1.  **Navigasi ke Direktori `Frontend`:**
    ```bash
    cd your_repo_name/drone-vision-fe # Ganti dengan path ke direktori frontend
    ```

2.  **Instal `Dependency` JavaScript:**
    ```bash
    npm install
    ```
    *   Ini akan menginstal semua `library` yang diperlukan untuk `frontend`, termasuk `Next.js`, `React`, dan `socket.io-client` (meskipun kita menggunakan `Native WebSocket` secara `internal`).

### 3. Menjalankan `Frontend Development Server`

Setelah `dependency` terinstal, Anda dapat menjalankan `development server` Next.js:

```bash
npm run dev
```
*   Ini akan menjalankan `server` `development` Next.js (biasanya di `port` 3000) dan mengaktifkan fitur `Hot Module Reloading` untuk pengalaman pengembangan yang lancar.

## 🧭 Cara Menggunakan `Dashboard Web`

Setelah `frontend development server` berjalan (`npm run dev`), buka `browser` Anda dan ikuti langkah-langkah ini:

1.  **Akses Halaman Beranda (`Input URL`):**
    *   Buka `URL`: `http://localhost:3000`
    *   Anda akan disambut dengan halaman utama (`homepage`) yang berfungsi sebagai **`input page`**.
    *   Di sini, Anda akan diminta untuk memasukkan **`URL stream RTMP`** dari drone Anda (atau `RTMP server` seperti Nginx-RTMP yang disalurkan oleh OBS).
    *   **Contoh URL:** `rtmp://localhost:1935/live/drone` (Gunakan ini jika Anda menjalankan `Nginx-RTMP server` secara lokal dengan `stream key` "drone").
    *   Setelah memasukkan `URL`, klik tombol **"Go to Dashboard"**.

2.  **Masuk ke Halaman `Dashboard`:**
    *   Setelah mengklik tombol, Anda akan dinavigasi ke halaman `dashboard` (`/dashboard`). `URL stream` yang Anda masukkan akan diteruskan sebagai `parameter query` di `URL`.
    *   Segera setelah `dashboard` dimuat, `frontend` akan mencoba membuat koneksi `WebSocket` ke `backend` (`FastAPI`).
    *   Jika koneksi berhasil, `dashboard` akan mengirimkan perintah `start_stream` ke `backend` dengan `URL stream` yang Anda berikan, beserta `parameter` kualitas `stream` (FPS, Kualitas JPEG, Resolusi Tampilan, Resolusi Pemrosesan `CV`).

3.  **Interaksi di `Dashboard`:**
    `Dashboard` dirancang dengan `layout` dua kolom utama, memungkinkan Anda memantau `stream` video sambil berinteraksi dengan `kontrol` dan melihat `analitik` secara bersamaan.

    *   **Bagian Atas (`Header`):**
        *   Menampilkan judul `dashboard` (`"Drone Control Center"`).
        *   Tombol **"Stop Stream"**: Untuk menghentikan `stream` video yang sedang berjalan (mengirimkan sinyal `stop` ke `backend`).
        *   Tombol **"← Back"**: Untuk kembali ke halaman `input URL` jika Anda ingin mengganti `stream` atau `setting`nya.

    *   **Kartu Statistik (`Stats Cards` - Tiga Kartu di Atas):**
        *   **Connection Status:** Menunjukkan status koneksi `WebSocket` (`LIVE`, `CONNECTED`, atau `OFFLINE`).
        *   **Stream Quality:** Menampilkan kualitas `JPEG` yang saat ini Anda pilih untuk `stream` output (misalnya, `50% (Set)`).
        *   **Target FPS:** Menampilkan `target frame rate` yang Anda pilih, dan jika diterima dari `backend`, `target FPS` yang sedang coba dicapai oleh `backend`.

    *   **Area Konten Utama (`Main Content` - Tata Letak Dua Kolom):**
        *   **Kolom Kiri: `Camera Feed`**
            *   **Tampilan Video:** Ini adalah area utama di mana `live stream` video yang sudah diproses dari `backend` akan ditampilkan. `Frame` akan diperbarui secara `real-time` dengan `overlay` hasil `CV`.
            *   **Indikator `LIVE`:** Akan muncul saat `stream` aktif.
            *   **`Loading State`:** Menampilkan animasi `flying drone loader` saat koneksi sedang dibangun atau menunggu `frame` pertama.
            *   **Informasi `Stream Footer`:** Di bagian bawah area video, akan ada tampilan resolusi (`actualFrameWidth x actualFrameHeight`), `FPS`, dan kualitas `JPEG` yang sedang diterima.
        *   **Kolom Kanan: `Side Panel` (Kartu-kartu bertumpuk)**
            *   **`👁️‍🗨️ CV Analytics` Card:**
                *   **Total Persons:** Menampilkan jumlah total orang yang terdeteksi di `frame` saat ini.
                *   **Crowd Status:** Memberikan `status` kepadatan kerumunan (`NORMAL`, `CROWDED`, `HIGH DENSITY`).
                *   **Recognized:** `List` orang yang dikenali wajahnya beserta `confidence` persentasenya.
                *   **Zone Density (Grid):** Visualisasi kepadatan per zona `grid` (menunjukkan jumlah orang di setiap `grid` dan bisa berubah warna sesuai kepadatan).
            *   **`⚙️ Stream Configuration` Card:**
                *   **JPEG Quality (Output):** `Dropdown` untuk memilih kualitas `JPEG` (30%, 50%, 70%, 90%). Mengubah ini akan mengirim `request` ke `backend` untuk menyesuaikan kualitas gambar yang dikirim ke `frontend`.
                *   **Target FPS:** `Dropdown` untuk memilih `frame rate` target (10-30 FPS). Mengubah ini akan memberi tahu `backend` berapa `frame` per detik yang harus diupayakan.
                *   **Display Resolution (Output):** `Dropdown` untuk memilih `faktor resize` `frame` yang dikirim dari `backend` ke `frontend` (100%, 75%, 50%, 25%). Ini memengaruhi ukuran gambar yang Anda lihat di `dashboard`.
                *   **CV Processing Resolution:** `Dropdown` yang sangat penting. Ini mengontrol `faktor resize` `frame` yang digunakan secara *internal* oleh `backend` untuk menjalankan `model YOLO` dan `face_recognition`. Menurunkan nilai ini (misalnya ke `25%` atau `50%`) dapat secara drastis meningkatkan performa `CV` pada `CPU` atau `GPU` yang lebih lemah, dengan mengorbankan akurasi deteksi pada objek kecil.
                *   **Stream URL Display:** Menampilkan `URL stream` yang sedang aktif.
                *   **Status:** `Status` koneksi `WebSocket` yang lebih detail.
            *   **`🕒 Session Info` Card:**
                *   Menampilkan `Current Time`, `Session Started` (waktu Anda membuka `dashboard`), `Stream Source`, dan `Connection` status.
            *   **`🎮 Controls` Card:**
                *   Mengulang tombol `Stop Stream` dan `Change Stream URL` untuk akses cepat.

    *   **Bagian Bawah (`Footer`):**
        *   Menampilkan informasi `credit` (`"Processing by FastAPI"`, `"Display by Next.js"`).
---