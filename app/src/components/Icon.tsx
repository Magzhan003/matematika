const paths: Record<string, string> = {
  home: 'M5 12l-2 0l9-9l9 9l-2 0 M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7 M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6',
  book: 'M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0 M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0 M3 6v13 M12 6v13 M21 6v13',
  calc: 'M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2z M8 7h8v3h-8z M8 14v.01 M12 14v.01 M16 14v.01 M8 17v.01 M12 17v.01 M16 17v.01',
  play: 'M7 4v16l13-8z',
  chart: 'M3 12h4v8h-4z M10 8h4v12h-4z M17 4h4v16h-4z',
  puzzle: 'M4 7h3a1 1 0 0 0 1-1v-1a2 2 0 0 1 4 0v1a1 1 0 0 0 1 1h3a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1h1a2 2 0 0 1 0 4h-1a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-1a2 2 0 0 0-4 0v1a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a2 2 0 0 0 0-4h-1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1',
  star: 'M12 17.75l-6.17 3.24l1.18-6.87l-5-4.86l6.9-1l3.09-6.26l3.09 6.26l6.9 1l-5 4.86l1.18 6.87z',
  flame: 'M12 12c2-2.96 0-7-1-8c0 3.04-1.77 4.74-3 6c-1.23 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.53-1.06-3.94-2-5c-1.79 3-2.8 3-4 2z',
  sun: 'M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M3 12h1 M20 12h1 M12 3v1 M12 20v1 M5.6 5.6l.7.7 M17.7 17.7l.7.7 M5.6 18.4l.7-.7 M17.7 6.3l.7-.7',
  moon: 'M12 3c.13 0 .26 0 .39 0a7.5 7.5 0 0 0 7.92 12.45a9 9 0 1 1-8.31-12.45z',
  chevron: 'M6 9l6 6l6-6',
  search: 'M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0 M21 21l-6-6',
  variable: 'M5 4c-2.5 5-2.5 10 0 16 M19 4c2.5 5 2.5 10 0 16 M9 9h1c1 0 1 1 2.016 3.527c.984 2.473.984 3.473 1.984 3.473h1 M8 16c1.5 0 3-2 4-3.5s2.5-3.5 4-3.5',
  triangle: 'M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636-2.87l-8.106-13.536a1.914 1.914 0 0 0-3.274 0z',
}

export function Icon({ name, size = 20 }: { name: keyof typeof paths | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? ''} />
    </svg>
  )
}
