export const determineWebSocketUrl = () => {
  const urlParams = new URLSearchParams(window.location.search)

  // Use whatever is specified by the "ws" query parameter, default
  // to the current host of nothing is specified. This allows us to
  // manually define the WebSocket host when running the Svelte
  // development server.
  return urlParams.get('ws') || `ws://${window.location.host}`
}
