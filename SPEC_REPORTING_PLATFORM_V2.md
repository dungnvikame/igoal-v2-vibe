# iGoal Reporting Platform v2 — Prototype Spec

**Version:** Prototype 1.0  
**Mục tiêu:** Dùng cho Codex dựng prototype để demo stakeholder Game / App / P&OD / BOD.  
**Phạm vi:** Báo cáo công việc tuần, Báo cáo dự án, Relation/Tag, Contribution Log, AI Assistant và luồng Biên bản họp từ file ghi âm.

---

## 1. Bài toán

iGoal hiện đã có Report ở nhiều entity, nhưng trải nghiệm báo cáo còn rời rạc:

- Member phải nhớ và viết lại công việc ở nhiều nơi.
- Project report chủ yếu được dùng để lưu recap/biên bản họp, Sprint Planning, họp stakeholder và các update đột xuất.
- Report chưa có một lớp liên kết đủ rõ với Project / OKR / KR / KS / EKS / Milestone để tạo lịch sử phát triển theo entity.
- Contribution của cá nhân chưa được ghi nhận có cấu trúc, trong khi đây là evidence quan trọng cho Checkpoint cuối kỳ.
- Quy trình biên bản họp hiện tại phải đi qua nhiều công cụ: ghi âm -> transcript/tổng hợp ở công cụ AI ngoài -> chỉnh wording -> gửi Slack -> copy lại iGoal.

### Mục tiêu sản phẩm

Tạo một hệ thống báo cáo trong đó:

1. **Member viết báo cáo tuần nhanh hơn**, được AI hỗ trợ tổng hợp nhưng vẫn tự review trước khi submit.
2. **Project report trở thành nhật ký chính thức của dự án**, đặc biệt cho meeting notes, decisions và action items.
3. **Mọi report/contribution có thể tag entity liên quan** để hình thành Smart Timeline theo Project/OKR/KR/KS/EKS/Milestone.
4. **Contribution Log là evidence có cấu trúc cho Checkpoint**, tách khỏi Weekly Report nhưng có thể được AI gợi ý từ report đã có.
5. **iGoal là source of truth**; Slack là kênh phân phối nội dung sau khi user review/publish.

---

## 2. Nguyên tắc kiến trúc

### 2.1. Không hợp nhất backend nghiệp vụ

Không biến một thao tác Submit Report thành transaction cập nhật nhiều module.

**Không làm:**

- Submit Weekly Report -> tự update KR.
- Submit Weekly Report -> tự tạo Contribution.
- Submit Project Report -> tự thay đổi Milestone.
- Tag Project -> tự mở permission.

Mỗi module vẫn độc lập. Chúng chỉ gặp nhau qua **Relation Layer** và AI đọc dữ liệu được phép để tạo suggestion.

### 2.2. UX hợp nhất, data model vẫn tách

Người dùng có thể làm việc trong một flow thuận tiện, nhưng backend vẫn giữ:

- Report
- Contribution
- Objective/KR/KS/EKS
- Project/Milestone

là các entity độc lập.

### 2.3. AI = Draft / Suggest / Summarize, không quyết định

AI được phép:

- tạo draft;
- tóm tắt;
- gợi ý tag;
- gợi ý contribution;
- tổng hợp lịch sử;
- hỗ trợ wording.

AI không được:

- tự publish;
- tự gửi Slack trước khi user xác nhận;
- tự confirm Contribution;
- tự update KR/KS;
- tự đánh giá rating/checkpoint.

---

## 3. Kiến trúc chức năng tổng thể

```text
REPORT SYSTEM
│
├── A. Weekly Work Report — báo cáo cá nhân
│
├── B. Project Report
│   ├── Meeting Report
│   ├── Weekly / Progress Update
│   └── Ad-hoc / Instant Report
│
└── C. Contribution Log — evidence cá nhân
        │
        ▼
RELATION LAYER
Project / Objective / KR / KS / EKS / Milestone
        │
        ▼
SMART TIMELINE
        │
        ▼
AI ASSISTANT
Draft / Suggest relation / Suggest contribution / Summarize / Checkpoint evidence
```

---

# 4. Relation Layer — nền tảng dùng chung

## 4.1. Mục tiêu

Cho phép Report và Contribution liên kết với entity nghiệp vụ mà không copy nội dung sang entity đó.

### Entity type hỗ trợ prototype

- PROJECT
- OBJECTIVE
- KR
- KS
- EKS
- MILESTONE

## 4.2. Data model đề xuất

Prototype dùng mock, production có thể triển khai dạng generic relation:

