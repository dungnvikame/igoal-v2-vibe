# iGoal Reporting Platform v2 — Prototype

Prototype front-end để demo stakeholder theo `../SPEC_REPORTING_PLATFORM_V2.md`. Mock data, không gọi API thật, không gửi Slack thật, không upload audio ra ngoài. Dữ liệu lưu trong `localStorage` của trình duyệt.

Mục đích: **mô tả hành vi để dev build lại**. Code sẽ không được kế thừa, nên đọc README + comment trong `src/model.ts` là đủ nắm business rule.

## Chạy

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc --noEmit, strict
npm run build
```

## Deploy & CI/CD

- **Vercel** (Git integration, cấu hình ở `../vercel.json`): push `main` → bản production; push branch khác hoặc mở PR → link preview riêng để gửi stakeholder xem trước khi merge.
- **GitHub Actions** (`../.github/workflows/ci.yml`): mỗi push / PR chạy `npm ci` → `typecheck` → `build`; đỏ thì sửa trước khi merge.
- Trang có `noindex` (meta + header) để link chia sẻ không lên Google. Dữ liệu chỉ là mock, lưu `localStorage` của từng người xem — stakeholder thao tác không ảnh hưởng nhau.
- Cập nhật prototype: sửa code → `git commit` → `git push` (hoặc tạo branch `feedback-xxx` để có link preview riêng).

## Thứ tự demo

Trước khi demo: **Thiết lập demo → Khôi phục dữ liệu demo ban đầu** để về seed sạch.

### Scenario 1 — Weekly Report có AI draft
1. Sidebar **My EKS** → card **Tổng hợp báo cáo** → **Tạo báo cáo mới** → **Báo cáo tuần** (mở lại nháp nếu đã có, không tạo trùng). Template 3 mục: **Kết quả tuần này · Khó khăn / vấn đề · Kế hoạch tuần tới**, user tự viết như editor iGoal.
2. AI là tùy chọn: bấm **Lấy từ báo cáo** trên bar (hoặc icon ✨ trên rail phải). Panel bên phải hiện **danh sách báo cáo nguồn** (báo cáo tuần trước của chính mình đứng đầu, rồi báo cáo dự án tuần này), mỗi dòng có tiêu đề · dự án · ngày · số ý.
3. Bấm một báo cáo → các dòng của nó, **đã chia sẵn theo mục sẽ vào** (Kết quả / Khó khăn / Kế hoạch). Bấm ＋ để chèn; dòng đã thêm có ✓. "← Tất cả báo cáo" để chọn nguồn khác. Nguồn hiện nhỏ dưới mục.
4. Sửa nội dung tùy ý như văn bản thường.
5. **Liên kết** nằm ở hàng meta trên cùng: EKS của user gắn sẵn (× để gỡ); chèn gợi ý từ dự án nào thì dự án đó tự gắn; KR/KS/Mốc của nguồn hiện dạng chip viền nét đứt, bấm là thêm. "＋ Thêm" mở ô tìm kiếm gom theo dự án. Không có bước xác nhận chặn nút Gửi.
6. **Xuất bản** → màn chọn nơi xuất hiện + xem trước + cấu hình chia sẻ (Scenario 7); chỉ khi bấm **Xuất bản** trên màn đó mới gửi. Không còn gợi ý Contribution sau khi gửi. Rời trang khi chưa lưu sẽ có cảnh báo.
7. **Báo cáo tuần của PM** (tạo trong Dự án → Tổng hợp báo cáo): cùng editor, nhưng gợi ý trong từng mục lấy từ **báo cáo tuần của member và check-in**: quét báo cáo tuần cá nhân của member đã tag dự án và check-in KS trong kỳ, gom theo người. PM tổng hợp kết quả team bằng cách bấm Thêm. "Báo cáo cũ" là các báo cáo tuần trước của dự án.

### Scenario 2 — Meeting Report từ audio
1. Sidebar **Dự án** → card **iGoal** → card **Tổng hợp báo cáo** → **Tạo báo cáo mới** → **Báo cáo cuộc họp**.
2. **Dùng bản ghi mẫu · Sprint Planning** (hoặc kéo file audio bất kỳ, chỉ đọc tên) → **Tải lên & tạo biên bản bằng AI**.
3. Stepper processing → màn Kiểm tra: biên bản ở giữa, **Transcript** ở panel phải (＋ để chèn đoạn vào mục đang chọn), **Chỉnh câu chữ** theo mục, việc cần làm, liên kết gợi ý dạng chip nét đứt.
4. Tick "Tôi đã kiểm tra…" → **Xem trước** → tab iGoal / Slack, chọn kênh. Tick **Demo lỗi gửi Slack** để xem state Failed + Thử lại.
5. **Lưu iGoal & gửi Slack** → success → **Xem biên bản vừa lưu**. Report xuất hiện trong list và Nhật ký.

### Scenario 3 — Contribution + xác nhận
1. Mở một báo cáo đã gửi (vd. Dự án iGoal → **Tổng kết Pilot tuần 1**) → nút **Ghi nhận đóng góp** trên bar → bấm ＋ ở một dòng → form prefilled → **Gửi xác nhận**. Dòng đó chuyển sang ✓.
2. **Thiết lập demo** → đổi vai sang **Lục · BU Head** → tab **Xác nhận đóng góp** chỉ thấy bản đã gửi giao cho mình; bấm ô "Chờ xác nhận" để lọc.
3. Bấm một dòng → panel phải → **Yêu cầu bổ sung** (bắt buộc ghi chú) hoặc **Xác nhận**.
4. Đổi lại vai Dũng → item "Cần bổ sung" → **Bổ sung** → note của Lục vẫn còn → sửa → **Gửi xác nhận** lại.
5. Contribution đã xác nhận xuất hiện ở **Dự án → Nhật ký** và trong drawer Liên quan của KR/EKS đã tag.

### Scenario 4 — Project Timeline
1. **Dự án → iGoal → Tổng hợp báo cáo → tab Nhật ký** → lọc **Quyết định**.
2. **Tóm tắt lịch sử dự án** → chọn khoảng ngày → **Tạo tóm tắt** → đoạn tổng hợp + danh sách nguồn.

### Scenario 5 — Relation layer: tag rồi tìm lại ở đâu
1. **Dự án → iGoal**: dòng O / KR / KS trong card OKR có icon + số liên kết khi > 0. Bấm dòng **KS1** → drawer **Lịch sử mục tiêu**: tiến độ hiện tại, rồi một dòng thời gian gồm **Check-in** (nơi duy nhất có %, ví dụ 15/09 · 40%), **Báo cáo** (hành động, kết quả; báo cáo tuần hay sprint 2 tuần cùng nằm trên một trục) và **Đóng góp** (trạng thái confirm). Bộ lọc 3 chip theo loại.
2. Bấm một mốc → mở bản ghi gốc. Bấm chip relation ở bất kỳ đâu cũng mở cùng drawer. Cùng một view cho member (EKS của mình), PM (KR của dự án) và manager (mở My EKS của member).
3. **Tổng hợp báo cáo → Lọc**: mở bộ lọc Trạng thái (Nháp / Đã gửi) · Loại báo cáo · Dự án (Dự án chỉ ở My EKS); số filter đang bật hiện trên nút Lọc. Tìm kiếm luôn hiện.
4. **My EKS**: dòng E1 / E2 bấm được như trên, dẫn tới báo cáo tuần và contribution đã tag EKS.

### Scenario 6 — Chia sẻ báo cáo (kiểu Google Drive)
1. Vai **Dũng** → Dự án iGoal → **Sprint Planning** → nút **Chia sẻ** trên bar. Dialog liệt kê mọi nguồn quyền: Chủ sở hữu · Thành viên dự án iGoal · Team BU Game · Lục (có dòng "Cũng xem được: Qua team BU Game").
2. Gõ tên người / team → Enter hoặc bấm để thêm → vai trò cố định **Người xem · xem & bình luận** → **Chia sẻ**.
3. Bấm × ở dòng Lục → toast "Đã gỡ chia sẻ trực tiếp với Lục · vẫn xem được: Qua team BU Game".
4. **Thiết lập demo** → đổi vai **Lục** (BU Head, không phải admin): sidebar **Được chia sẻ với tôi** có 4 báo cáo, lọc nhanh Tất cả / Trực tiếp / Qua team, nút Lọc mở Loại · Người chia sẻ · Dự án · Thời gian chia sẻ, sắp xếp theo ngày chia sẻ / ngày báo cáo. Dự án iGoal chỉ còn báo cáo được chia sẻ. Mở báo cáo: badge **Người xem**, không có nút Chia sẻ, panel **Bình luận** gửi được, tệp đính kèm tải được.
5. **Thiết lập demo → Nhân sự**: vai **Nguyệt** thấy "Họp khởi động My iKame" (qua team UA) + "Báo cáo tuần 09–15/09" (trực tiếp). Chuyển Nguyệt sang team Creative → chỉ còn báo cáo chia sẻ trực tiếp. Bỏ tick **Hoạt động** → màn "Tài khoản đã ngừng hoạt động"; trong dialog chia sẻ của Dũng, dòng Nguyệt mờ "không còn quyền".
### Scenario 7 — Xuất bản đa nơi (nơi xuất hiện + AI chỉnh theo nơi)
1. Vai **Dũng** → **My EKS** → **Tạo báo cáo mới → Báo cáo tuần**, viết vài dòng (có số liệu, có ý về iGoal và iWiki; chèn từ **Lấy từ báo cáo** thì dự án nguồn tự gắn và được chọn sẵn ở bước sau). Bấm **Xuất bản** (nháp được lưu trước).
2. Màn **Xuất bản**: trái là **Nơi xuất hiện** gom Cá nhân (My EKS · Quản lý trực tiếp) / Dự án / Kênh Slack. Chỉ hiện nơi được phép viết: Dũng thấy iGoal, iWiki nhưng **không** thấy My iKame (chỉ là thành viên). Nơi viết (My EKS, hoặc dự án đang mở nếu viết từ dự án) có khóa "luôn lưu".
3. Tick / bỏ tick để chọn nơi; bấm vào một nơi để **Xem trước** đúng cách nó hiện ở đó (dòng trong danh sách + nội dung; Slack là tin nhắn mô phỏng). Tab **Chỉnh nội dung** sửa riêng cho nơi đó (tag **Riêng**, "Dùng lại bản gốc" để bỏ).
4. Panel **Chỉnh bằng AI**: bấm gợi ý hoặc gõ yêu cầu, chọn **Chỉ nơi đang xem** / **Tất cả nơi đã chọn**. Demo hiểu: *Ẩn các con số kinh doanh* (giữ ngày, mã KR/Sprint), *Chỉ tập trung vào báo cáo của dự án iWiki* (bỏ ý không thuộc iWiki), *Rút gọn*, *Bỏ mục …*. Kết quả liệt kê thay đổi + **Hoàn tác**; phần ẩn được tô vàng.
5. Khối **Chia sẻ** (trái, dưới cùng): thêm người / team, vai trò Người xem, chỉ tạo khi bấm Xuất bản. Tick **Demo lỗi gửi Slack** nếu muốn xem trạng thái lỗi.
6. **Xuất bản tới n nơi** → màn **Trạng thái gửi**: từng nơi chuyển từ "Đang gửi…" sang Đã gửi / Gửi không thành công (Slack có **Thử lại**), mỗi dòng có **Mở báo cáo** (Slack: **Xem tin nhắn**). Bản ở iWiki chỉ có nội dung iWiki; bản gửi quản lý nằm ở **Được chia sẻ với tôi** của Long.
7. Mở lại báo cáo gốc bất kỳ lúc nào: nút **n nơi xuất hiện** trên bar → panel cùng trạng thái + điều hướng. "Quay lại soạn" từ màn Xuất bản giữ nguyên nội dung riêng theo nơi.

## Dữ liệu mẫu (để xem cách dữ liệu nối nhau)

| Nhóm | Bản ghi |
|---|---|
| iGoal · mục tiêu | O1 → KR1 Thiết lập · KR2 Bám sát · KR3 Đánh giá; KS1, KS2; Milestone Pilot tuần 1, Sprint 1 |
| iGoal · báo cáo | Kick-off H2 (07/15, O1+KR1) · Chốt Requirement Checklist (08/05, KR2+KS1) · Rà soát Đánh giá hiệu suất (09/08, KR3) · Tổng kết Pilot tuần 1 (09/12, KR2+KS1+Pilot) · Check-in KS 15/09 (KS1+KS2) · Meeting Game/App (09/17) · Weekly Creative của Quý (09/18, KS2) · Weekly Kinh doanh của Nguyệt (09/19, KR2) · Sprint Planning (09/21, KR2+Sprint 1) · nháp của Nguyệt (09/22) |
| iWiki | O2 → KS1 Launch 4.0; Milestone Launch 11/09; Recap Launch (09/11) · Theo dõi sau phát hành (09/18, EKS) |
| My iKame | O3 → KS1; Kick-off với P&OD (08/20, Long) · Rà soát nhu cầu báo cáo (09/19) |
| Weekly cá nhân (Dũng) | 3 tuần liên tiếp 09/01 · 09/08 · 09/15, tag iGoal / iWiki / KR / EKS; tuần 09/15 là nguồn carry-over |
| Contribution | Chốt Requirement Checklist (đã xác nhận) · Pilot tuần 1 (chờ) · Theo dõi iWiki (đã xác nhận) · Onboarding 6 team của Nguyệt (cần bổ sung) · Visual onboarding của Quý (chờ) · nháp Chuẩn hóa biên bản |

## Business rule đã chốt (dev bám theo)

- Submit Weekly **không** update KR, **không** tạo Contribution. Contribution chỉ được tạo khi user gửi form Contribution.
- AI chỉ Draft / Suggest / Summarize. Liên kết AI gợi ý hiện dạng chip nét đứt, user bấm mới gắn (Weekly, Meeting dùng chung component `RelationPicker`). Dự án của nguồn user chủ động chèn được gắn luôn, gỡ bằng ×.
- Meeting publish: lưu iGoal trước, Slack là trạng thái riêng. Slack FAILED không làm mất report; Retry chỉ gửi lại Slack.
- Contribution có 2 trục trạng thái: `recordStatus` (DRAFT/SUBMITTED) và `confirmationStatus` (PENDING/CONFIRMED/NEED_MORE_INFO). CONFIRMED không phải điểm đánh giá.
- Lưu nháp Contribution **giữ nguyên** `confirmationStatus` và `note`. Chỉ Gửi xác nhận mới reset về PENDING.
- Người xác nhận chỉ thấy Contribution `SUBMITTED` được giao cho mình. Không thấy nháp.
- Weekly Report cá nhân có relation Project **được hiển thị** trên Project Timeline cho mọi thành viên (đã chốt).
- Weekly Report dùng template 3 mục: Kết quả tuần này · Khó khăn / vấn đề · Kế hoạch tuần tới. Mục "Kế hoạch tuần tới" là nguồn carry-over cho tuần sau.
- Kế hoạch tuần trước = từng dòng của section "Kế hoạch tuần tới" trong báo cáo tuần trước, hiện trong gợi ý của mục Kết quả ("Hoàn thành: …") và Kế hoạch ("Tiếp tục: …"); chỉ lấy báo cáo của chính người viết, không đụng tiến độ mục tiêu.
- Timeline sinh từ relation, không copy nội dung report vào Project.
- **Chia sẻ báo cáo** (logic ở `src/sharing.ts`, dữ liệu `Data.shares` / `Data.comments` / `Data.users`):
  - Ai được quyền chia sẻ: **người viết (owner)** + **ADMIN của entity chứa báo cáo** (dự án với báo cáo dự án; team người viết với báo cáo cá nhân). Manager không mặc định được chia sẻ.
  - Chia sẻ cho **cá nhân** hoặc **team**. Một vai trò duy nhất **Người xem**: xem + bình luận + tải tệp đính kèm, **không sửa** (bản nháp của người khác cũng chỉ mở chế độ xem).
  - Nguồn quyền: owner · admin entity · thành viên dự án · chia sẻ trực tiếp · chia sẻ qua team. **Quyền hiệu lực = quyền cao nhất** (Chủ sở hữu > Quản trị > Người xem). Gỡ chia sẻ trực tiếp chỉ bỏ nguồn đó; còn nguồn team / entity thì vẫn xem được.
  - Chia sẻ team tính theo **team hiện tại**: chuyển team → mất quyền từ team cũ, chia sẻ trực tiếp vẫn giữ. Account **inactive** → mất toàn bộ quyền ngay (kể cả báo cáo của mình).
  - **Tệp đính kèm** kế thừa 100% quyền của báo cáo; không xem được báo cáo thì không mở / tải được tệp (drawer nguồn và chi tiết báo cáo hiện màn chặn).
  - Bản nháp chỉ người viết thấy. Tag relation không mở quyền (spec). Danh sách báo cáo dự án, Nhật ký, tìm kiếm topbar chỉ trả báo cáo user có quyền xem.
  - Màn **Được chia sẻ với tôi** chỉ gồm chia sẻ trực tiếp / qua team (không gồm quyền có sẵn từ entity), không gồm báo cáo của chính mình.
- **Xuất bản đa nơi** (logic ở `src/publishing.ts`, UI `src/Publish.tsx`, dữ liệu `Data.publications`, `Report.variants/origin/destination`):
  - Editor Weekly / Tức thời: nút **Xuất bản** mở màn Xuất bản (không gửi ngay). Meeting giữ luồng Xem trước & gửi Slack riêng; Check-in giữ nút Gửi.
  - Nơi xuất hiện: **My EKS**, **Quản lý trực tiếp** (`managerOf`), **dự án** user có quyền viết (`reportWriters` — khác thành viên chỉ xem), **kênh Slack** của các dự án đó (`projectChannels`). Nơi không có quyền viết **không hiển thị**.
  - Nơi viết là bản gốc, luôn lưu, không bỏ chọn được (iGoal là source of truth). Dự án đã gắn trong Liên kết được chọn sẵn.
  - Mỗi nơi có nội dung riêng, mặc định = nội dung editor; sửa tay / AI chỉ tác động nơi đang xem hoặc mọi nơi đã chọn. Mục bị làm trống không xuất hiện ở nơi đó.
  - Mỗi nơi (trừ Slack) nhận **một bản báo cáo riêng** trỏ `origin` về bản gốc. Bản ở dự án là báo cáo dự án (quyền theo thành viên dự án), liên kết chỉ giữ mục tiêu thuộc dự án đó. Bản cho quản lý = bản riêng + chia sẻ trực tiếp (Người xem), không nằm trong My EKS.
  - Slack gửi sau khi lưu iGoal; lỗi Slack không ảnh hưởng nơi khác, Thử lại chỉ gửi lại Slack. Chỉ người viết thấy trạng thái gửi từng nơi (panel **Nơi xuất hiện**).
  - Chia sẻ cấu hình trên màn Xuất bản áp cho bản ở nơi viết, cùng rule Chia sẻ báo cáo ở trên. Nhật ký dự án không hiện trùng báo cáo cá nhân đã có bản ở dự án.
  - AI là mock chạy bằng rule (regex / từ khóa dự án), không gọi model.

## UI bám iGoal hiện tại (đối chiếu screenshot 22/09/2026)

- **Sidebar / topbar / tabs dự án**: sidebar xám nhạt, active là pill xám; topbar 48px có share, H2 selector, search `Ctrl K`, bell; tabs dự án nằm ngay dưới topbar, active gạch chân đen. Sidebar giữ đúng mục của iGoal thật (không thêm mục riêng cho prototype).
- **Dự án** là trang danh sách card (tìm kiếm, Đơn vị/Team, tag, mục tiêu + %) → bấm card mới vào chi tiết. Chi tiết gồm card **OKR dự án** (O/KR/KS + progress, Cập nhật tiến độ / Tạo mới) và card **Tổng hợp báo cáo** dạng danh sách: nút Lọc mở Trạng thái · Loại báo cáo (+ Dự án ở My EKS), tìm kiếm, badge **Bản nháp** chỉ trên dòng nháp; bấm dòng nháp để soạn tiếp, dòng đã gửi mở toàn trang. **Nhật ký** là một chế độ xem trong card này.
- **Relation layer gọn**: chip relation một kiểu trung tính (mã KR/KS đậm, nhãn loại mờ), tối đa 3 chip rồi "+n", ẩn chip dự án khi đang trong dự án đó. Dòng OKR chỉ hiện icon + số liên kết khi > 0. Drawer Liên quan dùng segmented control Báo cáo / Đóng góp / Qua KR-KS, một danh sách mỗi lúc, badge chỉ khi trạng thái khác mặc định.
- **Dọn chữ 23/09** (sau góp ý stakeholder): bỏ các câu giải thích luật nghiệp vụ khỏi UI (để trong README); dòng báo cáo còn 2 tầng (tiêu đề + badge chỉ khi Bản nháp; meta + mã liên kết dạng chữ), trích đoạn chuyển vào tooltip; cam chỉ còn ở nút chính. Chi tiết dự án giảm từ 662 xuống 365 chữ, từ 10 xuống 1 badge.
- **Meeting / Contribution (23/09)**: Meeting dùng cùng khung editor: stepper gọn, hành động chính trên bar (bước Kiểm tra có ô "Đã kiểm tra" ngay cạnh nút Xem trước), thông tin cuộc họp dạng hàng meta, Liên kết dùng picker chung. Form Contribution: vai trò dạng segmented, bằng chứng thêm qua popover (Báo cáo có tìm kiếm / Link / File), liên kết gợi ý từ báo cáo làm bằng chứng, người phối hợp dạng chip bật/tắt. Danh sách Contribution dòng 2 tầng, bấm cả dòng.
- **Tức thời / Check-in (23/09)**: dùng cùng panel **Lấy từ báo cáo** 2 bước (component `SourcePicker` + `buildSourceOptions`). Tức thời: 3 mục Kết quả / cập nhật · Vấn đề / hỗ trợ · Kế hoạch tiếp theo, nguồn như báo cáo tuần. Check-in: nguồn là báo cáo **đã tag KS đang chọn kể từ lần check-in trước** của KS đó; dòng chèn vào Kết quả đã làm / Bước tiếp theo / Khó khăn của card đang chọn (panel ghi rõ "Chèn vào KSx", nhiều card thì chọn bằng dropdown). Card KS gọn: mã + tên, thanh tiến độ mặc định bằng tiến độ hiện tại, hiện "từ x%" khi thay đổi, file đính kèm là nút nhỏ. Panel phụ thứ hai là "Check-in cũ".
- **Chi tiết báo cáo (23/09)**: cùng khung editor, nội dung ở giữa với 1 dòng meta (người viết · ngày · loại · dự án). Rail phải 3 panel: **Thông tin** (meta, liên kết, trạng thái Slack + Gửi lại cho biên bản họp), **Nguồn đã dùng** (chỉ khi báo cáo có chèn từ nguồn; bấm để mở báo cáo gốc), **Ghi nhận đóng góp** (các dòng của mục Kết quả / Nội dung chính / Quyết định / Việc cần làm / kết quả check-in; bấm ＋ mở form Contribution đã điền sẵn dòng đó, báo cáo làm bằng chứng và liên kết của báo cáo; dòng đã ghi nhận có ✓). Đây là entry point 3 của spec 8.2.
- **My EKS / Dự án (23/09)**: bấm dòng EKS / O / KR / KS (hoặc chip liên kết trên danh sách) mở **Lịch sử mục tiêu ở panel phải của trang** (không còn drawer che trang); dòng đang xem được tô sáng, panel đóng khi chuyển trang. Trong editor / chi tiết báo cáo vẫn là drawer. **Nhật ký dự án** thành danh sách 2 dòng (ngày · icon · tiêu đề · loại hoặc dòng quyết định · mã liên kết), lọc bằng 1 dropdown "Loại", bấm để mở bản ghi gốc. Tab **Dòng thời gian** của Contribution Log dùng cùng kiểu dòng.
- **Contribution Log (23/09)**: các ô số liệu trên cùng là **bộ lọc** (Tất cả · Chờ xác nhận · Cần bổ sung · Đã xác nhận · Bản nháp chỉ với người viết), bỏ hàng chip lọc. Danh sách / Theo tháng dùng dòng 2 tầng; bấm dòng mở **chi tiết ở panel phải** (không drawer), dòng đang xem được tô sáng. Panel: kết quả, bằng chứng (bấm để mở báo cáo gốc / link), liên kết, người phối hợp, người xác nhận. Người viết có nút "Tiếp tục soạn" / "Bổ sung & gửi lại"; người xác nhận ghi chú + "Yêu cầu bổ sung" (bắt buộc ghi chú) / "Xác nhận" ngay trong panel, trạng thái và số liệu cập nhật tại chỗ.
- **Danh sách dự án (23/09)**: giữ hành vi iGoal thật (bấm card vào chi tiết). Bộ lọc **Đơn vị / Team** là dropdown hoạt động được, kèm "Xóa lọc"; card gọn: tên, người phụ trách · đơn vị · nhãn, mục tiêu + thanh tiến độ, dòng "Báo cáo gần nhất dd/mm · n báo cáo" để biết dự án còn được cập nhật; bỏ emoji, có trạng thái rỗng khi lọc không ra kết quả.
- **Meeting – panel phải (23/09)**: bỏ cột transcript cố định bên trái, dùng rail phải như các editor. Bước Thông tin: "Biên bản cũ" (các cuộc họp đã lưu của dự án). Bước Kiểm tra: **Transcript** (tìm kiếm, mỗi đoạn có ＋ chèn vào mục đang chọn; panel ghi "Chèn vào [mục]", mục đích được tô viền; đoạn đã chèn có ✓). Bước Gửi: **Gửi recap** (kênh Slack, demo lỗi) và Transcript để đối chiếu.
- **Check-in – panel phải (23/09)**: chọn KS không còn là pop-up mà là panel **Chọn KS** (gom theo Objective, hiện tiến độ hiện tại, bấm là thêm card; KS đã có thì bấm để chọn card đó), mở sẵn khi báo cáo chưa có KS. Có card thì thêm **Lấy từ báo cáo** (card đang nhận nội dung được tô viền tím) và **Lịch sử KS** (lịch sử mục tiêu của KS đang chọn: các lần check-in trước với %, báo cáo, đóng góp) thay cho "Check-in cũ". Nút "Thêm KS" trong trang mở panel Chọn KS.
- **Rà soát UI/UX (23/09, chiều)** — lớp `styles/polish.css` load sau cùng: chữ phụ `--text-tertiary` đậm lên #706b65 (đạt 4.5:1), chữ badge xanh/vàng đủ tương phản; vòng focus cho mọi dòng bấm được, Enter **và Space** đều kích hoạt; chuyển động 120–220ms cho hover/press, modal, drawer, toast (tắt khi `prefers-reduced-motion`); sửa tiêu đề editor bị ép về 14px, tab Contribution Log co vào giữa / nhảy layout, chip liên kết tràn ngang panel phải, mã EKS hiện "EKS · EKS" (nay E1/E2); `Ctrl K` / `⌘K` vào ô tìm kiếm, `Esc` xóa, `Enter` mở kết quả đầu; form Contribution báo lỗi ngay dưới ô + focus ô lỗi, hỏi trước khi đóng khi chưa lưu; màn ≤1000px panel phải hiện dạng lớp phủ thay vì bị ẩn. Màu cam nút chính giữ nguyên theo thương hiệu iGoal (chữ trắng trên cam mới đạt 3.4:1).
- **Cải tiến nhìn thấy được (23/09, chiều)**: **Tổng hợp báo cáo** chia nhóm *Tuần này / Tuần trước / Trước đó*, ngày tương đối (Hôm nay · Hôm qua · n ngày trước, hover xem ngày đầy đủ), icon màu theo loại khớp modal Tạo báo cáo (tuần xanh · tức thời vàng · họp tím · check-in xanh lá), hover dòng hiện "Xem ›" hoặc "Tiếp tục soạn" (nháp). **Editor**: ô nhập tự giãn theo nội dung (`AutoTextarea`), trạng thái "● Chưa lưu" / "✓ Đã lưu · hh:mm" (`SaveState`), `Ctrl S` lưu nháp (Weekly, Meeting), bar có bóng khi cuộn, mục báo cáo tuần đã viết có ✓. **Tìm kiếm topbar** (`GlobalSearch.tsx`): gom Dự án / Báo cáo / Đóng góp, icon + meta, tô phần khớp, ↑↓ Enter Esc. **Card dự án**: chấm xanh khi có báo cáo trong 7 ngày, "Cập nhật hôm qua", nổi nhẹ khi hover. **Contribution Log**: chấm màu trạng thái trên ô số liệu. **Toast** có nút đóng.
- **My EKS** gồm card **Mục tiêu (EKS)** + card hồ sơ, dưới là **Tổng hợp báo cáo** cá nhân. Tabs: Mục tiêu & báo cáo · Contribution Log · Góp ý · Lịch sử thay đổi (Contribution Log là tab mở rộng của prototype).
- **Loại báo cáo** (Sản phẩm / Kinh doanh / Creative) có trên mọi editor và hiện badge cạnh tiêu đề như bản thật, tương ứng 3 đầu mối PM / UA / Creative trong requirement.
- **Modal Tạo báo cáo mới**: đúng 4 loại + wording của iGoal, icon màu theo loại, câu chú thích nhóm cho Check-in; nhóm Contribution Log thêm cùng kiểu, footer Hủy.
- **Weekly**: 3 mục; AI là panel **Lấy từ báo cáo** ở cột phải, 2 bước chọn nguồn → chọn dòng, không sổ hết mọi gợi ý.
- **Weekly**: 3 mục; AI là toggle "✨ n gợi ý" trong từng mục, không có panel riêng hay nút AI trên bar.
- **Check-in** (`Checkin.tsx`): card "Cập nhật tiến độ KS" giống iGoal: chọn KS theo Objective (mỗi KS một card), slider %, Kết quả đã làm *, Bước tiếp theo *, Khó khăn, File đính kèm, nút Bỏ. Tiến độ lưu trong report (`checkins[]`), không mutation KS.
- Meeting giữ stepper riêng, chỉ bọc trong `EditorFrame`.
- **Chi tiết báo cáo** cũng là trang full-page cùng khung (read-only): title, Người viết, Ngày, Loại, nội dung; panel phải có Phân phối Slack (meeting, có Thử lại), gợi ý Contribution, Liên kết.
- **Tab Contribution Log** trong My EKS ("Trang của tôi" theo requirement): stat strip, tab Danh sách / Dòng thời gian, biểu đồ đóng góp theo tháng (xanh = đã xác nhận).
- Cỡ chữ nâng lên body 15 / phụ 13 / nhãn 12 (`type-scale.css`, load sau cùng).
- Minh họa thêm từ requirement gốc: dải overview dự án có **Giai đoạn · Tần suất báo cáo · kỳ tới** (mock `projectCadence`, hover xem 3 đầu mối PM/UA/Creative).

## Giới hạn prototype (không phải bug)

- Không có URL route. F5 về trang Dự án; editor chưa lưu sẽ mất.
- `owner` mọi bản ghi luôn là Dũng, kể cả khi đổi vai demo.
- Chia sẻ: thành viên / admin entity là mock cố định (`entityAdmins`, `projectMembers` trong `model.ts`). Long là admin team Technology (được chia sẻ báo cáo cá nhân của Dũng) nhưng prototype chưa có màn để Long mở báo cáo cá nhân của member. "Sao chép liên kết" chỉ mô phỏng (không có URL route). Không gửi thông báo cho người nhận.
- Chỉ có dự án iGoal; `relations.includes('igoal')` hardcode ở list/timeline.
- Transcript, wording assistant, AI summary, AI chỉnh nội dung theo nơi xuất hiện là mock, không gọi model. Không gửi Slack thật.
- `preview.html` là mockup tĩnh cũ, không liên quan app.
