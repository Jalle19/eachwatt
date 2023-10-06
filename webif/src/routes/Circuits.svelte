<script>
    export let sensorData = []
</script>
<h2>All circuits</h2>
<table>
    <tr>
        <th>Circuit</th>
        <th>Group</th>
        <th>Circuit type</th>
        <th>Sensor type</th>
        <th class="cell-right-align">Power</th>
    </tr>
    {#each sensorData as data}
        <tr>
            <td>{data.circuit.name}</td>
            <td>{data.circuit.group ?? ''}</td>
            <td>{data.circuit.type}</td>
            <td>{data.circuit.sensor.type}</td>
            <td class="cell-right-align">{data.watts}W</td>
        </tr>
    {/each}
</table>
