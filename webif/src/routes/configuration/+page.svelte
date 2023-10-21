<script>
  import { configurationStore } from '../../lib/stores'
  import { onDestroy } from 'svelte'
  import Configuration from '../Configuration.svelte'

  let configuration = {}

  const unsubscribe = configurationStore.subscribe((value) => configuration = value)

  onDestroy(unsubscribe)
</script>

<Configuration configuration={configuration} />
