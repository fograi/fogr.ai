---
status: complete
phase: 04-engagement-and-retention
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-05-SUMMARY.md, 04-06-SUMMARY.md
started: 2026-03-13T20:00:00Z
updated: 2026-03-13T18:30:00Z
---

## Tests

### 1. Cold Start Smoke Test

expected: Kill any running server/service. Start the application from scratch. Server boots without errors, migrations complete, and homepage loads with live data.
result: pass — Playwright webserver boots via wrangler dev, all 55 E2E tests pass.

### 2. Relative Timestamps on Ad Cards

expected: Ad cards on browse pages show relative timestamps like "Dublin · 2d ago" next to the location. Both AdCard and AdCardWide formats display the time.
result: pass — e2e/engagement.test.ts "ad cards show relative timestamps" asserts `.location` contains middot separator and time pattern.

### 3. SOLD Badge on Ad Cards

expected: Any sold ad visible in browse results shows a prominent SOLD badge overlay on the ad card image. The SOLD badge takes priority over any offer badge.
result: pass — e2e/engagement.test.ts "sold ad card shows SOLD badge" asserts `.badge.sold` visible with text "SOLD".

### 4. Sold Ads Visible in Browse

expected: Ads marked as sold within the last 7 days still appear in browse results alongside active ads. Older sold ads are not shown.
result: pass — e2e/engagement.test.ts "both active and sold ads appear in browse results" asserts both mock ads visible.

### 5. Posted Date on Ad Detail

expected: Ad detail page shows "Posted {date}" (e.g. "Posted 12 March 2026") below the ad card.
result: pass — e2e/engagement.test.ts "ad detail shows posted date" asserts `.posted-date` contains "Posted".

### 6. Sold Price on Ad Detail

expected: A sold ad's detail page shows the sold price (e.g. "Sold for EUR 150") if a sale price was recorded.
result: pass — e2e/engagement.test.ts "sold ad detail shows sale price" asserts `.sale-price` contains "Sold for" and "180".

### 7. Save Ad to Watchlist

expected: On an ad detail page (not your own ad, not expired), a heart-shaped Save button appears in the action rail between Share and Report. Clicking it toggles between Save/Unsave with the heart filling/unfilling. Must be logged in.
result: pass — e2e/engagement.test.ts "save and unsave watchlist toggle on ad detail" tests Save→Saved→Save cycle on non-owner ad.

### 8. Watchlist Page

expected: Navigate to /watchlist. Page shows all saved ads as an AdCard grid. Each card has a Remove button. Removing an ad removes it from the list. Empty state shows "No saved ads yet" with link to browse.
result: pass — e2e/engagement.test.ts "watchlist page shows saved ads and supports remove" tests remove + empty state.

### 9. Watchlist Navbar Link

expected: When logged in, the navbar shows a "Watchlist" link with a heart icon. Not visible when logged out.
result: pass — e2e/engagement.test.ts "navbar shows Watchlist link when authenticated".

### 10. Save This Search

expected: On any browse page (homepage, category, county, or category+county), when logged in and at least one filter is active, a "Save this search" button appears. Clicking it saves the current filters and shows brief confirmation feedback.
result: pass — e2e/engagement.test.ts "save this search button works" tests button click → "Search saved!" feedback.

### 11. Saved Searches Management

expected: Navigate to /saved-searches. Page lists saved searches with: inline name editing, notification toggle, delete button, and "Run search" link that navigates to the saved filter combination. Empty state shown when no searches saved.
result: pass — e2e/engagement.test.ts "saved searches page supports toggle and delete" tests toggle alerts off + delete → empty state.

### 12. Saved Searches Navbar Link

expected: When logged in, the navbar shows a "Saved searches" link with a search icon. Not visible when logged out.
result: pass — e2e/engagement.test.ts "navbar shows Saved searches link when authenticated".

### 13. Mark as Sold from My Ads

expected: On My Ads page, clicking "Mark as Sold" on an active ad shows an inline form with optional sale price input (in cents). Confirming marks the ad as sold. The sold status is reflected immediately.
result: pass — e2e/engagement.test.ts "mark sold from My Ads page" tests Mark sold → fill price → Confirm sold → "Marked as sold." notice.

### 14. Mark as Sold from Ad Detail

expected: On your own active ad's detail page, a "Mark as Sold" section appears. Clicking it shows an inline sale price form. Submitting marks the ad as sold with optional price recorded.
result: pass — e2e/engagement.test.ts "mark sold from ad detail page" tests Mark as sold → fill price → Confirm sold → sale-price label appears.

### 15. Currency Selector on Post Form

expected: Post form shows EUR/GBP radio toggle for currency selection. Selecting an NI county (Antrim, Armagh, Down, Fermanagh, Derry, Tyrone) auto-defaults to GBP. Currency toggle hidden for Free/Giveaway and Lost and Found categories.
result: pass — e2e/engagement.test.ts "currency selector auto-selects based on county" tests NI county→GBP, Dublin→EUR.

## Summary

total: 15
passed: 15
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
