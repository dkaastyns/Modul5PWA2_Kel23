# Panduan Penjelasan Kode untuk Video YouTube
### Tugas Praktikum Pemrograman Perangkat Bergerak (PWA Modul 5)

Dokumen ini disusun sebagai panduan dan naskah penjelasan saat merekam video demonstrasi aplikasi untuk diunggah ke YouTube. Pembahasan dibagi per poin sesuai instruksi tugas praktikum.

---

## 1. Poin 2: Lazy Loading & Query Caching

### A. Lazy Loading Komponen (Code-Splitting)
- **File Terkait**: `src/App.jsx`
- **Tujuan**: Memisahkan kode JavaScript ke dalam chunk-chunk terpisah (*code-splitting*) sehingga browser tidak perlu mengunduh seluruh file JavaScript aplikasi di awal. Halaman hanya diunduh ketika pengguna benar-benar membukanya.
- **Potongan Kode Penting**:
  ```javascript
  import { lazy, Suspense } from 'react'

  // Komponen halaman di-import secara dinamis
  const Catalog = lazy(() => import('./pages/Catalog.jsx'))
  const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
  const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
  const CreateGunPage = lazy(() => import('./pages/CreateGunPage.jsx'))
  const EditGunPage = lazy(() => import('./pages/EditGunPage.jsx'))
  const GunDetail = lazy(() => import('./components/gun/GunDetail.jsx'))
  const About = lazy(() => import('./pages/About.jsx'))
  const Contact = lazy(() => import('./pages/Contact.jsx'))
  ```
- **Pembungkus Suspense**:
  ```jsx
  <main className="main">
    <Suspense fallback={<ModuleFallback />}>
      {/* Render halaman aktif */}
    </Suspense>
  </main>
  ```
- **Penjelasan Saat Video**:
  > *"Pada file `App.jsx`, kami menerapkan React lazy loading dan Suspense. Dengan `React.lazy()`, setiap halaman seperti Catalog, CreateGunPage, dan GunDetail di-bundle ke dalam file chunk terpisah. Saat pengguna pertama kali membuka web, bundle awal menjadi jauh lebih ringan (turun dari ~350 kB menjadi ~300 kB), dan modul halaman hanya dimuat saat diakses dengan animasi loading fallback yang rapi."*

### B. Lazy Loading Gambar
- **File Terkait**: `src/components/gun/GunCard.jsx` & `src/components/gun/GunDetail.jsx`
- **Kode**:
  ```jsx
  <img
    className="card-img"
    src={imgSrc}
    alt={gun.name}
    loading="lazy"
    decoding="async"
  />
  ```
- **Penjelasan Saat Video**:
  > *"Pada setiap kartu produk dan detail produk, elemen `<img>` dilengkapi atribut `loading="lazy"` dan `decoding="async"`. Browser native akan menunda pemuatan gambar yang berada di luar viewport (layar) sampai pengguna melakukan scroll mendekati gambar tersebut, menghemat kuota data dan mempercepat rendering awal."*

### C. Query Caching (In-Memory SWR & Workbox)
- **File Terkait**: `src/utils/queryCache.js`, `src/hooks/useGuns.js`, `vite.config.js`
- **Cara Kerja**:
  1. **In-Memory Cache dengan TTL**: Data hasil query disimpan di memori selama 5 menit (*TTL*). Jika user berpindah tab lalu kembali ke Catalog, data langsung muncul secara instan tanpa loading ulang.
  2. **Cache Invalidation**: Saat user menambah (*Create*), mengubah (*Update*), atau menghapus (*Delete*) data produk, cache dengan prefix `guns` otomatis dibersihkan agar data terbaru langsung terambil.
  3. **Workbox Runtime Caching**: Pada `vite.config.js`, request ke endpoint Supabase di-cache menggunakan strategi `NetworkFirst`, sehingga jika internet terputus, data katalog dari cache Service Worker tetap dapat dibuka (*offline capability*).
- **Potongan Kode `src/hooks/useGuns.js`**:
  ```javascript
  const fetchGuns = useCallback(async (bypassCache = false) => {
    const currentKey = queryCache.generateKey('guns', params)

    if (!bypassCache) {
      const cached = queryCache.get(currentKey)
      if (cached) {
        setGuns(cached.data || [])
        setPagination(cached.pagination || null)
        setLoading(false)
        return // Menggunakan data cache
      }
    }
    // Jika tidak ada di cache, lakukan fetch ke API Supabase...
  }, [paramKey, ttl])
  ```
