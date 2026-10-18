export default function initXp() {
  document.querySelectorAll('[data-xp]').forEach((root) => {
    const panels = [...root.querySelectorAll('.xp-panel')];
    const open = (p) => panels.forEach((x) => x.classList.toggle('is-open', x === p));
    panels.forEach((p) => {
      p.addEventListener('pointerenter', () => open(p));
      p.addEventListener('focus', () => open(p));
      p.addEventListener('click', () => open(p));
    });
  });
}
