// Shared palette for note and group colors. Medium-soft shades that read as
// their named color yet stay usable as a background/gradient tint. null = none.
export const NOTE_COLORS: (string | null)[] = [
  null,
  '#ef9a9a', // red
  '#ffcc80', // orange
  '#fff59d', // yellow
  '#a5d6a7', // green
  '#80cbc4', // teal
  '#90caf9', // blue
  '#9fa8da', // indigo
  '#ce93d8', // purple
  '#f48fb1', // pink
  '#bcaaa4', // brown
  '#cfd8dc' // grey
]

/** A soft left-to-right gradient of a color for sidebar rows/headers. */
export function colorGradient(color: string): string {
  return `linear-gradient(90deg, ${color}55, ${color}18)`
}
