import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Course rail: pinned horizontal travel on desktop, native swipe on touch.
export default function initRail(ctx) {
  const rail = document.querySelector('[data-rail]');
  const bar = document.querySelector('[data-rail-progress]');
  const pin = document.querySelector('[data-rail-pin]');
  let pinnedTrigger;
  const cards = [...rail.querySelectorAll('.course')];
  function goToCard(card) {
    if (pinnedTrigger) {
      rail.parentElement.scrollLeft = 0;
      const y = pinnedTrigger.start + Math.min(card.offsetLeft, rail.scrollWidth - rail.parentElement.clientWidth);
      ctx.lenis ? ctx.lenis.scrollTo(y, { immediate: true }) : window.scrollTo({ top: y, behavior: 'instant' });
      pinnedTrigger.animation.progress(pinnedTrigger.end === pinnedTrigger.start ? 0 : (y - pinnedTrigger.start) / (pinnedTrigger.end - pinnedTrigger.start));
    } else rail.scrollTo({ left: card.offsetLeft - cards[0].offsetLeft, behavior: ctx.reduce ? 'instant' : 'smooth' });
  }
  function step(direction) {
    const x = pinnedTrigger ? -Number(gsap.getProperty(rail, 'x')) : rail.scrollLeft;
    const current = cards.reduce((best, card, index) => Math.abs(card.offsetLeft - cards[0].offsetLeft - x) < Math.abs(cards[best].offsetLeft - cards[0].offsetLeft - x) ? index : best, 0);
    goToCard(cards[Math.max(0, Math.min(cards.length - 1, current + direction))]);
  }
  document.querySelector('[data-rail-prev]')?.addEventListener('click', () => step(-1));
  document.querySelector('[data-rail-next]')?.addEventListener('click', () => step(1));
  rail.addEventListener('focusin', (e) => {
    const card = e.target.closest('.course');
    if (!card) return;
    const bounds = card.getBoundingClientRect();
    if (bounds.left < 0 || bounds.right > innerWidth) goToCard(card);
  });

  rail.addEventListener('click', (e) => {
    const b = e.target.closest('[data-flip]');
    if (!b) return;
    const card = b.closest('.course');
    card.classList.toggle('is-flipped');
    const back = card.querySelector('.course-back');
    const front = card.querySelector('.course-front');
    const flipped = card.classList.contains('is-flipped');
    back.inert = !flipped;
    front.inert = flipped;
    (flipped ? back : front).querySelector('button, a')?.focus({ preventScroll: true });
  });
  rail.querySelectorAll('.course-back').forEach((b) => (b.inert = true));

  const mm = gsap.matchMedia();
  mm.add('(min-width: 1080px) and (hover: hover) and (pointer: fine) and (min-height: 740px) and (prefers-reduced-motion: no-preference)', () => {
    rail.classList.add('is-pinned');
    const dist = () => Math.max(0, rail.scrollWidth - rail.parentElement.clientWidth);
    const tw = gsap.to(rail, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        start: 'top top+=40',
        end: () => `+=${dist()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (st) => bar && gsap.set(bar, { scaleX: 0.2 + st.progress * 0.8 }),
      },
    });
    // cards tilt slightly with velocity
    const skew = gsap.quickTo(rail.querySelectorAll('.course'), 'rotationY', { duration: 0.6, ease: 'expo.out' });
    const st = tw.scrollTrigger;
    pinnedTrigger = st;
    const id = setInterval(() => skew(gsap.utils.clamp(-8, 8, st.getVelocity() / -400)), 80);
    return () => { rail.classList.remove('is-pinned'); pinnedTrigger = null; clearInterval(id); };
  });
  { 
    const upd = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      if (bar) gsap.set(bar, { scaleX: 0.2 + (max ? rail.scrollLeft / max : 0) * 0.8 });
    };
    rail.addEventListener('scroll', upd, { passive: true });
    upd();
  }
}
