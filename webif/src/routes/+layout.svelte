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
    :root {
        --background: #fff;
        --color: #222;
        --table-background: #e0e0e0;
        --highlight-color: #ff3d00;
    }

    @media (prefers-color-scheme: dark){
        :root {
            --background: #272727;
            --color: #aaa;
            --table-background: #3b3b3b;
            --highlight-color: #ff3d00;
        }

        /* pure-table overrides */
        :global(.pure-table) {
            border: 2px solid #424242;
        }
        :global(.pure-table thead) {
            background-color: var(--table-background);
            color: var(--color);
        }

        :global(.pure-table th, .pure-table td) {
            border: 0;
        }

        :global(.pure-table-striped tr:nth-child(2n-1) td) {
            background-color: #2E2E2E;
        }
        /* end pure-table overrides */
    }

    :global(body) {
        background: var(--background);
        color: var(--color);
    }

    :global(h1, h2, h3, h4, h5, h6) {
        margin-top: 0;
        padding-bottom: 0.2em;
        display: inline-block;
        border-bottom: 2px solid var(--highlight-color);
    }

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
