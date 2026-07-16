<script lang="ts">
  import { enhance } from "$app/forms";
  import { env } from "$env/dynamic/public";

  let { form } = $props<{ form?: { message?: string } }>();
  let turnstileToken = $state("");

  if (typeof window !== "undefined") {
    (window as typeof window & { wazooTurnstileCallback?: (token: string) => void }).wazooTurnstileCallback = (token: string) => {
      turnstileToken = token;
    };
  }
</script>

<svelte:head>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</svelte:head>

<main>
  <section class="hero">
    <div class="panel">
      <div class="eyebrow">Private beta</div>
      <h1>Build Worlds your agents can actually use.</h1>
      <p>
        Wazoo gives teams a managed Worlds layer: structured knowledge, graph-native query, and API-first control over every hosted World.
      </p>
      <div class="grid">
        <div class="pill">Wazoo Platform API</div>
        <div class="pill">Worlds Data API</div>
        <div class="pill">Cloudflare-hosted Console</div>
      </div>
    </div>
    <div class="panel">
      <h2>Request access</h2>
      <form class="stack" method="POST" use:enhance>
        <label>
          Email
          <input name="email" type="email" autocomplete="email" required />
        </label>
        <label>
          Name
          <input name="applicantName" autocomplete="name" required />
        </label>
        <label>
          Company
          <input name="company" autocomplete="organization" />
        </label>
        <label>
          What do you want to build?
          <textarea name="useCase" required></textarea>
        </label>
        <input type="hidden" name="turnstileToken" value={turnstileToken} />
        <div class="cf-turnstile" data-sitekey={env.PUBLIC_TURNSTILE_SITE_KEY ?? ""} data-callback="wazooTurnstileCallback"></div>
        <button disabled={!turnstileToken}>Apply for beta</button>
        <div class="message" role="status">{form?.message ?? ""}</div>
      </form>
    </div>
  </section>
</main>