```ts
type RelationEntityType =
  | 'PROJECT'
  | 'OBJECTIVE'
  | 'KR'
  | 'KS'
  | 'EKS'
  | 'MILESTONE';

type SourceType = 'REPORT' | 'CONTRIBUTION';

interface EntityRelation {
  id: string;
  sourceType: SourceType;
  sourceId: string;
  entityType: RelationEntityType;
  entityId: string;
  entityLabel: string;
  createdBy: string;
  createdAt: string;
}
```

### Business rules

- Relation chỉ là liên kết tra cứu/filter, **không thay đổi permission**.
- User chỉ được tag entity mà user có quyền nhìn thấy.
- Khi đang tạo report trong Project Detail, Project hiện tại được prefill relation.
- AI có thể suggest relation nhưng user phải Confirm.

---

# 5. Feature A — Weekly Work Report

## 5.1. Entry

Giữ đúng IA hiện tại:

**Cá nhân -> My EKS / Báo cáo của tôi -> Tạo báo cáo mới -> Báo cáo tuần**

Prototype có thể dùng route riêng nhưng visual phải bám UI iGoal hiện tại.

## 5.2. Mục tiêu

Một Weekly Report giúp member tổng hợp một tuần làm việc thành 4 nhóm:

1. Công việc theo dự án.
2. Đóng góp nổi bật.
3. Công việc khác.
4. Vấn đề / hỗ trợ cần Manager nắm.

Contribution trong Weekly Report **chỉ là phần highlight**, không tự tạo Contribution entity.

## 5.3. Smart Draft bằng AI

Khi user mở Báo cáo tuần, hệ thống có CTA:

**✨ Chuẩn bị bản nháp từ dữ liệu tuần này**

Nguồn được phép dùng:

1. Weekly Report gần nhất của chính user.
2. Kế hoạch tuần tới của Weekly Report trước.
3. Project Reports trong tuần mà user có quyền xem và có liên quan đến user/project của user.
4. Contribution đã tồn tại của user trong kỳ/tuần.

Prototype chỉ cần mock dữ liệu nhưng phải minh họa rõ source.

### AI output dạng structured JSON

```ts
interface WeeklyDraft {
  projectUpdates: Array<{
    projectId: string;
    projectName: string;
    results: string[];
    issues: string[];
    nextPlans: string[];
    sources: SourceRef[];
  }>;
  contributionHighlights: Array<{
    text: string;
    sources: SourceRef[];
  }>;
  otherWorks: Array<{
    text: string;
    sources?: SourceRef[];
  }>;
  supportNeeded: string[];
}
```

## 5.4. Carry-over từ tuần trước

Nếu report trước có `next plan`, tuần này hiển thị block:

**Kế hoạch từ tuần trước**

Mỗi item có trạng thái:

- Hoàn thành
- Chưa hoàn thành
- Không còn áp dụng

AI dùng lựa chọn này để draft phần kết quả tuần hiện tại.

## 5.5. Source transparency

Mỗi suggestion AI có action **Xem nguồn**.

Ví dụ:

> Hoàn thiện Sprint Planning iGoal và chốt scope Sprint 1.  
> `Nguồn: Project Report 21/09 · Weekly Report tuần trước`

Click mở drawer nhỏ hiển thị đoạn nguồn mock.

## 5.6. Submit

Submit chỉ lưu Weekly Report.

Không tạo Contribution, không update Project/KR.

Sau submit có thể hiển thị panel suggestion:

> ✨ AI phát hiện 2 nội dung có thể đáng ghi nhận thành Contribution.

Action:

**Xem gợi ý Contribution**

Chỉ khi user chọn một suggestion mới chuyển sang Contribution flow riêng.

---

# 6. Feature B — Project Report

## 6.1. Entry

Giữ đúng màn hiện tại:

**Dự án -> [Project] -> Mục tiêu & báo cáo -> Tạo báo cáo mới**

Modal hiện tại giữ các loại:

- Báo cáo tuần
- Báo cáo tức thời
- Báo cáo cuộc họp
- Báo cáo check-in

Bổ sung khu vực riêng:

**GHI NHẬN KẾT QUẢ**

- Contribution Log

## 6.2. Project relation tự động

Nếu report được tạo từ Project iGoal:

```text
Project: iGoal   [đã gắn tự động]
```

User có thể tag thêm:

- Objective
- KR
- KS
- Milestone

Tag không ảnh hưởng permission.

---

# 7. Feature B1 — Meeting Report AI Workflow

Đây là flow demo quan trọng.

## 7.1. Bài toán hiện tại

User đang phải:

