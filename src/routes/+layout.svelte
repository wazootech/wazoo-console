<script lang="ts">
  import "../app.css";

  let { children } = $props();
</script>

<svelte:head>
  <title>Wazoo Console</title>
  <meta name="description" content="Apply for Wazoo private beta and manage beta access." />
</svelte:head>

{@render children()}
