<script lang="ts">
  import { lastUpdateTimestampStore, webSocketUrlStore } from '$lib/stores'
</script>

<style>
  p {
      font-style: italic;
  }
</style>

<p>
  Last update: {$lastUpdateTimestampStore?.toISOString()}, connected to {$webSocketUrlStore}
</p>
