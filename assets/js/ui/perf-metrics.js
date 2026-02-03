(() => {
  const report = {
    generatedAt: new Date().toISOString(),
    navigation: {},
    metrics: {},
    mutations: { total: 0, addedNodes: 0, removedNodes: 0 },
    entries: {}
  };

  const navEntry = performance.getEntriesByType('navigation')[0];
  if (navEntry) {
    report.navigation = {
      type: navEntry.type,
      domContentLoaded: navEntry.domContentLoadedEventEnd,
      loadEventEnd: navEntry.loadEventEnd,
      transferSize: navEntry.transferSize
    };
  }

  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) clsValue += entry.value;
    }
    report.metrics.CLS = Number(clsValue.toFixed(4));
  });
  try { clsObserver.observe({ type: 'layout-shift', buffered: true }); } catch (e) {}

  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const last = entries[entries.length - 1];
    if (last) report.metrics.LCP = Number(last.startTime.toFixed(2));
  });
  try { lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}

  const fidObserver = new PerformanceObserver((list) => {
    const entry = list.getEntries()[0];
    if (entry) {
      report.metrics.FID = Number((entry.processingStart - entry.startTime).toFixed(2));
    }
  });
  try { fidObserver.observe({ type: 'first-input', buffered: true }); } catch (e) {}

  const inpObserver = new PerformanceObserver((list) => {
    const entry = list.getEntries()[0];
    if (entry) {
      report.metrics.INP = Number(entry.duration.toFixed(2));
    }
  });
  try { inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 }); } catch (e) {}

  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      report.mutations.total += 1;
      report.mutations.addedNodes += mutation.addedNodes.length;
      report.mutations.removedNodes += mutation.removedNodes.length;
    });
  });
  mutationObserver.observe(document.documentElement, { childList: true, subtree: true });

  window.__performanceReport = report;
  window.exportPerformanceReport = () => {
    report.generatedAt = new Date().toISOString();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'performance-report.json';
    link.click();
    URL.revokeObjectURL(url);
  };
})();
