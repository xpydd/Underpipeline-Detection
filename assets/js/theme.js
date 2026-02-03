(() => {
  const scripts = [
    'assets/js/ui/icons.js',
    'assets/js/ui/contrast-report.js',
    'assets/js/ui/perf-metrics.js'
  ];

  const loadScript = (src) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  scripts.reduce((promise, src) => promise.then(() => loadScript(src)).catch(() => loadScript(src)), Promise.resolve());
})();
