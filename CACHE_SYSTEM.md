# Image Caching System

Sistem ini mengimplementasikan caching lokal untuk gambar dari Unsplash API untuk mengurangi hit API dan meningkatkan performa.

## Cara Kerja

1. **First Request**: Ketika pertama kali mencari gambar dengan query tertentu, sistem akan:
   - Mengecek cache lokal di folder `public/cache/`
   - Jika tidak ada, akan fetch dari Unsplash API
   - Download gambar dan simpan lokal
   - Update index cache

2. **Subsequent Requests**: Untuk request berikutnya dengan query yang sama:
   - Langsung serve gambar dari cache lokal
   - Tidak hit Unsplash API

## Struktur Cache

```
public/
  cache/
    index.json          # Index file yang menyimpan mapping query -> filename
    <hash>.jpg          # File gambar dengan nama hash MD5 dari query
```

## API Endpoints

### `/api/search-image`
- **Method**: GET
- **Query Parameter**: `query` (required)
- **Response**: 
  ```json
  {
    "imageUrl": "/cache/abc123.jpg",
    "cached": true  // atau false jika baru di-fetch
  }
  ```

### `/api/clean-cache`
- **Method**: POST
- **Body** (optional):
  ```json
  {
    "maxAgeMs": 604800000  // 7 hari dalam milliseconds
  }
  ```
- **Description**: Membersihkan cache yang lebih lama dari `maxAgeMs`

## Keuntungan

1. **Reduced API Calls**: Gambar hanya di-fetch sekali dari Unsplash
2. **Faster Loading**: Serve gambar langsung dari server lokal
3. **Cost Effective**: Mengurangi usage Unsplash API quota
4. **Offline Support**: Gambar tetap tersedia meski API down

## Maintenance

- Cache akan otomatis disimpan di `public/cache/`
- Folder cache sudah ditambahkan ke `.gitignore`
- Gunakan endpoint `/api/clean-cache` untuk membersihkan cache lama
- Default: cache akan tetap ada sampai dibersihkan manual

## Usage Example

```javascript
// Fetch image (akan cache otomatis)
const response = await fetch('/api/search-image?query=technology');
const data = await response.json();

// Menggunakan gambar yang di-cache
<img src={data.imageUrl} alt="technology" />

// Clean cache (opsional)
await fetch('/api/clean-cache', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ maxAgeMs: 7 * 24 * 60 * 60 * 1000 }) // 7 hari
});
```
