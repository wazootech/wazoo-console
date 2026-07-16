<script lang="ts">
  import { enhance } from "$app/forms";

  type Application = {
    uid: string;
    email: string;
    applicantName: string;
    company?: string;
    useCase: string;
    state: string;
    createTime: string;
  };

  let { data, form } = $props<{ data: { applications: Application[]; error: string }; form?: { message?: string } }>();
</script>

<main>
  <section class="panel stack">
    <div class="eyebrow">Admin</div>
    <h1>Beta queue</h1>
    {#if data.error}<p>{data.error}</p>{/if}
    {#if form?.message}<div class="message" role="status">{form.message}</div>{/if}
    <div class="applications">
      {#each data.applications as application}
        <article class="panel application-card">
          <h2>{application.applicantName}</h2>
          <p>{application.email}{application.company ? ` at ${application.company}` : ""}</p>
          <p>{application.useCase}</p>
          <form class="stack" method="POST" action="?/approve" use:enhance>
            <input type="hidden" name="uid" value={application.uid} />
            <label>
              Organization ID
              <input name="organizationId" required pattern={"^[a-z][a-z0-9-]{2,62}$"} />
            </label>
            <label>
              Display name
              <input name="displayName" value={application.company ?? application.applicantName} />
            </label>
            <label>
              Review note
              <input name="reviewNote" />
            </label>
            <div class="actions">
              <button>Approve</button>
              <button class="danger" formaction="?/reject">Reject</button>
            </div>
          </form>
        </article>
      {/each}
      {#if !data.error && data.applications.length === 0}<p>No pending applications.</p>{/if}
    </div>
  </section>
</main>
