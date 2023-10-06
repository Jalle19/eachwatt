<style>
    :global(*),
    :global(html) {
        margin: 0;
        padding: 0;
        border: 0;
    }

    :global(html) {
        width: 100%;
        height: 100%;
    }

    :global(body) {
        width: 100%;
        height: 100%;
        position: relative;
    }

    :global(h1),
    :global(h2),
    :global(p),
    :global(table) {
        margin-bottom: 1em;
    }

    :global(table) {
        width: 100%;
    }

    :global(th),
    :global(td) {
        text-align: left;
        padding: 0 0.4em 0.4em 0;
    }

    :global(th) {
        border-bottom: 1px solid #000;
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        clear: both;
    }

    :global(.cell-right-align) {
        text-align: right;
    }
</style>
<svelte:head>
    <title>EachWatt</title>
</svelte:head>
<div class="container">
    <slot />
</div>
