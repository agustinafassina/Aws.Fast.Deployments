export function trackPageView(siteName) {
  const payload = {
    site: siteName,
    path: window.location.pathname,
    ts: new Date().toISOString(),
  };
  if (navigator.sendBeacon) {
    try {
      navigator.sendBeacon("/__analytics", JSON.stringify(payload));
    } catch (_) {
      /* analytics must never break the page */
    }
  }
  console.debug("[analytics] pageview", payload);
}
