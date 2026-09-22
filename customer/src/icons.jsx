const paths = {
  home: <><path d="m3 10 5-7 5 7" /><path d="M4 9v6h8V9" /></>,
  grid: <><rect x="3" y="3" width="4" height="4" rx=".6" /><rect x="9" y="3" width="4" height="4" rx=".6" /><rect x="3" y="9" width="4" height="4" rx=".6" /><rect x="9" y="9" width="4" height="4" rx=".6" /></>,
  bag: <><path d="M3 5h10l-1 9H4L3 5Z" /><path d="M5.5 5a2.5 2.5 0 0 1 5 0" /></>,
  user: <><circle cx="8" cy="5" r="2.5" /><path d="M3.5 14a4.5 4.5 0 0 1 9 0" /></>,
  search: <><circle cx="7" cy="7" r="4" /><path d="m10 10 3 3" /></>,
  pin: <><path d="M8 14s4-3.6 4-7a4 4 0 1 0-8 0c0 3.4 4 7 4 7Z" /><circle cx="8" cy="7" r="1.3" /></>,
  heart: <path d="M8 13.5S2.5 10.2 2.5 6.4A2.7 2.7 0 0 1 8 5.2a2.7 2.7 0 0 1 5.5 1.2c0 3.8-5.5 7.1-5.5 7.1Z" />,
  back: <path d="m10 3-5 5 5 5M5 8h8" />,
  close: <><path d="m4 4 8 8M12 4l-8 8" /></>,
  eye: <><path d="M2.5 8s2-3 5.5-3 5.5 3 5.5 3-2 3-5.5 3-5.5-3-5.5-3Z" /><circle cx="8" cy="8" r="1.3" /></>,
  location: <><path d="M8 14s4-3.6 4-7a4 4 0 1 0-8 0c0 3.4 4 7 4 7Z" /><circle cx="8" cy="7" r="1.3" /></>,
  chevron: <path d="m6 4 4 4-4 4" />,
  trash: <><path d="M3 4h10M6 4V2h4v2M4 4l.7 10h6.6L12 4M6.5 7v4M9.5 7v4" /></>,
  edit: <path d="m3 11-.5 3 3-.5L13 6l-2.5-2.5L3 11Z" />,
  phone: <path d="M4 3.5 6 3l1.2 3-1.5 1a8 8 0 0 0 3.3 3.3l1-1.5 3 1.2-.5 2c-.2.8-1 1.3-1.8 1.1A10.5 10.5 0 0 1 2.9 5.3C2.7 4.5 3.2 3.7 4 3.5Z" />,
}

export function Icon({ name, size = 17, className = '' }) {
  return <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.grid}</svg>
}
