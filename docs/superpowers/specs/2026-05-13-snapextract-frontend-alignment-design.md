# SnapExtract Frontend Alignment Design

Date: 2026-05-13
Scope: `snapextract_v3.html`
Status: Approved design, pending implementation plan

## Goal

Align the SnapExtract frontend with the latest product review for the upload flow, the compare flow, and the scene analysis flow. This spec focuses on front-end behavior and presentation only. It does not redesign parsing logic or mock data generation beyond what is needed to support the UI.

## Boundaries

This spec covers three user-visible stages:

1. Home
2. Step 2 compare page
3. Step 3 scene pages

Within Step 3, the terminology is fixed:

- First screen: supplement materials screen
- Second screen: result screen

## Home

### Intent

Make the home screen a minimal entry point rather than a demo surface.

### Requirements

- Keep the brand, main title, bottom scroll rail, and primary entry CTA.
- Remove or keep hidden the following from the main visible flow:
  - `38ms`
  - `看演示`
  - header subtitle
  - sample file entry
  - bottom summary or stats cards
- The home screen should only send the user into the upload and compare flow.

### Notes

The page should feel closer to the official free-try entry point: less explanation, less demo framing, clearer first action.

## Step 2 Compare Page

### Intent

Preserve the three-pane comparison, but narrow its job to upload and output comparison.

### Structure

- `Pane 01`: raw source and upload entry
- `Pane 02`: Tesseract comparison output
- `Pane 03`: SnapExtract structured output

### Requirements

- `Pane 01` is the only upload entry.
- Upload copy must be unified to `桌面拖入 / 文件夹选择`.
- `Pane 01` should remain visually strongest among the three panes.
- `Pane 02` and `Pane 03` act as output panes only.
- Keep the side-by-side comparison concept.

### Removed Controls

The compare page must not expose the following controls in the primary visible flow:

- PDF manual page turning controls
- zoom controls
- delete controls
- raw/json mode toggles
- extra demo-only tabs or technical views

### Result Routing

Step 2 only handles:

- file upload
- preview
- comparison output
- detected-type routing into a scene page

It should not carry scene-specific business UI beyond the route handoff.

## Step 3 First Screen: Supplement Materials

### Intent

Make the first scene screen feel like a formal business form while preserving demo acceleration.

### Shared Layout Rule

All four scenes use the same input grammar:

- left side: field label
- right side: input control or upload control

Field meaning must not rely mainly on placeholder text.

### Shared Interaction Rule

- Primary action remains manual input or upload.
- Demo acceleration remains available.
- Demo actions live in the bottom action area beside `开始分析`.

### Scene-Specific Fields

#### Resume

- `岗位`
- `JD`
- `排除条件`

Demo action:

- `填入示例`

#### Paper

- `研究方向`
- `当前主题`
- `关注问题`
- `目标方法或写作目的`

Demo action:

- `填入示例`

#### Contract

- `补充协议`

Demo action:

- `载入示例文件`

#### Statement

- `银行流水`

Demo action:

- `载入示例文件`

### Visual Behavior

- Labels should be visible outside the control body.
- Inputs can keep short placeholders, but placeholders are secondary hints only.
- Upload controls for contract and statement should still look like upload controls, not plain text inputs.
- The form should read as a consistent scene-level system rather than four unrelated cards.

## Step 3 Second Screen: Result Page

### Intent

Show more useful analysis immediately while keeping the layout within a controlled dashboard-like frame.

### Shared Layout Rule

- Use a `2 x 2` card grid for all four scenes.
- Keep field names inside each card.
- Do not move result card names into an external label strip.

### Shared Density Rule

- Cards should carry more real content by default.
- Reduce empty space and generic filler like `点击查看`.
- If content exceeds the available space, use card-internal scrolling.

### Shared Expansion Rule

- No dedicated `全屏查看` button.
- Clicking a card opens a modal overlay for expanded viewing.
- The overlay is the place for long text, detailed tables, timelines, and larger charts.

## Step 3 Second Screen: Scene Content

### Resume

Cards:

- `信息`
- `综合评价`
- `面试问题`
- `初筛结论`

Content expectations:

- `信息`: stronger candidate summary, not only loose fields
- `综合评价`: matching judgment plus evidence
- `面试问题`: concrete questions the reviewer can use
- `初筛结论`: recommendation and reasons

### Contract

Cards:

- `关键信息`
- `签署建议`
- `客户修改对比`
- `履约时间线`

Content expectations:

- `客户修改对比`: show key before/after clause changes directly in the card
- `履约时间线`: use a vertical two-sided timeline with Party A and Party B separated

### Statement

Cards:

- `手写单据识别结果`
- `对比结论`
- `税务申报建议`
- `验算指标`

Content expectations:

- `对比结论`: present whether the receipt and supplement evidence align, with mismatch summary
- `税务申报建议`: state whether the material is enough for accounting or tax filing, not generic advice
- `验算指标`: improve the metrics so they help verification rather than just decorate the page

### Paper

Cards:

- `研究问题`
- `使用方法`
- `实验结果`
- `相关性结论`

Content expectations:

- `使用方法`: correct the method content so it matches the paper
- `实验结果`: use text plus chart
- `相关性结论`: tie the result to the user-supplied research direction or goal

## Non-Goals

- No backend or parsing engine redesign
- No new global navigation model
- No separate standalone fullscreen feature outside click-to-open overlays
- No return of demo-first home messaging

## Implementation Constraints

- Preserve the existing single-file frontend structure unless a targeted split is required by the implementation plan.
- Prefer localized edits around existing Step 2 and Step 3 builders and bindings.
- Hidden legacy demo helpers may remain temporarily if they do not leak into the primary visible flow, but visible behavior must follow this spec.

## Validation Checklist

- Home has no visible sample entry or demo CTA in the primary flow.
- Step 2 upload copy is unified to `桌面拖入 / 文件夹选择`.
- Step 2 no longer exposes manual page turning, zoom, delete, or raw/json toggles.
- Step 3 first screen uses left labels and right controls in all four scenes.
- Step 3 first screen keeps demo-entry actions in the bottom action area.
- Step 3 second screen uses four denser cards with internal titles.
- Step 3 second screen cards open expanded modal views on click.
- Scene card names match the approved vocabulary for resume, contract, statement, and paper.
