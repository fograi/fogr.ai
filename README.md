# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Moderation and Reporting Flow

This app supports public reporting, admin moderation decisions, and ad owner appeals.

Admin view:

1. Set `ADMIN_EMAIL` or `ADMIN_EMAILS` plus `SUPABASE_SERVICE_ROLE_KEY` in your environment.
2. Visit `/admin/reports` to review incoming reports and take actions (reject, expire, restore).
3. Provide a statement of reasons and confirm it contains no personal data.
4. Visit `/admin/appeals` to review and resolve appeals.

Ad poster view:

1. If a moderation decision is made, the ad detail page shows the statement of reasons.
2. The moderation decision section is only visible to the ad owner when signed in.
3. The decision includes the action type, reason category, facts, legal or policy basis, and whether automation was used.
4. The poster can submit an appeal directly from the ad detail page.

Ad reporter view:

1. Anyone can report an ad from the ad detail page.
2. Reporters receive a reference ID and a link to check status at `/report-status`.
3. The status page shows whether a decision has been made and the decision details if available.

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
