# Tasks - Speciality and Preferred Location Table Column & Excel Export Enhancements

- [x] Update frontend Submissions table column **"Applied For"** in `ApplicationFormsPage.tsx`
  - [x] Define normalization color helper `getSpecColorClass` next to `SPEC_BADGE_COLORS`
  - [x] Rewrite "Applied For" column rendering in `ApplicationFormsPage.tsx` to display all active center preferences (excluding `"Not Applicable"`) formatted as `${spec}: ${loc}`
- [x] Update backend Application Forms Excel Export in `application-forms.ts`
  - [x] Add unified `getCenterPrefs` parser inside `GET /application-forms/:id/export`
 ## Phase 6: Mark Sheet View & Excel Score Exports
- [x] Implement `GET /interviews/my-scores/export` for doctor evaluations inside `interviews.ts`
- [x] Implement `GET /interviews/scores/export` for coordinator master score report inside `interviews.ts`
- [x] Remove individual doctor assignments tab from Admin view in `InterviewsPage.tsx`
- [x] Implement "Is Mind Matter" checkbox in panel creation and editing dialogs in `InterviewsPage.tsx`
- [x] Create the new premium "Mark Sheet" tab inside Admin view in `InterviewsPage.tsx` with Specialized dropdown, unified 110-marks breakdown, and export button
- [x] Add "Download My Evaluations" export button inside Doctor assignments view in `InterviewsPage.tsx`

## Phase 7: Verification and Build Validation
- [x] Verify frontend compiles successfully
- [x] Verify backend compiles successfully
- [x] Run full workspace build check `pnpm run build`

## Phase 8: Clinical Evaluation Modal Iframe Fix
- [x] Rebuild backend API server bundle using `pnpm --filter @workspace/api-server run build`
- [x] Terminate stale backend server instance and launch updated build on port 3002
- [x] Verify `/api/submission-view/:id` matches successfully (returns `401 Unauthorized: Missing token` instead of `404 Not Found`)

- [x] **Milestone 5: Frontend Session Management & Graceful Retries**
  - [x] Update `api.ts` request wrapper to retry failed network calls gracefully.
  - [x] Implement automatic idle detection auto-logout in `AuthContext.tsx`.
  - [x] Build Session Management UI widget in the Admin Dashboard to view/terminate active sessions.
- [x] **Milestone 6: Redesigned Admin Master & Queue Dashboards**
  - [x] Redesign `DashboardPage.tsx` with Candidate Progress Matrix showing specialty-wise status.
  - [x] Add Smart Station Suggestion Engine showing next required station.
  - [x] Redesign Queue management view in `InterviewsPage.tsx` with reorder, override, and reassign actions.
  - [x] Update doctor view with lazily loaded dossiers (photo, LORs, PDF).
  - [x] Mappings for shared Mind Mapping Panel seeing all candidates.
- [x] **Milestone 7: Live TV Display Modifications**
  - [x] Update `DisplayPage.tsx` / `QueueDisplayPage.tsx` to handle multi-specialty live changes.
  - [x] Add auto-refresh polling every 3 seconds to reflect real-time reordering.
- [x] **Milestone 8: Styled Excel Report Generator**
  - [x] Update candidate and marksheet exports in `reports.ts` & `interviews.ts` to output detailed rows per applied specialty.
- [x] **Milestone 9: System Validation**
  - [x] Run typescript checks and local servers to confirm correct compilation and zero crashes.
- [x] **Milestone 10: Production LOR Viewing Fix**
  - [x] Refactor `DocValue` component in `ApplicationFormsPage.tsx` to use query parameter authentication and secure direct URLs, completely resolving browser blob PDF viewing restrictions.
  - [x] Refactor `SecureFileLink` in `CandidatesPage.tsx` to open the secure direct URL in a new tab directly.
  - [x] Refactor `VerifyLorPage.tsx` LOR QR gatekeeper to perform administrative access checks via fetch and redirect to the secure direct URL parameter.
  - [x] Refactor `InterviewsPage.tsx` LOR and supporting documents buttons in candidate dossiers to map candidate document URLs correctly.
  - [x] Run a production build of the frontend package using `pnpm --filter fellowship-exam run build` to confirm 100% correct TypeScript typing and Vite compilation.
