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
