# Bnoy Studios — complete upgrade plan

## Priority and current checks
- **Sabse pehle preview:** home, booking aur marketplace ab content dikha rahe hain; browser check mein crash/error overlay nahi mila. Initial load par blank delay mila—first phase mein loading aur animation visibility investigate karke fix karenge. Signed-out `/admin` public home par laut raha hai; signed-in admin separately verify hoga.
- **SMTP_USER aur SMTP_PASS:** previous save status unverified hai; secure secret interface mein confirm karna baaki hai. Email delivery tested nahi hai. Chat mein share hua password revoke karke naya Gmail app password use karna safest hai.
- Uploaded `.backup` PostgreSQL archive hai. Iska safe inventory aur current database comparison hoga; blind restore nahi hoga.
- Pehle complete plan, phir phases ko isi order mein implement aur verify karenge. Existing working authentication, checkout, releases aur team data preserve rahenge.

## 1. Preview stability and foundation
- Blank first load, slow initial visibility, browser errors, public/admin navigation aur broken media diagnose karna.
- Existing email libraries ko server-only rakhna; published environment compatibility check karna, without risky external-library shortcuts.
- Home, login, admin, marketplace, product, apps, Windows aur booking pages ke baseline checks.
- Backup inventory se missing app-owned fields/data identify karna; credentials, auth records aur managed storage schemas blindly import nahi karna. Backup storage URLs original files ka substitute nahi hain.

## 2. Modern admin workspace
- Public Home / Marketplace / Apps / Windows / Book a call / How it works / FAQ navigation **sirf admin workspace ke andar** hide hogi; public website unchanged access rakhegi.
- Full-width workspace with a dedicated compact header: brand, current page, search, account menu and modern fullscreen control.
- Sidebar groups: **Overview**, **Catalog & Studio**, **Media**, **Bookings & Customers**, **Security & Analytics**, **Website & Settings**. Mobile par clear drawer; desktop par collapsible sidebar.
- Media Cloud, Login Security, Visitors aur Editor Studio ko visible menu entries aur dedicated shareable admin views.
- Dashboard: meaningful revenue/orders/catalog/booking summaries, recent activity, loading/empty/error states. Illustrations sirf useful empty states aur repeated overview items mein; data tables clutter-free.
- Existing admin pages—projects, apps/Windows, categories, users, team, bookings, emails, notifications, Google/search settings, Truecaller, AI/deploy and site settings—same organized visual system mein upgrade.
- Admin permissions server par verify honge; public navigation hide karna permission ka replacement nahi hai.

## 3. Editor Studio and project creation
- First screen: Web, App, Windows Software, Automation type selector; **Create new** seedha matching editor kholega, generic tab nahi.
- Guided sections: basic details → description & SEO → releases → media/files → price & publish.
- Type-specific fields: app platform, Windows architecture/requirements/installers, project demo/source and release details.
- Existing products ke versions aur legacy fallback preserve; visual changelog editor, source-upload confirmation aur media picker.
- Draft saving, unsaved-change warning, inline validation, preview and explicit publish action.
- Desktop Enter valid single-line steps mein Next; textareas/Tiptap, menus, file selection aur IME composition mein normal behavior. Final publish accidental Enter se nahi hoga.
- Modern fullscreen control with accessible tooltip, exit state and fallback when browser fullscreen is unavailable.

## 4. Media Cloud, Login Security and Visitors
- **Media Cloud:** grid/list, folder navigation, search/type filters, preview, upload progress, multi-select move/delete confirmation, refresh expiring previews and editor asset selection. Private files stay private.
- **Login Security:** date/provider/user/security filters, summary counts, clear suspicious-signal explanation, detailed device/location view and export of authorized results. Missing data ko fabricated security score nahi banayenge.
- **Visitors:** sessions vs visitors vs views clearly separate; active-time accuracy, date/device/referrer/page/location filters, visit timeline and useful trends.
- Admin-only personal/IP data access; retention settings and privacy disclosure. Optional geolocation failure tracking ko block nahi karega.

## 5. Phone homepage, scanner, team and footer
- New phone top section with prominent Bnoy branding, inspectable product imagery, clear actions and next-section hint; desktop design preserved where already working.
- Live Scanner: real thumbnails, resize/touch behavior, image fallback, animation cleanup and reduced-motion version; mobile overflow/blank canvas issues reproduce and fix.
- Team on phone retains desktop-like composition and imagery, using readable sizing or controlled horizontal browsing rather than squeezed text.
- Footer grouped links: catalog, studio/contact, support and policies. Existing refund policy preserved; Privacy and Terms pages added as reviewable drafts until owner rules are confirmed. No invented refund periods or legal commitments.

