<script>
  export let sensorData = []
</script>

<div class="mains-power-cards">
  {#each sensorData as data}
    <div class="mains-power-card">
      <h4>{data.circuit.name}</h4>
      <span>{data.power}W</span>
      {#if data.apparentPower }
        <span>{data.apparentPower}VA</span>
      {/if}
      {#if data.powerFactor }
        <span>pf {data.powerFactor}</span>
      {/if}
    </div>
  {/each}
  <div style="clear: both;" />
</div>

<style>
  .mains-power-cards {
    padding: 0.8em;
    box-sizing: border-box;
    background-color: var(--table-background);
    margin-bottom: 1em;
  }

  .mains-power-card {
    box-sizing: border-box;
    float: left;
    width: 25%;
    padding: 1em;
    text-align: center;
  }

  .mains-power-card span {
    display: block;
  }
</style>
