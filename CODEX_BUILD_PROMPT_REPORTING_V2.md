# Codex Build Prompt — iGoal Reporting Platform v2 Prototype

Bạn đang làm việc trên codebase iGoal hiện tại. Hãy dựng **prototype có thể demo** cho nhóm tính năng Reporting Platform v2 theo file:

`SPEC_REPORTING_PLATFORM_V2.md`

## Mục tiêu

Dựng prototype front-end cho 4 capability:

1. Weekly Work Report + AI Smart Draft.
2. Project Meeting Report: audio upload -> transcript mock -> AI minutes -> review -> Slack preview.
3. Contribution Log + confirmation.
4. Smart Timeline + Checkpoint Evidence preview.

## Nguyên tắc bắt buộc

### 1. Không rebuild iGoal

Trước khi code:

- inspect structure hiện tại;
- tìm component/layout đang dùng cho sidebar, project detail, report list, create report modal, TipTap/editor;
- reuse component/theme/design system hiện có tối đa;
- không tạo một app style khác với screenshots iGoal hiện tại.

### 2. Prototype only

- Không mutation production API.
- Không Slack API thật.
- Không speech-to-text thật.
- Không upload file thật ra external service.
- Dùng mock data / mock services.
- Tạo fake delays cho AI/audio processing để demo interaction.

### 3. Không làm backend architecture phức tạp

Không implement:

- auto update KR;
- auto create Contribution khi submit report;
- block-level permissions;
- transaction nhiều module;
- Asana/Slack sync thật.

Relation trong prototype chỉ là mock metadata.

### 4. AI phải human-in-loop

Mọi AI output phải là Draft/Suggestion.

User phải confirm trước:

- publish report;
- relation tag;
- contribution creation;
- Slack publish.

## Screens / routes cần dựng

Có thể chọn route phù hợp với codebase, nhưng phải có đủ:

1. Weekly Work Report Smart Draft.
2. Project detail Reports — bám UI hiện tại.
3. Create Report modal — mở rộng thêm Contribution group.
4. Meeting Report Upload.
5. Meeting AI Processing.
6. Transcript + Meeting Minutes Review.
7. iGoal/Slack Publish Preview.
8. Contribution Create.
9. Contribution Confirmation.
10. Project Smart Timeline.
11. Checkpoint Evidence Preview.

## Mock data bắt buộc

Dùng dữ liệu gần với iGoal thực tế:

- User: Nguyễn Việt Dũng — Product Manager.
- Projects: iGoal, iWiki, My iKame.
- Project iGoal có KR2 `Bám sát mục tiêu` và milestone `Sprint 1 · 21/09–02/10`.
- Meeting example: `Recap iGoal Sprint 1 Meeting`.
- Weekly Report có các nội dung pilot, Sprint Planning và requirement Game/App.
- Contribution example: `Thiết kế lại hướng Weekly Work Report để giảm complexity backend`.

## Meeting AI flow demo

Phải demo được:

```text
Create Meeting Report
-> Upload file `igoal-sprint-planning.m4a`
-> Processing stepper
-> Transcript mock
-> AI Minutes draft
-> Wording assist
-> Suggested relations
-> Slack preview
-> Publish
```

Sau Publish:

- Report xuất hiện trong Project Report list.
- Timeline có event mới.
- Slack state hiển thị Sent.

Có một toggle/demo action để chuyển Slack state sang Failed và show Retry.

## Weekly AI flow demo

Phải có:

- `Kế hoạch từ tuần trước` checklist.
- CTA `Chuẩn bị bản nháp từ dữ liệu tuần này`.
- AI draft grouped theo iGoal / iWiki / My iKame.
- `Xem nguồn` drawer.
- user chỉnh sửa được.
- submit.
- sau submit show `AI phát hiện 2 nội dung có thể là Contribution`.

## Contribution flow demo

Phải có:

- create manual;
- create from AI suggestion;
- fields Contribution / Impact / Role / Evidence / Relations / Collaborators;
- confirmation status Pending / Confirmed / Need more info;
- confirmer view.

## Relation selector

Tạo component reusable:

`EntityRelationPicker`

Cho phép mock search/filter:

- Project
- Objective
- KR
- KS
- EKS
- Milestone

Chips hiển thị relation đã chọn.

Không thay đổi permission khi tag.

## Smart Timeline

Project iGoal có tab hoặc route `Nhật ký`.

Render timeline từ mock report/contribution/milestone relations.

Filter:

- Tất cả
- Cuộc họp
- Báo cáo
- Quyết định
- Contribution
- Milestone

CTA `Tóm tắt lịch sử bằng AI` mở drawer/modal summary kèm source references.

## UI requirements

Bám visual screenshots iGoal:

- left sidebar;
- top period selector;
- report cards/list;
- create-report modal;
- white/light neutral canvas;
- orange chỉ dùng cho primary CTA;
- tab/navigation active dùng neutral/black treatment như iGoal hiện tại;
- reuse ikame Core DS / existing design tokens/components nếu codebase đã có.

Không tự redesign global navigation.

## Suggested component breakdown

```text
features/reporting-v2/
  components/
    AIContextBanner
    SourceDrawer
    EntityRelationPicker
    ReportTypeModal
    WeeklyCarryOver
    WeeklyProjectSection
    ContributionSuggestionCard
    AudioUploadCard
    AIProcessingStepper
    TranscriptPanel
    MeetingMinutesEditor
    SlackPreview
    ContributionForm
    ContributionConfirmPanel
    TimelineFilters
    ProjectTimeline
    CheckpointEvidencePanel
  mocks/
  types/
  routes-or-pages/
```

Điều chỉnh path theo architecture thật sau khi inspect codebase.

## Workflow trước khi code

1. Inspect repository.
2. Ghi ra các component hiện tại sẽ reuse.
3. Ghi ra route sẽ thêm/chỉnh.
4. Ghi ra mock data model.
5. Sau đó mới implement.

Không tự đổi API contract hiện tại để ép prototype hoạt động.

## Definition of Done

- Prototype chạy được local.
- Không type errors.
- Không production mutations.
- Có navigation xuyên suốt 4 demo scenario trong spec.
- Meeting flow chạy từ upload mock tới publish Slack preview.
- Weekly Report AI draft có source traceability.
- Contribution flow độc lập và có confirmation.
- Timeline hiển thị report/contribution dựa trên relation.
- Có README ngắn hướng dẫn demo theo thứ tự Scenario 1 -> 4.

