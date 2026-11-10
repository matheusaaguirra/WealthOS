'use client';

import { useEffect, type RefObject } from 'react';

/** A single chart entrance; product text and controls stay readable at rest. */
export function useLandingMotion(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const page = root.current;
    if (!page) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const portfolio = page.querySelector<HTMLElement>('[data-portfolio]');
    let frame = 0;
    let chartSeen = false;
    const draw = () => {
      frame = 0;
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      page.style.setProperty('--reading', String(Math.max(0, Math.min(1, window.scrollY / Math.max(1, distance)))));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const updateMotion = () => {
      page.style.setProperty('--line-draw', reduced.matches || chartSeen ? '1' : '0');
    };
    const observer = !reduced.matches && portfolio && 'IntersectionObserver' in window
      ? new IntersectionObserver(entries => {
          if (entries.some(entry => entry.isIntersecting)) {
            chartSeen = true;
            updateMotion();
            observer?.disconnect();
          }
        }, { threshold: .25 })
      : null;
    if (observer && portfolio) observer.observe(portfolio);
    else chartSeen = true;
    updateMotion();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    reduced.addEventListener('change', updateMotion);
    draw();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      reduced.removeEventListener('change', updateMotion);
      page.style.removeProperty('--line-draw');
    };
  }, [root]);
}
