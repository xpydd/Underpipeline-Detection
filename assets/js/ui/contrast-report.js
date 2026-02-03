(() => {
  const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const parseColor = (value) => {
    if (!value) return null;
    if (value.startsWith('rgb')) {
      const nums = value.replace(/rgba?\(|\)|\s/g, '').split(',').map(Number);
      return { r: nums[0], g: nums[1], b: nums[2], a: nums[3] ?? 1 };
    }
    if (value.startsWith('#')) {
      const hex = value.replace('#', '');
      const bigint = parseInt(hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex, 16);
      return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255, a: 1 };
    }
    return null;
  };

  const luminance = ({ r, g, b }) => {
    const srgb = [r, g, b].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  };

  const contrastRatio = (fg, bg) => {
    const L1 = luminance(fg);
    const L2 = luminance(bg);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  };

  const buildReport = () => {
    const pairs = [
      { name: 'Main text on body', fg: '--color-text-main', bg: '--color-bg-body' },
      { name: 'Secondary text on body', fg: '--color-text-secondary', bg: '--color-bg-body' },
      { name: 'Inverse text on primary', fg: '--color-text-inverse', bg: '--color-primary' },
      { name: 'Primary on surface', fg: '--color-primary', bg: '--color-bg-surface' },
      { name: 'Info text on info bg', fg: '--color-info-text', bg: '--color-info-bg' },
      { name: 'Warning text on warning bg', fg: '--color-warning-text', bg: '--color-warning-bg' },
      { name: 'Danger text on danger bg', fg: '--color-danger-text', bg: '--color-danger-bg' }
    ];

    return pairs.map((pair) => {
      const fg = parseColor(getVar(pair.fg));
      const bg = parseColor(getVar(pair.bg));
      const ratio = fg && bg ? contrastRatio(fg, bg) : 0;
      return {
        name: pair.name,
        fg: getVar(pair.fg),
        bg: getVar(pair.bg),
        ratio: Number(ratio.toFixed(2)),
        pass: ratio >= 4.5
      };
    });
  };

  const renderCanvas = (canvas, report) => {
    const ctx = canvas.getContext('2d');
    const width = 920;
    const rowHeight = 48;
    const height = rowHeight * report.length + 60;

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillText('WCAG 2.2 AA Contrast Report', 24, 32);

    report.forEach((row, index) => {
      const y = 60 + index * rowHeight;
      ctx.fillStyle = row.pass ? '#dcfce7' : '#fee2e2';
      ctx.fillRect(20, y - 24, width - 40, rowHeight - 8);

      ctx.fillStyle = row.bg;
      ctx.fillRect(30, y - 18, 80, 24);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(30, y - 18, 80, 24);

      ctx.fillStyle = row.fg;
      ctx.fillRect(120, y - 18, 80, 24);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(120, y - 18, 80, 24);

      ctx.fillStyle = '#0f172a';
      ctx.font = '500 12px system-ui, sans-serif';
      ctx.fillText(row.name, 220, y - 2);
      ctx.fillText(`Ratio: ${row.ratio}`, 640, y - 2);
      ctx.fillText(row.pass ? 'PASS' : 'FAIL', 760, y - 2);
    });
  };

  const mountPanel = () => {
    if (document.getElementById('contrast-audit')) return;

    const details = document.createElement('details');
    details.className = 'audit-panel';
    details.id = 'contrast-audit';

    const summary = document.createElement('summary');
    summary.textContent = '对比度审计报告（WCAG 2.2 AA）';

    const content = document.createElement('div');
    content.className = 'audit-panel__content';

    const canvas = document.createElement('canvas');
    canvas.className = 'audit-panel__canvas';

    const meta = document.createElement('div');
    meta.className = 'audit-panel__meta';

    const actions = document.createElement('div');
    actions.className = 'audit-panel__actions';

    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.className = 'audit-panel__button';
    exportBtn.textContent = '导出对比度 JSON';

    exportBtn.addEventListener('click', () => {
      const report = buildReport();
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'contrast-report.json';
      link.click();
      URL.revokeObjectURL(url);
    });

    actions.appendChild(exportBtn);
    content.append(canvas, meta, actions);
    details.append(summary, content);
    document.body.appendChild(details);

    const report = buildReport();
    renderCanvas(canvas, report);
    meta.textContent = `生成时间: ${new Date().toLocaleString()} · 合格项: ${report.filter((r) => r.pass).length}/${report.length}`;
  };

  document.addEventListener('DOMContentLoaded', mountPanel);
})();
