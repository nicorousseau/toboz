# TOBOZ Songs Library

This file helps you manage and export/import songs in the TOBOZ app.

## How to Use

### Adding Songs via JSON
You can add songs directly by editing the JSON below and importing it into the app:

1. Copy the song JSON
2. In the TOBOZ app, go to "Ajouter" (Add Song)
3. Paste and configure the song details

### Song Format

Each song object should have:
- `id`: Unique identifier (auto-generated, format: `song_<timestamp>_<random>`)
- `title`: Song title
- `artist`: Artist name
- `content`: ChordPro format with chords in brackets, e.g., `[Am]Hello [G]world`
- `duration`: Song duration in seconds
- `offset`: Intro offset in seconds (delay before scrolling starts)
- `fontSize`: Font size for display (default: 22)

### Newline Handling

When entering song content, use `/n` for line breaks:
- Example: `Verse 1/nLine 2` becomes two lines
- Or use `\n` as an alternative

### Example Songs

```json
{
  "id": "song_example_1",
  "title": "Amazing Grace",
  "artist": "Traditional",
  "content": "[G]Amazing [D]grace, how [G]sweet the sound\n[G]That saved a [D]wretch like [G]me",
  "duration": 120,
  "offset": 0,
  "fontSize": 22
}
```

```json
{
  "id": "song_example_2",
  "title": "Wonderwall",
  "artist": "Oasis",
  "content": "[Cadd9]Today is gonna be the day/nThat they're gonna throw it back to you/n[Cadd9]By now you should've somehow",
  "duration": 258,
  "offset": 3,
  "fontSize": 20
}
```

## Exporting Songs

To backup your songs:
1. Use browser DevTools (if on web)
2. Open localStorage and find `toboz:songs:v1`
3. Copy the entire JSON array
4. Paste it here for safekeeping

## Importing Songs

To restore or add saved songs:
1. Create song objects using the format above
2. Import them individually via the app or via localStorage (advanced)

---

**Tip**: Keep this file updated as you add new songs for easy backup and sharing!
