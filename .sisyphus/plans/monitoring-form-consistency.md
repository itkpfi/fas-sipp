# Monitoring Form Consistency Cleanup

## TL;DR
> **Summary**: Standardize the monitoring upsert form on one neutral outer panel per section plus lightweight subpanels only where grouping is semantically necessary. Fix the over-wide address and financing fields in `app/(auth)/monitoring/Utils.tsx` without touching calculations, bindings, or submit behavior.
> **Deliverables**:
> - Consistent panel/wrapper strategy inside the monitoring form shared component
> - Balanced 2-column desktop address layout for KTP and domisili-related address groups
> - Normalized financing field widths so `Jenis Pembiayaan` and neighboring fields no longer break rhythm
> - Calmer, non-chaotic financing/detail subgroup treatment with no unnecessary card-in-card effect
> **Effort**: Short
> **Parallel**: NO
> **Critical Path**: 1 → 2 → 3 → 4

## Context
### Original Request
User complained that the monitoring upsert form had become inconsistent and visually chaotic: address fields were too long, `Jenis Pembiayaan` was too wide, and the file mixed carded fields, uncarded fields, and nested cards. User asked for the layout to be tidied, address blocks to be adjusted, and the overall form to stop feeling “ngaco kacau.”

### Interview Summary
- Preferred form pattern: **panel utama + subpanel ringan**.
- Address layout standard on desktop: **2 kolom seimbang**.
- Colored title treatments were previously rejected and must stay neutral.
- Scope is limited to UI/UX cleanup in the monitoring shared form, not business logic changes.

### Metis Review (gaps addressed)
- Shared `FormInput` styling in `components/utils/FormUtils.tsx` is a blast-radius risk; this plan keeps cleanup local to `app/(auth)/monitoring/Utils.tsx`.
- The plan explicitly freezes calculation hooks, financing assignment logic, and default state shape.
- A default was applied for `Geo Location`: treat it with the same reduced-width discipline as the address group instead of leaving it full-width.
- Responsive regression risk is addressed with desktop and tablet/mobile QA scenarios.

## Work Objectives
### Core Objective
Make `app/(auth)/monitoring/Utils.tsx` visually consistent and easier to scan by standardizing wrapper usage, reducing over-wide address and financing fields, and removing unnecessary nested-card effects while preserving all existing behavior.

### Deliverables
- One consistent local panel taxonomy inside the monitoring form shared component
- Address/KTP and domisili group layout normalized to a balanced desktop rhythm
- Financing top fields normalized so no single field stretches arbitrarily wider than its peers
- Financing helper groups visually harmonized with lightweight neutral subpanels

### Definition of Done (verifiable conditions with commands)
- `npm run build` succeeds from repo root.
- `app/(auth)/monitoring/Utils.tsx` no longer uses the targeted over-wide spans for the address textareas/geo fields that currently create the “kepanjangan” effect.
- `app/(auth)/monitoring/Utils.tsx` no longer gives `Jenis Pembiayaan` a special over-wide desktop span.
- The targeted monitoring sections use one outer section card with lightweight neutral subgroup panels instead of mixed nested-card patterns.
- No logic around `GetFullAge`, `GetMaxTenor`, `GetMaxPlafond`, `GetAngsuran`, `GetBiaya`, financing assignment, or submit flow is changed.

### Must Have
- Localized changes in `app/(auth)/monitoring/Utils.tsx`
- Neutral section headings only
- 2-column balanced desktop address layout
- Consistent field rhythm in `Data Pembiayaan`
- Subpanels only where they improve grouping clarity

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- No edits to business logic, formulas, API payloads, or submit handlers
- No repo-wide redesign of `components/utils/FormUtils.tsx`
- No return to decorative colored title badges/bands
- No blanket removal of every subgroup panel if the subgroup is semantically useful
- No new design-system work outside the monitoring upsert form

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: tests-after + `npm run build` (no dedicated test suite detected in `package.json:5-10`)
- QA policy: Every task includes agent-executed source/build/browser checks
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: Task 1 (panel taxonomy)  
Wave 2: Task 2 (address normalization)  
Wave 3: Task 3 (financing field width normalization)  
Wave 4: Task 4 (nested-panel harmonization + regression-safe polish)

