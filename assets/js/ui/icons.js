(() => {
  const SPRITE_URL = 'assets/icons/sprite.svg';

  const injectSprite = async () => {
    if (document.getElementById('svg-sprite')) return;
    try {
      const res = await fetch(SPRITE_URL, { cache: 'force-cache' });
      const svgText = await res.text();
      const wrapper = document.createElement('div');
      wrapper.id = 'svg-sprite';
      wrapper.style.display = 'none';
      wrapper.innerHTML = svgText;
      document.body.prepend(wrapper);
    } catch (err) {
      console.warn('Icon sprite load failed:', err);
    }
  };

  const sizeClassFromText = (el) => {
    const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
    for (const size of sizes) {
      if (el.classList.contains(size)) return size;
    }
    return null;
  };

  const replaceIcons = () => {
    document.querySelectorAll('.material-symbols-outlined').forEach((el) => {
      const iconName = (el.dataset.icon || el.textContent || '').trim();
      if (!iconName) return;

      const symbolId = `#icon-${iconName}`;
      const fallbackId = '#icon-placeholder';
      const exists = document.querySelector(symbolId);
      const placeholder = document.querySelector(fallbackId);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', `icon icon--md ${sizeClassFromText(el) || ''}`.trim());
      svg.setAttribute('aria-hidden', 'true');

      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      const href = exists ? symbolId : (placeholder ? fallbackId : `${SPRITE_URL}${symbolId}`);
      use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', href);
      use.setAttribute('href', href);
      svg.appendChild(use);

      el.replaceWith(svg);
    });
  };

  document.addEventListener('DOMContentLoaded', async () => {
    await injectSprite();
    replaceIcons();
  });
})();
