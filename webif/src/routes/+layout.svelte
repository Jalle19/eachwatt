<script>
    import 'purecss/build/pure.css'
</script>
<svelte:head>
  <title>EachWatt</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</svelte:head>
<div class="pure-g container">
  <slot />
</div>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        clear: both;
    }

    :global(table) {
        width: 100%;
    }

    :global(.cell-right-align) {
        text-align: right;
    }

    :global(.pure-g > div) {
        box-sizing: border-box;
    }

    :global(.l-box) {
        padding: 1em;
    }
</style>
