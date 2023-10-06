<script>
  export let sensorData = []
</script>

<h2>Characteristics</h2>
<table>
  <tr>
    <th>Name</th>
    <th>Phase</th>
    <th class="cell-right-align">Voltage</th>
    <th class="cell-right-align">Frequency</th>
  </tr>
  {#each sensorData as data}
    <tr>
      <td>{data.characteristics.name}</td>
      <td>{data.characteristics.phase}</td>
      <td class="cell-right-align">{data.voltage}V</td>
      <td class="cell-right-align">{data.frequency}Hz</td>
    </tr>
  {/each}
</table>
