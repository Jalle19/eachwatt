<script lang="ts">
  import { formatPf } from '$lib/format'
  import type { PowerSensorData } from '$lib/types'
  import warning from '$lib/assets/warning.svg'
  import { resolve } from '$app/paths'

  export let sensorData: PowerSensorData[]
  export let includeHidden: boolean

  $: filtered = sensorData.filter(data => includeHidden || !data.circuit.hidden)
</script>

<table class="pure-table pure-table-striped">
  <thead>
    <tr>
      <th>Circuit</th>
      <th>Group</th>
      <th>Phase</th>
      <th>Circuit type</th>
      <th>Sensor type</th>
      <th class="cell-right-align">Power</th>
      <th class="cell-right-align">Apparent power</th>
      <th class="cell-right-align">Power factor</th>
    </tr>
  </thead>
  <tbody>
    {#each filtered as data}
      <tr>
        <td>
          {#if data.circuit.hidden === true}
            <i>{data.circuit.name} *</i>
          {:else}
            {data.circuit.name}
          {/if}
        </td>
        <td>
          {#if data.circuit.group}
            <a href={resolve(`/group/{data.circuit.group}`)}>{data.circuit.group}</a>
          {/if}
        </td>
        <td>{data.circuit.phase ?? ''}</td>
        <td>{data.circuit.type}</td>
        <td>{data.circuit.sensor.type}</td>
        <td class="cell-right-align">
          {#if data.power !== undefined}
            {data.power}W
          {:else}
            <img src={warning} alt="Warning" /> N/A
          {/if}
        </td>
        <td class="cell-right-align">
          {#if data.apparentPower !== undefined}
            {data.apparentPower}VA
          {/if}
        </td>
        <td class="cell-right-align">
          {#if data.powerFactor !== undefined}
            {formatPf(data.powerFactor)}
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>
