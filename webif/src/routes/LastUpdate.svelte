<script>
  export let lastUpdateTimestamp, webSocketUrl
</script>

<style>
  p {
      font-style: italic;
  }
</style>

<p>
  Last update: {lastUpdateTimestamp?.toISOString()}, connected to {webSocketUrl}
</p>
