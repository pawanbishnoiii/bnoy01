<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep team presentation and admin editing in separate modules backed by `team_members`; public reads show published members while RLS restricts writes to admins.
- Store Truecaller registered URLs in an admin-only singleton; configuration alone must never imply verified Truecaller authentication.
- Reuse the apps catalog for the Windows route with platform-scoped results; installer architecture and requirements belong to app records.
- Resolve project releases from `project_versions` with the legacy changelog as fallback so existing products remain compatible.
- Truecaller callbacks accept only allowlisted HTTPS profile endpoints and server-fetched proof; browser polling requires an expiring secret and never trusts callback profile fields directly.
- Normalize phone identities with libphonenumber-js and protect verified identity fields from browser writes; Truecaller email is not proof of email ownership.
- Source purchases use server-priced checkout orders and verified Razorpay signatures/capture; browser purchase inserts stay disabled.
- Login auditing is deduplicated by validated auth session ID and uses server-observed IP with HTTPS geolocation.
- Reuse Signup for full-page and modal authentication so appearance and busy states remain consistent.
- Truecaller polling is single-flight, resumes on browser focus, and accepts signup/session issuance only after server-fetched phone verification.
- Project descriptions use a standalone Tiptap editor and sanitized Markdown/HTML rendering to preserve formatting without executing user markup.
- Send app emails through the personal Gmail SMTP sender (server-only, SMTP_USER/SMTP_PASS secrets), logging every send to email_logs; worker-mailer on the published runtime, nodemailer in dev, because the Worker has no plain SMTP client.
- Keep admin navigation in WorkspaceShell, separate from the public Navbar, so admin tools have a distraction-free shell without changing public navigation.
- Render the homepage visible before hydration and scope GSAP cleanup to its own context so slow scripts and route transitions cannot blank the page or kill sibling animations.
- Keep booking validation in a browser-safe shared module; persist requests before email, use the selected contact channel, and send admin confirmations only for a stored booking so client and server rules stay consistent.
- Rank public recommendations through one browser-safe utility using product affinity and public aggregate signals, excluding unpublished and incompatible records so catalog views share consistent relevance rules.
