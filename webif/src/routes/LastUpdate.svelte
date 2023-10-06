<script>
  export let lastUpdateTimestamp, webSocketUrl
</script>

<p>
  Last update: {lastUpdateTimestamp?.toISOString()}, connected to {webSocketUrl}
</p>