### Dependency Matrix (full, all tasks)
- 1 blocks 2, 3, 4
- 2 blocks 4
- 3 blocks 4
- 4 blocks Final Verification Wave

### Agent Dispatch Summary (wave → task count → categories)
- Wave 1 → 1 task → quick
- Wave 2 → 1 task → visual-engineering
- Wave 3 → 1 task → visual-engineering
- Wave 4 → 1 task → visual-engineering

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. Define and apply one local panel taxonomy in the monitoring form

  **What to do**: In `app/(auth)/monitoring/Utils.tsx`, standardize the target surfaces on one rule set: every major section remains a single `Card`/outer panel; subgroup separation uses only lightweight neutral wrappers; plain field rows stay plain only where intentionally needed to avoid double-carding. Audit `Data Debitur`, domisili-related address rows, and `Data Pembiayaan` first, and remove any wrapper usage that violates this rule within those zones.
  **Must NOT do**: Do not edit `components/utils/FormUtils.tsx`; do not change calculations, data shape, field labels, fetches, or submit flow; do not reintroduce colored title badges/bands.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Single shared file, bounded cleanup, no architecture changes.
  - Skills: `[]` - No extra skill is required for a localized structural refactor.
  - Omitted: `["ui-ux-pro-max"]` - The design direction is already decided; execution should follow the plan directly.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 2, 3, 4 | Blocked By: none

  **References** (executor has NO interview context - be exhaustive):
  - Pattern risk: `components/utils/FormUtils.tsx:27-124` - `FormInput` already renders a rounded bordered shell; changing it globally would affect unrelated forms.
  - Target file: `app/(auth)/monitoring/Utils.tsx:169-170` - local `plainFieldClass` and `compactCardBodyStyle` are the intended local control points.
  - Target section: `app/(auth)/monitoring/Utils.tsx:173-574` - `Data Debitur` and address-related structure currently mix section markers, default `FormInput` wrappers, and full-span fields.
  - Target section: `app/(auth)/monitoring/Utils.tsx:1052-1379` - `Data Pembiayaan` currently mixes plain rows and nested subpanels.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `app/(auth)/monitoring/Utils.tsx` uses one consistent outer-section + lightweight-subpanel rule across the targeted zones.
  - [ ] No new style logic is moved into `components/utils/FormUtils.tsx`.
  - [ ] Neutral heading treatment remains in place for section and subsection titles.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Wrapper strategy is locally standardized
    Tool: Bash
    Steps: Run `npm run build` after normalizing wrapper usage in `app/(auth)/monitoring/Utils.tsx`.
    Expected: Build succeeds with no TypeScript/Next build errors.
    Evidence: .sisyphus/evidence/task-1-panel-taxonomy-build.txt

  Scenario: Shared FormInput blast radius is avoided
    Tool: Bash
    Steps: Run `git diff --name-only` after completing this slice and confirm the cleanup stays in `app/(auth)/monitoring/Utils.tsx` instead of spilling into `components/utils/FormUtils.tsx`.
    Expected: The implementation scope remains local to the monitoring shared form and does not modify the shared `FormInput` component.
    Evidence: .sisyphus/evidence/task-1-panel-taxonomy-scope.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `app/(auth)/monitoring/Utils.tsx`

