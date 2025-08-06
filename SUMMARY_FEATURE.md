# News Summary Feature

Fitur ini menambahkan kemampuan untuk menampilkan ringkasan singkat dari artikel berita Hacker News.

## Cara Kerja

1. **Content Extraction**: Sistem akan mencoba mengekstrak konten dari URL artikel
2. **Text Processing**: Membersihkan HTML dan memproses teks
3. **Smart Summarization**: Menggunakan algoritma extractive untuk membuat ringkasan
4. **Fallback**: Jika gagal mengekstrak konten, akan menggunakan judul sebagai fallback

## Fitur

### Content Extraction
- Mengunduh konten dari URL artikel
- Membersihkan HTML tags, scripts, styles
- Menghapus navigasi, header, footer untuk fokus pada konten utama
- Filter meaningful words untuk kualitas summary yang lebih baik

### Smart Summarization
- Scoring sentences berdasarkan relevansi
- Bonus score untuk kata kunci teknologi: AI, research, company, etc.
- Penalty untuk navigational text: click, menu, login, etc.
- Maksimal 150 karakter untuk summary

### UI Integration
- Toggle button "Show Summary" / "Hide Summary"
- Loading indicator saat mengambil summary
- Fallback message jika summary tidak tersedia
- Styled dengan background yang berbeda untuk membedakan dari konten utama

## API Endpoint

### `/api/summarize`
- **Method**: GET
- **Parameters**: 
  - `url` (required): URL artikel untuk diringkas
  - `title` (optional): Judul artikel sebagai fallback
- **Response**:
  ```json
  {
    "summary": "Ringkasan artikel dalam 150 karakter",
    "source": "content" // atau "title" jika fallback
  }
  ```

## Usage Example

```javascript
// Fetch summary
const response = await fetch(`/api/summarize?url=${encodeURIComponent(articleUrl)}&title=${encodeURIComponent(title)}`);
const data = await response.json();

// Display summary
if (data.summary) {
  console.log(data.summary);
}
```

## Error Handling

1. **URL tidak dapat diakses**: Fallback ke title
2. **Konten terlalu pendek**: Fallback ke title  
3. **Network timeout (10s)**: Fallback ke title
4. **Parsing error**: Return error message

## Keuntungan

✅ **Quick Overview**: User bisa lihat ringkasan tanpa buka artikel  
✅ **Smart Content Detection**: Fokus pada konten utama, bukan navigasi  
✅ **Fallback System**: Selalu ada output meski extraction gagal  
✅ **Performance**: Cache bisa ditambahkan di masa depan  
✅ **User Control**: User bisa pilih kapan mau lihat summary  

## Future Improvements

- [ ] Cache summary results
- [ ] Better content extraction untuk situs tertentu
- [ ] Integration dengan AI summarization API
- [ ] Sentiment analysis
- [ ] Summary quality scoring
