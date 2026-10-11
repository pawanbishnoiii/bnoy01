# Fix plan: media, AI, email, admin settings, phone home page

## What was found (already confirmed)
- **Images/media don't load:** the four picture folders (project images, app images, branding, profile photos) are all set to *private*, but the site shows them with public links. Public links to private folders are refused, so every uploaded picture appears broken. The access rules already say "anyone may view" — only the folder flag is wrong.
- **Email (SMTP) errors:** the email log shows two failures: (1) "Username and Password not accepted" by Gmail, and (2) the published site can't find the email-sending module ("No such module worker-mailer").
- **AI assistant:** the chat uses a model name (`gpt-6-astra`) that is not a valid AI model, so every reply fails.
- **Admin Settings:** the settings record was missing (now created). Other admin pages (AI & Deploy) save only when that record exists, and there is no "create if missing" fallback.

## What will be done

### 1. Images and media (first priority)
- Mark the four public picture folders as public so existing and new uploads display everywhere (home page, products, apps, team, admin).
- Keep source code, app installers and Media Cloud private (buyers and admins only).
- Check uploads in Admin → Projects, Apps, Settings (logo/banner), Notifications and Media Cloud end to end in the browser.

### 2. Email that actually sends
- Save the Gmail app password you gave as the email password and `bnoy.studios@gmail.com` as the sender, through the secure secrets form (not in code).
- Fix the sending module on the published site so the "No such module" error stops.
- Add an **Admin → Emails → Sender account** card: shows the sender address, whether the password is set, a "Send test" button and the last error in plain words. Changing the password opens the secure secrets form; the password is never shown or stored in the page.
- Note: the password was shared in chat, so creating a new Gmail app password afterwards is recommended.

### 3. AI working again
- Switch the chat assistant to a valid default model; show a clear message if AI is turned off or out of credits.
- Check the AI writing helpers in the project editor still respond.

### 4. Admin Settings that save everywhere
- Settings, AI & Deploy and Truecaller pages: load reliably, create the record if missing, show "Saved" / clear error, and refresh the live site afterwards.
- WhatsApp number in Settings feeds the /call page (currently a placeholder number — you need to enter the real one).

### 5. Admin check-up and Editor page
- Go through every admin page in the browser while signed in as admin and list and fix errors (failed saves, broken pictures, empty lists, console errors).
- Editor page: put version control at the top of "1 · Info", remove the "Changelog (JSON array)" box, give each version its own price, allow switching the live version, and make Enter move to the next section.

### 6. Phone home page (signed-in user)
- New phone hero: logo, short headline, two big buttons (Explore / Book a call), a freshly generated branded product image, quick stats; no overlap with the top bar.
- Tidy spacing, font sizes and cards for all home sections on small screens.

### 7. Team section — phone friendly and editable
- Phone: swipeable cards with photo, name, skill and social icons, dots to show position; same look as desktop.
- Content comes from Admin → Team (add, edit, reorder, hide), with photo upload that now works.

### 8. New images
- Generate a phone hero image and a few card illustrations matching Bnoy Studios branding and use them on home, team placeholder and admin empty states.

## Things only you can do
- Enter the real WhatsApp number in Admin → Settings.
- Register the Vercel site with Truecaller in the Truecaller developer account (code alone cannot enable it there).

## Technical details
- Storage: update `storage.buckets.public = true` for `project-assets`, `project-images`, `app-assets`, `avatars`; existing SELECT policy already allows public reads. Leave `source-code`, `app-files`, `media-cloud` private.
- Secrets: `SMTP_USER` / `SMTP_PASS` via the secret update tool. Mailer: fix the dynamic `worker-mailer` import so it is bundled for the Worker build (static import inside the server-only mailer, or bundling config), keep nodemailer for dev; verify via a real test send and `email_logs`.
- AI: `src/routes/api/public/ai-chat.ts` model -> `google/gemini-3-flash-preview`; surface 402/429.
- Settings: shared `upsert` on the singleton `site_settings` row in AdminSettings and AdminAiDeploy; invalidate `site-settings` queries.
- Editor: `AdminAddProject` uses `VersionHub` scoped to the project (new `projectId` prop) with price/discount per `project_versions` row; changelog stored from a readable list instead of raw JSON.
- Verification: Playwright as admin on mobile (390px) and desktop, build log, existing tests.
