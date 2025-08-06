# View Toggle Feature

Fitur ini menambahkan kemampuan untuk beralih antara tampilan list dan grid untuk news items.

## Fitur

### List View (Default)
- **Layout**: Horizontal layout dengan gambar di samping
- **Content**: Judul, score, author, dan summary dalam satu baris
- **Image**: 24x24 thumbnail di sebelah kiri
- **Summary**: Ditampilkan di bawah metadata dalam box terpisah
- **Best for**: Membaca detail lengkap dan scanning cepat

### Grid View
- **Layout**: Card-based layout dalam grid responsif
- **Content**: Vertikal layout dengan gambar di atas
- **Image**: Full-width header image (h-48)
- **Summary**: Di bagian bawah card dengan line-clamp
- **Best for**: Visual browsing dan overview

## Grid Responsiveness

```css
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

- **Mobile**: 1 kolom
- **Tablet**: 2 kolom
- **Desktop**: 3 kolom

## View Toggle Controls

### Toggle Buttons
- **List Button**: Icon list dengan garis horizontal
- **Grid Button**: Icon grid dengan kotak-kotak
- **Active State**: Background biru dengan teks putih
- **Inactive State**: Background card dengan border

### Persistence
- **LocalStorage**: Menyimpan preferensi user
- **Auto-restore**: Load preferensi saat page refresh
- **Default**: List view untuk user baru

## Component Structure

### StoryItem (List View)
```tsx
<li className="flex items-start space-x-4">
  <img className="w-24 h-24" />
  <div className="flex-1">
    <title />
    <metadata />
    <summary />
  </div>
</li>
```

### StoryItemGrid (Grid View)
```tsx
<div className="flex flex-col h-full">
  <img className="w-full h-48" />
  <div className="flex-1 flex flex-col">
    <title className="line-clamp-2" />
    <metadata />
    <summary className="line-clamp-3 mt-auto" />
  </div>
</div>
```

## Text Truncation

### Line Clamp CSS
```css
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

- **Title**: 2 lines max dalam grid view
- **Summary**: 3 lines max dalam grid view
- **List view**: No truncation (full content)

## Loading States

### List Skeleton
- Horizontal layout skeleton
- Image placeholder + text lines

### Grid Skeleton
- Card-based skeleton
- Full-width image placeholder
- Title dan metadata placeholders

## Usage

### Toggle Views
```typescript
const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

// Change view
const handleViewModeChange = (mode: 'list' | 'grid') => {
  setViewMode(mode);
  localStorage.setItem('viewMode', mode);
};
```

### Conditional Rendering
```typescript
{viewMode === 'list' ? (
  <ul>{stories.map(story => <StoryItem />)}</ul>
) : (
  <div className="grid">{stories.map(story => <StoryItemGrid />)}</div>
)}
```

## Benefits

✅ **Flexible Viewing**: User bisa pilih sesuai preferensi  
✅ **Responsive Design**: Optimal di semua device sizes  
✅ **Persistent Preference**: Setting tersimpan antar session  
✅ **Visual Appeal**: Grid view lebih menarik secara visual  
✅ **Better UX**: List view untuk detail, grid untuk overview  

## Future Enhancements

- [ ] Compact list view option
- [ ] Custom grid column count
- [ ] Keyboard shortcuts (L for list, G for grid)
- [ ] Animation transitions between views
- [ ] View-specific sorting options
