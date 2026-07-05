const badge = document.getElementById("env-badge");
if (badge) {
  const host = window.location.hostname;
  if (host.startsWith("staging")) {
    badge.textContent = "staging";
  } else if (host === "localhost" || host === "127.0.0.1") {
    badge.textContent = "local";
  } else {
    badge.textContent = "production";
  }
}