```text
Ghi âm cuộc họp
-> upload công cụ AI ngoài
-> transcript
-> AI tổng hợp
-> chỉnh wording
-> gửi Slack
-> copy-paste lên iGoal
```

Mục tiêu là đưa toàn bộ flow về iGoal:

```text
Ghi âm
-> Upload iGoal
-> Transcript
-> AI tạo biên bản
-> User review/wording
-> Confirm relations
-> Preview Slack
-> Publish
-> iGoal lưu bản chính thức + Slack nhận nội dung
```

## 7.2. Screen flow

### Screen M1 — Create Meeting Report

Fields:

- Project — prefilled nếu vào từ Project.
- Tên cuộc họp.
- Ngày/giờ.
- Thành phần tham dự — optional prototype.
- Upload audio.
- Tag Objective/KR/KS/Milestone — optional.

Primary CTA:

**Tải lên & tạo biên bản bằng AI**

### Screen M2 — Processing

Hiển thị stepper:

1. Upload file ✓
2. Chuyển giọng nói thành transcript
3. Nhận diện nội dung chính
4. Tạo biên bản nháp

Prototype mô phỏng progress, không cần speech-to-text thật.

### Screen M3 — Review Draft

Layout 2 cột:

**Left: Transcript**
- transcript theo đoạn;
- timestamp mock;
- search transcript.

**Right: Biên bản AI**

Template:

#### Mục tiêu cuộc họp

#### Nội dung chính

#### Quyết định đã chốt

#### Action items

| Việc | Owner | Deadline |
|---|---|---|

#### Vấn đề còn mở

#### Tags liên quan

AI suggest tags:

- Project iGoal
- KR2 — Bám sát mục tiêu
- Milestone — Sprint 1

User confirm/remove.

### Wording Assistant

Mỗi section có action nhẹ:

- Viết gọn hơn
- Làm rõ wording
- Chuyển sang giọng recap Slack

AI chỉ sửa section đang chọn.

### Screen M4 — Preview & Publish

Hai tab preview:

**iGoal** — bản đầy đủ sẽ lưu.

**Slack** — format rút gọn:

- tiêu đề;
- 3–5 nội dung chính;
- decisions;
- action items;
- deep link về iGoal.

User chọn Slack channel mock theo project configuration.

Primary CTA:

**Lưu iGoal & gửi Slack**

### Publish rule

- iGoal phải lưu thành công trước.
- Slack delivery là trạng thái riêng.
- Slack failed không làm mất Meeting Report.
- Prototype cần minh họa trạng thái `Đã lưu iGoal · Gửi Slack thất bại · Thử lại`.

## 7.3. Meeting Report data

Prototype model:

```ts
interface MeetingReport {
  id: string;
  projectId: string;
  title: string;
  meetingAt: string;
  audioFile?: MockFile;
  transcript: TranscriptSegment[];
  content: {
    objective?: string;
    keyPoints: string[];
    decisions: string[];
    actionItems: ActionItem[];
    openQuestions: string[];
  };
  relations: EntityRelation[];
  status: 'DRAFT' | 'PUBLISHED';
  slackDelivery?: 'NOT_SENT' | 'SENT' | 'FAILED';
}
```

### Prototype constraint

Không cần tích hợp NotebookLM hoặc transcription API thật. Mock pipeline nhưng UX phải đủ thuyết phục để demo end-to-end.

---

# 8. Feature C — Contribution Log

## 8.1. Product definition

Contribution Log không phải Weekly Report.

Nó trả lời câu hỏi:

> **Cá nhân này đã tạo ra đóng góp gì, kết quả/ảnh hưởng ra sao, bằng chứng ở đâu và đóng góp đó đã được xác nhận chưa?**

Dữ liệu này sẽ là evidence cho Checkpoint cuối kỳ.

## 8.2. Entry points

1. **Tạo báo cáo mới -> Ghi nhận kết quả -> Contribution Log**.
2. Sau khi submit Weekly Report -> AI Suggest Contribution.
3. Trong Project Report / Meeting Report -> chọn một đoạn -> `Gợi ý ghi nhận Contribution` (prototype có thể minh họa bằng action trên decision/action item).

Tất cả entry point đều mở cùng một Contribution form.

## 8.3. Form

### Field 1 — Tôi đã đóng góp gì? *

Short rich text / textarea.

### Field 2 — Kết quả / ảnh hưởng *

Mô tả outcome. Không bắt buộc phải là financial metric.

### Field 3 — Vai trò của tôi

Options prototype:

- Chủ trì
- Đóng góp chính
- Phối hợp
- Hỗ trợ

### Field 4 — Evidence

Cho phép mock:

