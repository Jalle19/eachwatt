<script lang="ts">
  import { configurationStore } from '$lib/stores'
</script>

<div class="pure-u-1-1 l-box">
  <h2>Configuration</h2>
  <pre id="configuration">{$configurationStore}</pre>
</div>

<style>
    pre {
        padding: 0.8em;
        box-sizing: border-box;
        background-color: var(--component-background);
        overflow: hidden;
    }
</style>

