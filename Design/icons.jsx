/* global React */
const { useState, useEffect, useRef, useMemo } = React;

// ============================================================
// ICONS — minimal stroke set
// ============================================================
const Ico = {
  dashboard: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <rect x="2" y="2" width="5" height="5" /><rect x="9" y="2" width="5" height="5" />
      <rect x="2" y="9" width="5" height="5" /><rect x="9" y="9" width="5" height="5" />
    </svg>
  ),
  list: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M2 4h12M2 8h12M2 12h12" />
    </svg>
  ),
  box: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M2 5l6-3 6 3v6l-6 3-6-3V5z" /><path d="M2 5l6 3 6-3M8 8v6" />
    </svg>
  ),
  chat: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M3 3h10v8H7l-3 3v-3H3V3z" />
    </svg>
  ),
  cart: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M2 3h2l1.5 8h7L14 5H5" /><circle cx="6" cy="13.5" r="1" /><circle cx="12" cy="13.5" r="1" />
    </svg>
  ),
  megaphone: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M3 6v4l8 3V3L3 6zM11 5v6M3 10v2h2v-2" />
    </svg>
  ),
  bell: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M4 11V7a4 4 0 018 0v4l1 1H3l1-1zM7 13.5a1.5 1.5 0 002 0" />
    </svg>
  ),
  download: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M8 2v8m-3-3l3 3 3-3M3 13h10" />
    </svg>
  ),
  copy: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <rect x="5" y="5" width="9" height="9" /><path d="M11 5V2H2v9h3" />
    </svg>
  ),
  close: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  ),
  chevron: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M5 6l3 3 3-3" />
    </svg>
  ),
  arrow: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M3 8h10m-3-3l3 3-3 3" />
    </svg>
  ),
  send: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M2 8L14 2L9 14L7.5 9L2 8z" />
    </svg>
  ),
  shield: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M8 2l5 2v5c0 3-3 5-5 5s-5-2-5-5V4l5-2z" />
    </svg>
  ),
  zap: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M9 2L3 9h4l-1 5 6-7H8l1-5z" />
    </svg>
  ),
  check: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M3 8l3 3 7-7" />
    </svg>
  ),
  filter: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M2 3h12l-4.5 6v4l-3 1V9L2 3z" />
    </svg>
  ),
  search: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <circle cx="7" cy="7" r="4" /><path d="M10 10l3 3" />
    </svg>
  ),
  external: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M9 3h4v4M13 3l-7 7M3 6v7h7" />
    </svg>
  ),
  refresh: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M13 3v4h-4M3 13v-4h4" /><path d="M13 7a5 5 0 00-9-2M3 9a5 5 0 009 2" />
    </svg>
  ),
};

window.Ico = Ico;