- **Penjelasan Saat Video**:
  > *"Untuk optimasi query caching, kami membuat cache manager mandiri di `queryCache.js` yang dihubungkan ke custom hook `useGuns.js`. Saat pertama kali memuat, data disimpan dengan kunci pencarian dan filter. Jika user berpindah ke tab Favorites lalu kembali lagi ke Catalog, data diambil dari in-memory cache secara instan. Selain itu, pada `vite.config.js`, Workbox dikonfigurasi dengan strategi `NetworkFirst` untuk rute Supabase sehingga aplikasi tetap menampilkan data saat offline."*

---

## 2. Poin 3: Fitur Sharelink untuk Setiap Katalog

- **File Terkait**: `src/utils/share.js`, `src/components/gun/GunCard.jsx`, `src/components/gun/GunDetail.jsx`, `src/App.jsx`
- **Fitur Utama**:
  1. **Tombol Share**: Terdapat di setiap kartu produk (`GunCard`) dan di halaman detail (`GunDetail`).
  2. **Web Share API + Fallback Clipboard**: Menggunakan `navigator.share()` untuk membuka native share sheet di perangkat mobile (WhatsApp, Telegram, dll.). Jika dijalankan di browser desktop yang tidak mendukung Web Share, otomatis menyalin tautan ke clipboard (`navigator.clipboard.writeText`) dan menampilkan toast feedback.
  3. **Deep Linking (URL Parameter `?id=...`)**: Tautan yang dibagikan memiliki format `${origin}/?id=${gun.id}`. Saat tautan dibuka oleh siapa pun, `App.jsx` membaca parameter URL tersebut dan langsung membuka halaman detail produk terkait secara otomatis.
- **Potongan Kode `src/utils/share.js`**:
  ```javascript
  export const shareGun = async (gun) => {
    const url = `${window.location.origin}${window.location.pathname}?id=${gun.id}`
    
    // 1. Coba Web Share API (Mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: gun.name,
          text: `Check out ${gun.name} for $${gun.price}`,
          url,
        })
        return { method: 'native', success: true }
      } catch (err) {
        if (err.name === 'AbortError') return { method: 'native', success: false }
      }
    }

    // 2. Fallback Clipboard API (Desktop)
    await navigator.clipboard.writeText(url)
    return {
      method: 'clipboard',
      success: true,
      message: 'Tautan produk berhasil disalin ke clipboard!',
    }
  }
  ```
- **Potongan Kode Deep Linking di `src/App.jsx`**:
  ```javascript
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const linkedId = params.get('id')
    if (linkedId) {
      gunService.getGunById(linkedId).then((res) => {
        if (res?.data) {
          setSelectedGun(res.data)
          setMode('detail')
        }
      })
    }
  }, [])
  ```
- **Penjelasan Saat Video**:
  > *"Fitur Sharelink diimplementasikan pada file `share.js`. Setiap katalog memiliki tombol share dengan icon Share2. Ketika diklik di smartphone, aplikasi akan membuka menu native share bawaan Android/iOS. Jika dibuka di laptop/desktop, link langsung disalin ke clipboard disertai notifikasi toast melayang. Ketika link yang disalin dibuka pada tab baru, `App.jsx` akan membaca parameter query `?id=...` melalui `URLSearchParams` dan langsung membuka halaman detail produk yang dimaksud secara otomatis."*

---

## 3. Poin 4: Paginasi (Pagination) pada Percobaan

- **File Terkait**: `src/components/common/Pagination.jsx` & `src/pages/Catalog.jsx`
- **Cara Kerja**:
  1. Data produk yang telah difilter (berdasarkan pencarian nama dan kategori) dihitung total halamannya:
     $$\text{totalPages} = \lceil \frac{\text{totalItems}}{\text{ITEMS\_PER\_PAGE}} \rceil$$
  2. Data dipotong (*slice*) hanya untuk halaman aktif:
     $$\text{startIndex} = (\text{currentPage} - 1) \times \text{ITEMS\_PER\_PAGE}$$
     $$\text{paginatedGuns} = \text{filteredGuns.slice}(\text{startIndex}, \text{startIndex} + \text{ITEMS\_PER\_PAGE})$$
  3. Terdapat tombol navigasi `Prev`, nomor-nomor halaman dengan status aktif, dan tombol `Next`.
  4. Ketika pengguna mengetik di kolom pencarian atau mengganti filter kategori, state halaman otomatis di-reset kembali ke halaman `1`.