## 6. New animated /call booking flow
1. **What do you want to build?** Web / App / Automation / Software / Windows / Other, with branded illustrations.
2. **How should we reach you?** Exactly one: Call / WhatsApp / Email; selected channel's contact field required. Email-only bookings supported.
3. **Budget** — clear choices, including undecided; no invented pricing commitments.
4. **About you** — name, gender, age and Personal / Company. Company name shown only when Company is selected.
5. **Location & idea** — PIN lookup with city selection/editing and clear failure fallback. Idea description skippable.
6. **Pick a date** — available dates with predictable navigation.
7. **Email & time** — secondary email and available time selection. If Email was primary, reuse the verified entered address rather than demanding a second different address. Final review and explicit submit.
- Animated Next/Back transitions, progress, preserved answers and field validation; optional questions remain optional.
- Date/time rules remain current unless explicitly changed; server validates timezone, availability and prevents duplicate slot reservations.
- Booking saved before success shown. Welcome acknowledgement sent automatically; admin sees all details and can send/resend a separate confirmation with delivery status. Avoid duplicate automatic messages and keep email logs.
- Admin booking views: searchable list, details, status management and confirmation controls.

## 7. Images, video and motion
- Cohesive branded asset set: transparent PNG build-type illustrations, helpful admin empty states, realistic software/workspace imagery and booking visuals. Preserve existing logo; generated people are not presented as real staff.
- Branded short booking video with logo intro, build categories and call-booking sequence; poster, pause/mute and reduced-motion alternatives. Exact logo composed into final video rather than relying on generated lettering.
- Integrate assets in the actual requested pages; no unused asset collection.
- GSAP **ScrollTrigger** for purposeful scroll reveals; **Flip** for filters/reordering; **MorphSVG** for small icon/step transitions; **ScrollTo** for intentional navigation. **MotionPath** for branded motion; **MotionPathHelper** only as an authoring tool, not visitor-facing controls.
- Research official examples for suitable interaction patterns; avoid copying demos wholesale or stacking competing animations. Respect reduced motion and phone performance.

## 8. Marketplace and independent product pages
- Upgrade search, filters, sorting, product cards, clear loading/empty states and phone browsing.
- Each project/app/Windows item gets an independent public detail page with branded first view, screenshots/video, features, requirements, releases, price/action and related suggestions.
- Preserve current `/p/` and project links with canonical handling; do not break existing purchases/downloads.
- Recommendations rank by category, tags, technology, platform, use case, budget compatibility, publication freshness and aggregate engagement. Exclude current/unpublished/incompatible items, deduplicate and offer diverse fallbacks. Do not use private visitor identities for public ranking.

## 9. Database, emails and search readiness
- Audit live schema before additive migrations. Booking additions likely include personal/company choice, city/location and confirmation state; add only genuinely missing fields.
- Validate inputs client/server; explicit grants and RLS on every affected table; admin-only access to bookings, logs and private media. Public pages only read published rows.
- Gmail sender remains server-only using saved secrets; verify a booking test reaches storage and emails are recorded, then remove only test rows.
- Unique title/description/OG metadata for every content page, canonical URLs, accurate structured data and dynamic sitemap including published projects/apps/Windows items; exclude admin/private/noindex pages.
- Google/Bing verification and search-submission readiness, with IndexNow only for supported engines and configured domains. Yahoo generally uses Bing discovery.
- **Automatic indexing cannot be guaranteed:** crawlers decide eligibility/timing. Publishing and any owner account/domain verification are separate approvals, not automatic actions in this plan.

## Technical approach
- Preserve TanStack routing, existing authentication and server-priced checkout. Dedicated admin shell/modules avoid expanding the already large AdminPanel further.
- Use semantic design tokens, existing UI controls and shared motion helpers with cleanup. GSAP plugins load only where needed and are browser-safe.
- Use additive database migrations through Lovable Cloud; do not manually edit generated migration metadata or recreate copied migrations.
- Recommendation logic is shared across project/app/Windows views with platform-aware adapters; public metadata derives from safe published records.
- PIN lookup uses a validated endpoint with timeouts and manual fallback; no user data sent to arbitrary endpoints.

## Verification and finish criteria
- Desktop and phone screenshots confirm visible content, readable text, no overlap and usable admin navigation.
- Test type-first editor creation, drafts, Enter/Back/Next, media selection, fullscreen and permissions.
- Submit a booking for each primary contact type, including PIN failure, skipped idea, company/personal choice and slot collision; verify storage and email outcomes.
- Verify scanner, homepage team/footer, marketplace filters, recommendation exclusions and every independent detail page.
- Run existing routing tests plus focused tests for booking validation, editor steps and recommendation ranking. Check preview errors after each phase.
- No fake success states, invented legal policy, exposed secrets or unverified delivery/indexing claims.

## Owner-dependent items
- Final Privacy/Terms wording and any changed refund/cancellation policy need owner approval; existing rules remain in force meanwhile.
- Original media missing from the archive requires original storage access.
- Search account/domain verification and live Truecaller approval need the owner's external approval; no simulated identity proof.
- Public release happens only after an explicit publish request.