- Link Report
- Link Slack/Asana
- File
- URL khác

Nếu Contribution được tạo từ report, source report được prefill làm evidence.

### Field 5 — Liên quan

Tag:

- Project
- Objective
- KR
- KS
- EKS
- Milestone

### Field 6 — Người phối hợp

Multi-select optional.

## 8.4. Status

Tách hai dimension:

```ts
recordStatus: 'DRAFT' | 'SUBMITTED'
confirmationStatus: 'PENDING' | 'CONFIRMED' | 'NEED_MORE_INFO'
```

Không dùng `CONFIRMED` như performance score.

`CONFIRMED` chỉ có nghĩa:

> Người xác nhận đồng ý rằng contribution/evidence này là hợp lệ trong phạm vi trách nhiệm của họ.

## 8.5. Confirmation

Prototype dùng mock `BU Head` là confirmer cho Game use case nhưng code không hard-code role.

```ts
interface Contribution {
  id: string;
  ownerId: string;
  contribution: string;
  impact: string;
  role: 'LEAD' | 'MAJOR' | 'COLLABORATE' | 'SUPPORT';
  evidence: EvidenceRef[];
  relations: EntityRelation[];
  collaborators: UserRef[];
  sourceReportId?: string;
  recordStatus: 'DRAFT' | 'SUBMITTED';
  confirmationStatus: 'PENDING' | 'CONFIRMED' | 'NEED_MORE_INFO';
  confirmerId?: string;
}
```

## 8.6. AI Suggest Contribution

AI đọc report user có quyền và tạo suggestion:

```text
✨ Có thể là Contribution

Thiết kế lại hướng Weekly Work Report để giảm complexity backend.

Kết quả gợi ý:
Chốt được MVP tách Weekly Report khỏi transaction Project/Contribution.

Nguồn:
• Weekly Report 21/09
• Meeting Game/App

[Không phải] [Ghi nhận Contribution]
```

Bấm `Ghi nhận Contribution` -> mở form prefilled -> user review -> Submit.

Không auto-create.

---

# 9. Smart Timeline

## 9.1. Mục tiêu

Dùng Relation Layer để tạo lịch sử phát triển của bất kỳ entity nào mà không phải copy report.

Prototype ưu tiên **Project Timeline**.

Entry:

**Project -> Lịch sử / Nhật ký**

Timeline có:

- Meeting Report
- Weekly/Instant Report
- Decisions
- Contribution
- Milestone

Filter:

- Tất cả
- Cuộc họp
- Báo cáo
- Quyết định
- Contribution
- Milestone

Ví dụ:

```text
21/09 — Sprint Planning
• Ưu tiên Epic Báo cáo nháp
• Demo UX trong tuần 1

17/09 — Meeting Game
• Không tạo lại Project khi sang Half mới
• Làm rõ Contribution cadence

15/09 — Contribution · Nguyễn Việt Dũng
• Thiết kế Weekly Report prototype
```

## 9.2. AI summary

CTA:

**✨ Tóm tắt lịch sử dự án**

User chọn khoảng thời gian.

AI trả summary kèm source references.

---

# 10. Checkpoint Evidence — demo extension

Không build Checkpoint mới trong prototype.

Chỉ cần một modal/panel demo từ Contribution Log:

**Xem evidence cho H2 Checkpoint**

Group theo relations:

```text
KR2 — Bám sát mục tiêu
• 5 Contribution đã xác nhận
• 9 Weekly Report liên quan
• 4 Project Report liên quan
```

AI có CTA:

**Tạo bản nháp tự đánh giá từ evidence**

Output phải có source link, chỉ là draft, không tự submit/checkpoint score.

---

# 11. UI / IA requirements cho prototype

Bám sát screenshots iGoal hiện tại:

- Sidebar trái giữ các nhóm OKR CHUNG / CÁ NHÂN.
- Header, H2 selector, search giữ visual language hiện tại.
- Project detail giữ tabs `Mục tiêu & báo cáo / Tài liệu / Quản lý dự án / Góp ý / Lịch sử chỉnh sửa`.
- Không redesign toàn bộ iGoal.
- Tận dụng modal `Tạo báo cáo mới` hiện có và chỉ mở rộng hợp lý.
- Primary CTA vẫn dùng brand orange như iGoal hiện tại.
- Tab active không dùng brand orange; bám Core DS.
- Dùng Core DS 1.1 semantic tokens; không hardcode màu mới.

---

# 12. Prototype screens bắt buộc

Codex phải dựng ít nhất các states/screens sau:

### P1 — My Weekly Report / AI Smart Draft