- **Potongan Kode `src/pages/Catalog.jsx`**:
  ```javascript
  const ITEMS_PER_PAGE = 6
  const [currentPage, setCurrentPage] = useState(1)

  // Reset ke halaman 1 jika filter berubah
  const filterKey = `${search}-${activeCategory}-${sortKey}-${sortOrder}`
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(filteredGuns.length / ITEMS_PER_PAGE) || 1
  const paginatedGuns = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredGuns.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredGuns, currentPage])
  ```
- **Penjelasan Saat Video**:
  > *"Pada halaman Catalog, kami menambahkan komponen `Pagination.jsx`. Daftar produk dibagi per 6 item per halaman. Terdapat tombol Prev, Next, dan indikator 'Showing 1–6 of X'. Jika user berpindah halaman, halaman akan auto-scroll ke bagian atas daftar produk. Kami juga menambahkan logika reset otomatis ke halaman 1 setiap kali filter pencarian atau kategori berubah sehingga user tidak akan tersangkut di halaman kosong."*

---

## 4. Poin 5: Integrasi Database Supabase Pribadi

- **File Terkait**: `.env`, `src/config/api.js`, `src/services/gunService.js`, `supabase_schema.sql`
- **Kredensial Individu**:
  - `VITE_API_BASE_URL`: URL project Supabase pribadi mahasiswa (misal: `https://gqbddxfrkojkcicovxtr.supabase.co`).
  - `VITE_SUPABASE_PUBLISHABLE_KEY`: Anon / Publishable key project Supabase pribadi.
- **Skema Database**:
  - Disediakan file `supabase_schema.sql` yang berisi pembuatan tabel `products`, `favorites`, dan `reviews`, lengkap dengan konfigurasi *Row Level Security (RLS)* dan data awal (*seed data*).
- **Penjelasan Saat Video**:
  > *"Sesuai ketentuan poin 5, aplikasi tidak menggunakan shared API kampus modul melainkan terhubung langsung ke project database Supabase pribadi masing-masing. Konfigurasi disimpan di file `.env` dan diakses melalui `api.js` serta `gunService.js`. Seluruh operasi CRUD (Create, Read, Update, Delete) langsung berinteraksi dengan tabel `products` di database Supabase pribadi kami."*

---

## 5. Rekomendasi Urutan Demonstrasi Video YouTube (Durasi 5–8 Menit)

1. **Pembukaan (30 detik)**:
   - Perkenalan diri (Nama, NIM, Kelas Praktikum PPB).
   - Menyebutkan topik tugas: PWA Modul 5 lanjutan (Lazy Loading, Query Caching, Sharelink, Paginasi, dan Database Supabase Pribadi).
2. **Demo Poin 5 (Database Pribadi) (1 menit)**:
   - Tunjukkan file `.env` dan dashboard Supabase milik pribadi beserta data di tabel `products`.
3. **Demo Poin 4 (Paginasi) (1.5 menit)**:
   - Tunjukkan halaman Catalog.
   - Klik tombol Next/Prev dan nomor halaman.
   - Coba ketik di pencarian atau ganti kategori, tunjukkan bahwa pagination otomatis kembali ke halaman 1.
   - Buka sekilas kode `Pagination.jsx` dan slicing di `Catalog.jsx`.
4. **Demo Poin 3 (Sharelink & Deep Linking) (1.5 menit)**:
   - Klik tombol Share pada salah satu card produk.
   - Tunjukkan notifikasi Toast *"Tautan produk berhasil disalin ke clipboard!"*.
   - Buka tab baru di browser, paste tautan tersebut (`http://localhost:5173/?id=...`).
   - Tunjukkan bahwa aplikasi langsung membuka halaman detail dari produk tersebut secara otomatis.
   - Tunjukkan kode di `share.js` dan `App.jsx`.
5. **Demo Poin 2 (Lazy Load & Query Caching) (1.5 menit)**:
   - Buka Chrome DevTools > tab **Network**.
   - Refresh halaman, tunjukkan file chunk dinamis yang terpisah (`Catalog-xxx.js`, `GunDetail-xxx.js`) hasil dari `React.lazy()`.
   - Berpindah tab ke Favorites lalu balik ke Catalog, tunjukkan di DevTools bahwa tidak ada fetch berulang karena ditangani oleh Query Cache (`queryCache.js`).
   - Nyalakan mode **Offline** di DevTools Network, refresh halaman, tunjukkan data tetap tampil berkat caching Service Worker PWA.
6. **Penutup (30 detik)**:
   - Kesimpulan dan salam penutup.
