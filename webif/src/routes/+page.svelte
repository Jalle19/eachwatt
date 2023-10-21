<script>
  import {
    lastUpdateTimestampStore,
    webSocketUrlStore
  } from '../lib/stores'

  import LastUpdate from './LastUpdate.svelte'
  import Characteristics from './Characteristics.svelte'
  import MainsPower from './MainsPower.svelte'
  import Circuits from './Circuits.svelte'
  import Loader from './Loader.svelte'
</script>

<style>
  p.connecting {
      font-style: italic;
  }
</style>

{#if $lastUpdateTimestampStore === undefined}
  <div class="pure-u-1-8 l-box">
    <Loader />
  </div>
  <div class="pure-u-7-8 l-box">
    <p class="connecting">Connecting to {$webSocketUrlStore}</p>
  </div>
{:else}
  <div class="pure-u-1-1 l-box">
    <LastUpdate />
  </div>
  <div class="pure-u-1-1 l-box">
    <Characteristics />
  </div>
  <div class="pure-u-1-1 l-box">
    <MainsPower />
  </div>
  <div class="pure-u-1-1 l-box">
    <Circuits />
  </div>
{/if}
