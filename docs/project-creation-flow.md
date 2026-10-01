# Luồng tạo dự án

Cập nhật: 29/09/2026 · Prototype: `prototype-app/src/ProjectForm.tsx`, `project-config.ts`

## Nhu cầu → thiết kế
| Nhu cầu | Đáp ứng | Ở đâu |
|---|---|---|
| Loại dự án, nền tảng, BU/team, role PM/UA/Creative/Dev/QA | Bước 1: loại + phân loại, nền tảng, Product Manager, Đơn vị phụ trách, BU/Cen/Team phụ trách, Đơn vị phối hợp, UA phụ trách · Bước 2 "Thành viên": **thêm người trước → chọn vai trò** (dropdown tự mở; vai trò có sẵn PM/UA/Creative/Dev/QA hoặc **vai trò mới** tự đặt tên). Chưa chọn vai trò thì chưa qua bước | Mới: nền tảng, vai trò linh hoạt |
| Tạo OKR cho dự án + link OKR BU/Team | Bước 3 "OKR dự án", đi từ trên xuống: (1) KR của BU/Team dự án đóng góp → (2) OKR dự án kỳ hiện tại, mỗi mục tiêu chọn "Đóng góp cho" KR team → (3) Mốc quan trọng | Mới |
| Start/End date, chạy xuyên H1/H2 | Bước 1: Bắt đầu + Kết thúc hoặc "Dài hạn". Dự án không gắn kỳ; mỗi kỳ chỉ tạo OKR mới | Mới |
| Milestone không bắt buộc | Bước 3, dưới OKR: mốc = **ngày cụ thể cần đạt một kết quả của mục tiêu** (vd. "Soft launch VN · 15/10"), gắn với 1 mục tiêu, gắn được vào báo cáo. Khác **giai đoạn** (giai đoạn = ai phải báo cáo, bao lâu một lần; mốc = theo dõi tiến độ mục tiêu) | Mới |
| Luồng báo cáo khác nhau theo giai đoạn (Game/App) | Bước 4: ma trận Giai đoạn × Product / UA / Creative (Bắt buộc / Tùy chọn / Không cần) + tần suất, gom theo pha. Xem mục "Giai đoạn & báo cáo" bên dưới | Mới |
| Viết trên iGoal, link Project/OKR/KR/Milestone, đẩy recap Slack | Đã có (editor + Xuất bản đa nơi). Bước 5 "Slack & quyền xem" chỉ cấu hình kênh Slack của dự án | Đã có + cấu hình kênh |
| Quyền xem report theo nhóm | Bước 5: ma trận Mảng báo cáo × Nhóm (PM, UA, Creative, Dev, QA, BU Head, Vận hành). Mặc định Kinh doanh chỉ PM/UA/BU Head/Vận hành. Vai trò tự tạo tính vào cột "Vai trò khác" | Mới (prototype mới cấu hình, chưa áp vào quyền xem thật) |
| BU Head xem tổng hợp project/milestone/tiến độ/thiếu report | Ngoài luồng tạo dự án → màn riêng | Chưa làm |

## Loại dự án & giai đoạn (cập nhật 29/09 theo thread BU Game/App)
- **Loại dự án**: chỉ 2 loại — Dự án kinh doanh (Game, App) · Dự án nền tảng (Sản phẩm nội bộ, Hạ tầng).
- **Dự án chủ lực**: cờ riêng ở bước 1, hiện tag "Chủ lực" trên card / trang dự án. Quyết định mẫu báo cáo giai đoạn Maturity.
- **2 pha lớn** (theo buổi với PM): *Phát triển sản phẩm* — Product báo cáo chính; *Vận hành* — UA báo cáo chính; thêm *Tạm dừng*.
- **Giai đoạn mẫu Game/App** (theo Queen):

| Pha | Giai đoạn | Product | UA | Creative | Tần suất |
|---|---|---|---|---|---|
| Phát triển | Prototype | Bắt buộc | — | Tùy chọn | 1 tuần |
| Phát triển | Soft Launch | Bắt buộc (việc đang làm) | Bắt buộc (MKT so với mục tiêu/kế hoạch) | Tùy chọn | 1 tuần |
| Vận hành | Global Launch | Bắt buộc | Bắt buộc | Bắt buộc | Hằng ngày |
| Vận hành | Maturity · chủ lực | Bắt buộc | Bắt buộc | Bắt buộc | 1 tuần |
| Vận hành | Maturity · không chủ lực | — | Tùy chọn (thỉnh thoảng, để dự án không bị thả trôi) | — | Khi có cập nhật |
| Tạm dừng | Pend | — | — | — | — |

- Dự án nền tảng: Phát triển (Product bắt buộc, Creative tùy chọn) → Vận hành (Product, 2 tuần).
- Mọi ô sửa được; thêm / bớt giai đoạn trong từng pha. Đổi cờ chủ lực → áp lại mặc định cho Maturity.
- **Trang dự án**: thanh "Giai đoạn" (PM / quản trị đổi giai đoạn hiện tại ngay tại đây) + tình trạng từng đầu: ✓ đã báo cáo trong kỳ · ⚠ "thiếu" khi đầu bắt buộc chưa gửi quá 1 kỳ (theo tần suất, dựa trên "Loại báo cáo" của báo cáo dự án) · tùy chọn chỉ hiện lần gửi gần nhất.
- **Danh sách dự án**: card hiện giai đoạn hiện tại + ai báo cáo + tần suất; lọc thêm theo Loại dự án và Giai đoạn.
- Câu hỏi mở: phân quyền của Apps (Tùng – Hà – Hiếu) "chia đơn giản hơn theo logic phân quyền" — cần đối chiếu thêm với ma trận quyền xem ở bước 5.

## Rule
- PM bắt buộc. PM/UA/Creative = người viết báo cáo mảng Sản phẩm/Kinh doanh/Creative; mọi role = thành viên dự án; PM = quản trị.
- Đổi phân loại khi tạo mới → thay giai đoạn mẫu (Game/App khác sản phẩm nội bộ).
- Sửa dự án: tab "Quản lý dự án" → Chỉnh sửa (5 tab, cùng form). Thứ tự: Thông tin chung → Thành viên → OKR dự án → Giai đoạn & báo cáo → Slack & quyền xem.
- Bảng giai đoạn: header 2 tầng, nhóm "Ai phải báo cáo" gộp 3 cột Product / UA / Creative để nổi bật.

## Chưa làm / câu hỏi mở
- Áp ma trận quyền xem vào `canView` (hiện quyền theo thành viên dự án).
- Tự chọn "Loại báo cáo" trong editor theo giai đoạn + role người viết.
- Nhắc báo cáo (Slack / thông báo) khi một đầu bắt buộc bị "thiếu"; màn tổng hợp cho BU Head (gom tình trạng báo cáo của mọi dự án).
