# Luồng tạo dự án

Cập nhật: 28/09/2026 · Prototype: `prototype-app/src/ProjectForm.tsx`, `project-config.ts`

## Nhu cầu → thiết kế
| Nhu cầu | Đáp ứng | Ở đâu |
|---|---|---|
| Loại dự án, nền tảng, BU/team, role PM/UA/Creative/Dev/QA | Bước 1: loại + phân loại, nền tảng, Product Manager, Đơn vị phụ trách, BU/Cen/Team phụ trách (2 dòng, team lọc theo đơn vị), Đơn vị phối hợp, UA phụ trách · Bước 2 "Thành viên": Creative / Dev / QA. Mọi vai trò chọn bằng ô tìm kiếm (tên / chức danh / team, không dấu) | Mới: nền tảng, Creative/Dev/QA |
| Tạo OKR cho dự án | Bước 3 "OKR dự án": mục tiêu + KR/KS kỳ hiện tại, không bắt buộc. Khi sửa: hiện OKR đã có, thêm được OKR mới | Mới |
| Start/End date, chạy xuyên H1/H2 | Bước 1: Bắt đầu + Kết thúc hoặc "Dài hạn". Dự án không gắn kỳ; mỗi kỳ chỉ tạo OKR mới | Mới |
| Link trực tiếp OKR/KR của BU/Team; milestone không bắt buộc | Bước 5: chọn KR team; Milestone là mục tùy chọn, mốc thành entity gắn được vào báo cáo | Mới |
| Luồng báo cáo khác nhau theo giai đoạn (Game/App) | Bước 4: giai đoạn mẫu Build → Soft launch → Global launch → Live ops; mỗi giai đoạn bật mảng báo cáo + tần suất; chọn giai đoạn hiện tại. Trang dự án hiện "Giai đoạn: … · Báo cáo …" | Mới |
| Viết trên iGoal, link Project/OKR/KR/Milestone, đẩy recap Slack | Đã có (editor + Xuất bản đa nơi). Bước 5 chỉ cấu hình kênh Slack của dự án | Đã có + cấu hình kênh |
| Quyền xem report theo nhóm | Bước 5: ma trận Mảng báo cáo × Nhóm (PM, UA, Creative, Dev, QA, BU Head, Vận hành). Mặc định Kinh doanh chỉ PM/UA/BU Head/Vận hành | Mới (prototype mới cấu hình, chưa áp vào quyền xem thật) |
| BU Head xem tổng hợp project/milestone/tiến độ/thiếu report | Ngoài luồng tạo dự án → màn riêng | Chưa làm |

## Rule
- PM bắt buộc. PM/UA/Creative = người viết báo cáo mảng Sản phẩm/Kinh doanh/Creative; mọi role = thành viên dự án; PM = quản trị.
- Đổi phân loại khi tạo mới → thay giai đoạn mẫu (Game/App khác sản phẩm nội bộ).
- Sửa dự án: tab "Quản lý dự án" → Chỉnh sửa (5 tab, cùng form). Thứ tự: Thông tin chung → Thành viên → OKR dự án → Giai đoạn & báo cáo → Liên kết & quyền xem.

## Chưa làm / câu hỏi mở
- Áp ma trận quyền xem vào `canView` (hiện quyền theo thành viên dự án).
- Tự chọn "Loại báo cáo" trong editor theo giai đoạn + role người viết.
- Nhắc báo cáo theo tần suất của giai đoạn; màn tổng hợp cho BU Head.
