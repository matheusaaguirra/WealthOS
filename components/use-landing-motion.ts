'use client';

import { useEffect, type RefObject } from 'react';

/** Event-driven motion: no animation loop runs while the visitor is idle. */
export function useLandingMotion(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const page = root.current;
    if (!page) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const hero = page.querySelector<HTMLElement>('[data-hero]');
    const visual = page.querySelector<HTMLElement>('[data-visual]');
    const story = page.querySelector<HTMLElement>('[data-story]');
    const portfolio = page.querySelector<HTMLElement>('[data-portfolio]');
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    const draw = () => {
      frame = 0;
      const disabled = reduced.matches;
      const height = window.innerHeight;
      const heroProgress = disabled || !hero ? 0 : clamp(-hero.getBoundingClientRect().top / hero.offsetHeight);
      const storyProgress = disabled || !story ? 0 : clamp((height - story.getBoundingClientRect().top) / (height + story.offsetHeight));
      const lineProgress = disabled || !portfolio ? 1 : clamp((height * .85 - portfolio.getBoundingClientRect().top) / (height * .6));
      page.style.setProperty('--reading', String(clamp(window.scrollY / Math.max(1, document.documentElement.scrollHeight - height))));
      page.style.setProperty('--hero-shift', `${-heroProgress * 60}px`);
      page.style.setProperty('--story-shift', `${(storyProgress - .5) * 38}px`);
      page.style.setProperty('--line-draw', String(lineProgress));
      page.style.setProperty('--tilt-x', `${disabled || !finePointer.matches ? 0 : pointerY * -5}deg`);
      page.style.setProperty('--tilt-y', `${disabled || !finePointer.matches ? 0 : pointerX * 7}deg`);
      page.style.setProperty('--light-x', `${50 + pointerX * 35}%`);
      page.style.setProperty('--light-y', `${50 + pointerY * 35}%`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const move = (event: PointerEvent) => {
      if (reduced.matches || !finePointer.matches || !visual) return;
      const rect = visual.getBoundingClientRect();
      pointerX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      pointerY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      schedule();
    };
    const leave = () => { pointerX = 0; pointerY = 0; schedule(); };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.setAttribute('data-visible', 'true');
        observer?.unobserve(entry.target);
      }
    }, { threshold: .12 }) : null;
    page.querySelectorAll('[data-reveal]').forEach(target => observer?.observe(target));
    page.dataset.motion = observer ? 'ready' : 'static';
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    reduced.addEventListener('change', schedule);
    finePointer.addEventListener('change', leave);
    visual?.addEventListener('pointermove', move, { passive: true });
    visual?.addEventListener('pointerleave', leave);
    draw();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      reduced.removeEventListener('change', schedule);
      finePointer.removeEventListener('change', leave);
      visual?.removeEventListener('pointermove', move);
      visual?.removeEventListener('pointerleave', leave);
      delete page.dataset.motion;
    };
  }, [root]);
}
