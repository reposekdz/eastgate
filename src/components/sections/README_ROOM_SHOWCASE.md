# Room Showcase Component

A modern, advanced room display component that fetches real data from the database API and displays 6 rooms with a "Load More" button that redirects to the booking page.

## Features

✅ **Database Integration**: Fetches real room data from `/api/rooms` endpoint
✅ **Multi-Branch Support**: Shows rooms from different branches with branch badges
✅ **10 Language Support**: Fully translatable in English, Kinyarwanda, French, Swahili, Spanish, German, Chinese, Arabic, Portuguese, and Japanese
✅ **Modern UI**: Smooth animations with Framer Motion
✅ **Responsive Design**: Works perfectly on all screen sizes
✅ **Loading States**: Beautiful loading skeleton while fetching data
✅ **Error Handling**: Graceful fallback when no rooms are available
✅ **SEO Optimized**: Proper semantic HTML structure

## Usage

### 1. Import the Component

```tsx
import RoomShowcase from "@/components/sections/RoomShowcase";
```

### 2. Add to Your Page

```tsx
export default function HomePage() {
  return (
    <>
      {/* Other sections */}
      
      <RoomShowcase />
      
      {/* Other sections */}
    </>
  );
}
```

### 3. That's It!

The component will automatically:
- Fetch 6 available rooms from the database
- Display them with branch information
- Show amenities and room details
- Provide a "View All Rooms" button that redirects to `/book`

## API Endpoint

The component fetches data from:
```
GET /api/rooms?status=available
```

Expected response format:
```json
{
  "success": true,
  "rooms": [
    {
      "id": "room-id",
      "number": "101",
      "type": "deluxe",
      "price": 129,
      "description": "Spacious room with balcony",
      "imageUrl": "https://...",
      "maxOccupancy": 2,
      "size": 35,
      "status": "available",
      "branch": {
        "id": "branch-id",
        "name": "Kigali Main",
        "location": "KG 7 Ave, Kigali"
      }
    }
  ]
}
```

## Translations

All text is automatically translated based on the user's selected language. The component uses the following translation keys:

- `rooms.sectionLabel` - Section label
- `rooms.title` - Main heading
- `rooms.description` - Description text
- `rooms.bookNow` - Book button text
- `common.available` - Available badge
- `common.room` - Room label
- `common.perNight` - Per night text
- `common.guests` - Guests label
- `homepage.viewAllRooms` - Load more button text

## Customization

### Change Number of Rooms Displayed

Edit line 52 in `RoomShowcase.tsx`:
```tsx
setRooms(availableRooms.slice(0, 6)); // Change 6 to your desired number
```

### Change Redirect URL

Edit line 234 in `RoomShowcase.tsx`:
```tsx
<Link href="/book"> {/* Change to your desired URL */}
```

### Modify Room Card Design

The room card structure starts at line 145. You can customize:
- Image height (line 148)
- Badge styles (lines 158-172)
- Content padding (line 177)
- Button styles (line 223)

## Styling

The component uses Tailwind CSS with custom colors from your theme:
- `emerald` - Primary action color
- `charcoal` - Text color
- `gold` - Accent color
- `text-muted-custom` - Secondary text

## Dependencies

- `framer-motion` - Animations
- `lucide-react` - Icons
- `@/components/ui/button` - Button component
- `@/components/ui/badge` - Badge component
- `@/lib/i18n/context` - Internationalization

## Example Integration

```tsx
// app/(public)/page.tsx
import RoomShowcase from "@/components/sections/RoomShowcase";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section>...</section>
      
      {/* Room Showcase - Shows 6 rooms from database */}
      <RoomShowcase />
      
      {/* Other sections */}
    </>
  );
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Performance

- Lazy loading images
- Optimized animations
- Minimal re-renders
- Efficient API calls

## Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader friendly

## License

© 2026 EastGate Hotel Rwanda. All rights reserved.