- [ ] 2. Re-layout KTP and domisili addresses to a balanced 2-column desktop structure

  **What to do**: Convert the KTP and domisili address groups in `Data Debitur` into balanced desktop sublayouts. Keep province/city and district/ward in a clean 2-column grid. Replace the current full-width address behavior with a balanced address band: `Alamat` should occupy the primary column, while `Kode Pos` and `Geo Location` should live in the secondary column stack instead of forcing full-width spans. Apply the same principle to domisili fields when `dom_status` is false.
  **Must NOT do**: Do not remove the `dom_status` toggle; do not change field order outside the address groups; do not keep `Alamat` or `Geo Location` at the current full-width `xl:col-span-3` behavior in the targeted blocks unless a field becomes unusable in narrow desktop widths.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: This is layout-rhythm work with responsive implications.
  - Skills: `["ui-ux-pro-max"]` - Helpful for preserving clean admin-form hierarchy without decorative excess.
  - Omitted: `[]` - No extra omissions beyond the default plan guardrails.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 4 | Blocked By: 1

  **References** (executor has NO interview context - be exhaustive):
  - Current KTP group: `app/(auth)/monitoring/Utils.tsx:358-449` - province/city/district/ward + `Alamat` textarea + `Kode Pos`.
  - Current domisili group: `app/(auth)/monitoring/Utils.tsx:451-573` - domisili toggle and conditional address fields.
  - User decision: desktop standard is `2 kolom seimbang`; do not improvise a third pattern.
  - Existing issue: `app/(auth)/monitoring/Utils.tsx:424-426`, `531-533`, `562-564` - wide spans make address and geo inputs feel excessively long.

  **Acceptance Criteria** (agent-executable only):
  - [ ] The targeted address textareas/geo fields no longer use the full-width desktop spans that caused the overlong layout.
  - [ ] Province/city and district/ward render in a stable 2-column desktop rhythm.
  - [ ] When `dom_status` is toggled off, conditional domisili fields still align cleanly within the same 2-column system.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Desktop address layout is no longer overlong
    Tool: Playwright
    Steps: Open `/monitoring/upsert` at 1440px width, scroll to `Data Debitur`, inspect `Alamat KTP` and `Domisili`, and capture a screenshot showing `Alamat`, `Kode Pos`, and `Geo Location` arranged in a balanced multi-column layout instead of one stretched full-width band.
    Expected: Address content reads as a balanced 2-column desktop layout with no runaway full-width textarea presentation in the targeted blocks.
    Evidence: .sisyphus/evidence/task-2-address-desktop.png

  Scenario: Conditional domisili state does not break layout
    Tool: Playwright
    Steps: At `/monitoring/upsert`, uncheck `Domisili sama dengan KTP?`, verify the conditional domisili fields appear, and capture the resulting layout at 1024px width.
    Expected: Conditional address fields appear without misaligned columns, overflow, or collapsed spacing.
    Evidence: .sisyphus/evidence/task-2-address-domisili-toggle.png
  ```

  **Commit**: NO | Message: `n/a` | Files: `app/(auth)/monitoring/Utils.tsx`

- [ ] 3. Normalize top financing field widths and remove arbitrary over-wide spans

  **What to do**: Rework the top `Data Pembiayaan` field grid so the plain input rows follow one width rhythm. Remove the special desktop over-span from `Jenis Pembiayaan` and keep it visually aligned with sibling financing fields. Maintain the current local plain-row strategy (`plainFieldClass`) for these top financing fields to avoid reintroducing card-in-card shells.
  **Must NOT do**: Do not change the placement of `Tanggal Lahir` relative to `Tanggal Permohonan` and `Usia Pengajuan`; do not edit the product assignment logic or computed age/calculation code; do not convert these top financing fields back into default `FormInput` cards.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: This is a grid and form hierarchy refinement in a dense admin section.
  - Skills: `["ui-ux-pro-max"]` - Helpful for maintaining restrained enterprise form proportions.
  - Omitted: `[]` - No additional omissions needed.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: 4 | Blocked By: 1

  **References** (executor has NO interview context - be exhaustive):
  - Financing top grid: `app/(auth)/monitoring/Utils.tsx:1062-1217`.
  - Problem field: `app/(auth)/monitoring/Utils.tsx:1109-1130` - `Jenis Pembiayaan` currently uses `${plainFieldClass} xl:col-span-2`.
  - Logic to preserve: `app/(auth)/monitoring/Utils.tsx:110-167` - recalculation effect; `1233-1256` - financing product selection updates multiple dependent values.
  - Shared wrapper reference: `components/utils/FormUtils.tsx:27-124` - do not fall back to global wrapper edits to solve local spacing.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `Jenis Pembiayaan` no longer has a special oversized desktop span.
  - [ ] Top financing fields render in a consistent grid rhythm without one field visually dominating the row.
  - [ ] `Tanggal Permohonan`, `Tanggal Lahir`, and `Usia Pengajuan` remain grouped together.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Financing top rows are visually consistent
    Tool: Playwright
    Steps: Open `/monitoring/upsert` at 1440px width, scroll to `Data Pembiayaan`, and capture the top field block containing `Tanggal Permohonan`, `Tanggal Lahir`, `Usia Pengajuan`, `Jenis Pembiayaan`, and adjacent financing fields.
    Expected: `Jenis Pembiayaan` no longer reads as an arbitrarily wider field than its neighbors, and the top block presents a uniform rhythm.
    Evidence: .sisyphus/evidence/task-3-financing-grid.png

  Scenario: Financing logic remains intact after width normalization
    Tool: Bash
    Steps: Run `npm run build` after the financing grid normalization changes.
    Expected: Build succeeds, indicating the layout refactor did not break the financing code path.
    Evidence: .sisyphus/evidence/task-3-financing-build.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `app/(auth)/monitoring/Utils.tsx`

- [ ] 4. Harmonize financing subgroup panels so they feel intentional, not stacked

  **What to do**: Keep only meaningful lightweight subpanels in `Data Pembiayaan`: one neutral subpanel for `Produk & Rekomendasi` and one neutral split region for `Rincian Biaya & Hasil Pembiayaan`. Remove any extra card weight, redundant shadows, or nested-wrapper feel that makes the section look like mixed systems. Preserve `BiayaRow`, `FinanceSummaryTile`, `FinanceResultRow`, and `FinanceEditableRow` only if they remain visually subordinate to the outer section card.
  **Must NOT do**: Do not flatten away true subgrouping that improves readability; do not modify formulas, subtotal chips, result bindings, or field names; do not add decorative colors back into the section titles or markers.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: This is a polish task balancing hierarchy and restraint in a dense finance panel.
  - Skills: `["ui-ux-pro-max"]` - Helpful for reducing visual noise while preserving form clarity.
  - Omitted: `[]` - No additional omissions needed.

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: Final Verification Wave | Blocked By: 2, 3

  **References** (executor has NO interview context - be exhaustive):
  - Current recommendation subpanel: `app/(auth)/monitoring/Utils.tsx:1218-1374`.
  - Current financing detail region: `app/(auth)/monitoring/Utils.tsx:1377-1537` - this area already has helper components and must be visually subordinated, not rebuilt functionally.
  - Helper components: `app/(auth)/monitoring/Utils.tsx:1752-1835` - `BiayaRow`, `FinanceSummaryTile`, `FinanceResultRow`, `FinanceEditableRow`.
  - Guardrail: retain neutral heading treatment already established in `SectionCardTitle` / `SectionMarker` in the same file.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `Produk & Rekomendasi` and `Rincian Biaya & Hasil Pembiayaan` read as lightweight subpanels within one outer financing section, not as competing card systems.
  - [ ] No new decorative title chips/bands are introduced.
  - [ ] Existing helper rows/tiles remain functional and readable, with calmer visual weight than the outer section card.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Financing subpanels feel subordinate to the main section
    Tool: Playwright
    Steps: Open `/monitoring/upsert`, scroll through `Data Pembiayaan`, and capture a screenshot containing the recommendation subpanel and the `Rincian Biaya & Hasil Pembiayaan` block.
    Expected: Both subgroups appear as neutral lightweight subdivisions inside `Data Pembiayaan`, with no stacked-card chaos or decorative title treatment.
    Evidence: .sisyphus/evidence/task-4-financing-subpanels.png

  Scenario: Regression check on computed financing output
    Tool: Playwright
    Steps: In `/monitoring/upsert`, interact with visible financing inputs already present on the page (e.g. select/change a financing product if data is available), then observe that summary rows and editable cost rows still render and respond without UI collapse.
    Expected: The financing detail region remains interactive and structurally intact after the visual cleanup.
    Evidence: .sisyphus/evidence/task-4-financing-regression.png
  ```

  **Commit**: NO | Message: `n/a` | Files: `app/(auth)/monitoring/Utils.tsx`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- Do not create a git commit unless the user explicitly asks for one.
- If a commit is later requested, keep it to one UI-only commit scoped to `app/(auth)/monitoring/Utils.tsx` unless review findings require a separate fix commit.

## Success Criteria
- Monitoring add/edit form looks structurally consistent instead of mixing three panel styles.
- Address blocks are easier to scan and no longer look excessively stretched on desktop.
- `Jenis Pembiayaan` and nearby financing fields follow one consistent width rhythm.
- Finance subgroup panels feel intentional and lightweight, not stacked or chaotic.
- Build passes and no behavior-related code paths are modified.