- Carry-over plan tuần trước.
- AI prepare draft.
- 4 report sections.
- Source drawer.
- Submit.
- Post-submit contribution suggestions.

### P2 — Project Detail / Reports

- Bám screenshot hiện tại.
- Modal `Tạo báo cáo mới`.
- Contribution ở group riêng.
- Tag relation UI.

### P3 — Create Meeting Report / Upload

- File upload.
- Meeting metadata.
- AI processing state.

### P4 — Meeting Transcript + AI Minutes Review

- Transcript trái.
- AI minutes phải.
- Decisions, action items, open questions.
- AI wording actions.
- Suggested tags.

### P5 — Meeting Publish Preview

- iGoal preview.
- Slack preview.
- Success state.
- Slack failure/retry state.

### P6 — Contribution Log Create

- Full form.
- Prefilled variation từ AI suggestion.

### P7 — Contribution Confirmation

- Pending / Confirm / Need more info.
- Source/evidence visible.

### P8 — Project Smart Timeline

- Timeline + filters.
- AI summary mock.

### P9 — Checkpoint Evidence Preview

- Group confirmed contributions by KR/EKS.
- Draft self-assessment mock with sources.

---

# 13. Prototype demo scenario

## Scenario 1 — Member Weekly Report

Dũng mở Báo cáo tuần -> AI đọc report trước + project reports -> draft iGoal/iWiki -> user review -> submit -> AI suggest 2 Contributions.

## Scenario 2 — Meeting Workflow

Dũng vào Project iGoal -> Tạo báo cáo cuộc họp -> upload audio -> processing -> AI transcript + minutes -> wording -> confirm tag KR2 -> preview -> `Lưu iGoal & gửi Slack`.

Kết quả demo:

- Meeting Report xuất hiện trong iGoal.
- Slack preview đã gửi.
- Smart Timeline iGoal có entry mới.

## Scenario 3 — Contribution

Từ Weekly Report suggestion -> Ghi nhận Contribution -> form prefill -> submit -> BU Head confirm -> contribution xuất hiện ở Project Timeline và Checkpoint Evidence.

## Scenario 4 — Project History

Mở Project Timeline -> filter `Quyết định` -> AI tóm tắt lịch sử 3 tháng -> mỗi claim có source.

---

# 14. Acceptance Criteria — Prototype

1. Weekly Report không tự update Project/KR/Contribution.
2. AI draft hiển thị nguồn cho ít nhất các suggestion chính.
3. Project Report tạo từ Project tự prefill project relation.
4. User có thể tag thêm Objective/KR/KS/EKS/Milestone bằng mock selector.
5. Meeting flow demo được từ upload audio tới AI minutes và Slack preview.
6. User bắt buộc review trước Publish.
7. Slack delivery failure không làm mất report đã lưu.
8. Contribution là flow độc lập, không auto-create khi submit report.
9. Contribution thể hiện rõ Contribution / Impact / Role / Evidence / Relations / Confirmation.
10. `Confirmed` không hiển thị như rating/performance score.
11. Timeline tạo từ relations, không copy report content sang Project entity.
12. AI history summary có source references.
13. Checkpoint evidence chỉ là preview/draft, không tự scoring/submitting.
14. Prototype không gọi production API, không gửi Slack thật, không upload audio thật ra external service.

---

# 15. Out of scope prototype

- Speech-to-text thật.
- NotebookLM integration.
- Slack API thật.
- Asana sync thật.
- KR progress mutation.
- Permission refactor.
- Production data migration.
- Real file storage.
- Contribution scoring/ranking.
- Checkpoint mutation.

---

# 16. Open decisions — không block prototype

Prototype dùng default/mock cho các điểm sau, nhưng UI/data model không hard-code business rule:

- Ai confirm Contribution theo từng loại project.
- Tần suất confirm Contribution.
- Slack channel mapping theo report type.
- Audio retention policy.
- Report template/metrics cuối cùng của Game/App/UA/Creative.
- Project Phase/Cadence rule chính thức.
- AI provider / speech-to-text provider production.

---

# 17. Kỳ vọng khi demo stakeholder

Stakeholder cần nhìn thấy rõ 4 giá trị:

1. **Member viết report nhanh hơn** nhờ AI draft + carry-over.
2. **Meeting workflow giảm từ nhiều công cụ xuống một flow trên iGoal**.
3. **Project có nhật ký phát triển tự nhiên** nhờ tag/relation, không bắt PM làm Project Log thủ công.
4. **Contribution trở thành evidence có cấu trúc cho Checkpoint**, nhưng human vẫn confirm và quyết định cuối.

