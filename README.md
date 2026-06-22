# 🌍 Travel with Kids Hub

A beautiful, shareable website to organize and showcase family trips around the world.
Built with Hebrew (RTL) support.

## Current Trips (8)

| # | Trip | Location | Date | Source |
|---|------|----------|------|--------|
| 1 | 🇹🇭 תאילנד - קוסמוי | Koh Samui, Thailand | Apr 2025 | Notes |
| 2 | 🇭🇺 הונגריה - בלטון ובודפשט | Hungary | Aug 2025 | Google Sheets |
| 3 | 🇺🇸 פלורידה + פונטה קאנה | Florida & DR | Jan-Feb 2023 | Google Sheets |
| 4 | 🇸🇮 סלובניה וקרואטיה | Slovenia & Croatia | Sep-Oct 2023 | Google Sheets |
| 5 | 🇮🇹 איטליה - דולומיטים | Lake Garda & Dolomites | Jul 2024 | Google Sheets |
| 6 | 🇬🇷 כרתים - Euphoria Resort | Crete, Greece | Jun 2024 | Notes |
| 7 | 🇩🇪 בוואריה - אלגוי | Allgäu, Germany | Aug 2024 | Google Sheets |
| 8 | 🇦🇹 אוסטריה - זלצבורג ווינה | Austria | Aug-Sep 2021 | Google Sheets |

## Features

- **📍 Organized by location** - Filter trips by region (Europe, Asia, Americas)
- **📅 Day-by-day schedules** - Full itinerary with times and activity types
- **👶 Kids' ages** - Automatically calculated for each trip
- **🗺️ Interactive maps** - Hotels and attractions on OpenStreetMap (no API key needed!)
- **📝 Personal notes** - Your thoughts on each attraction and location
- **💡 Tips** - Practical advice for other families
- **⭐ Kid-friendly ratings** - Rate each attraction for families
- **📄 Source tracking** - Mark which trips came from PDFs or Google Sheets
- **🔤 Hebrew RTL** - Full right-to-left support

## Quick Start

1. Open `index.html` in your browser (or use a local server)
2. Edit `trips.json` to add your own trips
3. Share with friends!

### Running locally

For the best experience (to load the JSON file), use a local server:

```bash
# Python 3
cd travel-with-kids-hub
python3 -m http.server 8080

# Then open http://localhost:8080
```

Or simply open `index.html` in your browser (some browsers allow local file access).

## How to Add Your Trips

Edit `trips.json` and follow this structure:

### 1. Update your family info

```json
{
  "family": {
    "kids": [
      { "name": "Emma", "birthYear": 2018 },
      { "name": "Noah", "birthYear": 2020 }
    ]
  }
}
```

### 2. Add a new trip

Each trip needs:

| Field | Description |
|-------|-------------|
| `id` | Unique ID (e.g., "paris-2024") |
| `title` | Trip title |
| `location` | City, Country |
| `country` | Country name |
| `region` | Europe / Asia / Americas / Africa / Oceania |
| `dates.start` / `dates.end` | YYYY-MM-DD format |
| `coverImage` | URL to a cover photo (Unsplash works great) |
| `summary` | Short trip description |
| `notes` | Your personal notes about the trip |
| `source` | "pdf" or "google-sheets" (where the data came from) |

### 3. Add hotels

```json
"hotels": [
  {
    "name": "Hotel Name",
    "address": "Full address",
    "lat": 41.3818,
    "lng": 2.1685,
    "nights": 7,
    "notes": "Your review and notes"
  }
]
```

### 4. Add daily schedule

```json
"schedule": [
  {
    "day": 1,
    "date": "2024-04-10",
    "title": "Day Title",
    "activities": [
      { "time": "09:00", "activity": "Description", "type": "attraction", "lat": 41.40, "lng": 2.17 }
    ]
  }
]
```

Activity types: `hotel`, `attraction`, `food`, `kids`, `transport`

### 5. Add attractions with notes

```json
"attractions": [
  {
    "name": "Place Name",
    "lat": 41.4036,
    "lng": 2.1744,
    "type": "landmark",
    "kidFriendly": 5,
    "notes": "Your personal experience and tips"
  }
]
```

### 6. Add tips

```json
"tips": [
  "Tip 1 for other families",
  "Tip 2",
  "Tip 3"
]
```

## Importing from PDFs and Google Sheets

The `source` field in each trip tracks where the data came from. To convert your existing data:

### From Google Sheets:
1. Export as CSV or copy the data
2. Format it into the JSON structure above
3. Set `"source": "google-sheets"`

### From PDFs:
1. Copy/extract the itinerary text
2. Format it into the JSON structure above
3. Set `"source": "pdf"`

> **Tip:** You can use AI tools (ChatGPT, Copilot) to help convert your PDF/spreadsheet data into the JSON format. Just paste the content and ask it to format it as a trip entry!

## Getting Coordinates (lat/lng)

For the map to work, you need latitude and longitude for each hotel and attraction:

1. Go to [Google Maps](https://maps.google.com)
2. Right-click on the location
3. Click the coordinates that appear (they'll be copied)
4. Paste into your JSON

## Hosting & Sharing

### Free hosting options:
- **GitHub Pages** - Push to a repo, enable Pages in settings
- **Netlify** - Drag and drop the folder
- **Vercel** - Connect your repo

### Share directly:
- Zip the folder and send to friends
- They just open `index.html`

## Customization

- Edit `styles.css` to change colors, fonts, etc.
- Update the `--primary` color in `:root` for a different theme
- Add new regions in the filter bar in `index.html`

## File Structure

```
travel-with-kids-hub/
├── index.html      # Main page
├── styles.css      # All styling
├── app.js          # Application logic
├── trips.json      # YOUR TRIP DATA (edit this!)
└── README.md       # This file
```

---

Made with ❤️ for traveling families
