"use client"

// Synchronous, no state/effect version (no flicker). Values won't auto-update on resize.
// If you need live updates, reintroduce a listener or trigger a re-render elsewhere.
export const useMediaQuery = () => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return {
      isMobile: false,
      isMobileTablet: false,
      isDesktop: false,
      isDesktopX2: false
    }
  }

  const mq = (q: string) => window.matchMedia(q).matches

  return {
    isMobile: mq('(max-width: 767px)'),
    isMobileTablet: mq('(max-width: 1023px)'),
    isDesktop: mq('(min-width: 1024px)'),
    isDesktopX2: mq('(min-width: 1280px)')
  }
}