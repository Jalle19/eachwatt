<script lang="ts">
  import { page } from '$app/stores'
  import { circuitSensorDataStore } from '$lib/stores'
  import Circuits from '../../Circuits.svelte'
  import { derived } from 'svelte/store'

  // Create a derived store containing the sensor data for just the circuits belonging
  // to the current group
  const group = $page.params?.group
  let groupSensorData = derived(circuitSensorDataStore, (data) => {
    return data.filter((data: any) => data.circuit.group === group)
  })
</script>

<div class="pure-u-1-1 l-box">
  <h2>Group <i>{group}</i></h2>
  <Circuits sensorData="{$groupSensorData}" />
</div>
