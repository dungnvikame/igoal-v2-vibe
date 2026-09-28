# Liên kết EKS cá nhân → mục tiêu team

Cập nhật: 28/09/2026 · Prototype: `prototype-app/src/Alignment.tsx`

## Vấn đề
- Báo cáo tuần cá nhân cần biết đang phục vụ mục tiêu nào.
- Nếu popover "Liên kết" cho gắn mọi loại mục tiêu (OKR team, KR/KS dự án, Mốc, EKS) thì sẽ phát sinh câu hỏi "có gắn thẳng OKR team không?", danh sách dài và trùng ý.
- Thực tế EKS đã được thiết lập để đóng góp cho OKR team, nên gắn lại OKR team ở từng báo cáo là thừa.

## Phương án đã cân nhắc
| Phương án | Ưu | Nhược |
|---|---|---|
| A. Báo cáo gắn thẳng OKR team | Đơn giản về dữ liệu | Lặp lại mỗi tuần, dễ gắn sai, popover rối |
| B. **EKS liên kết lên KR team một lần; báo cáo chỉ gắn EKS + mục tiêu dự án** (chọn) | Thiết lập 1 lần/kỳ, báo cáo tự "kế thừa" liên kết team, popover gọn | Cần màn thiết lập EKS (phase sau) |
| C. AI tự suy luận EKS → KR team | Không cần thao tác | Khó giải thích, không kiểm soát được |

## Rule (prototype)
1. Liên kết EKS → mục tiêu team thiết lập ở **My EKS**, ngay dưới mỗi EKS ("Đóng góp cho mục tiêu team" → chọn KR). Chỉ chọn ở cấp KR, không chọn Objective.
2. Báo cáo cá nhân chỉ gắn được: **EKS cá nhân** và **mục tiêu dự án** (Dự án / Objective / KR / KS). Không gắn Mốc, không gắn thẳng OKR team.
3. Editor báo cáo tuần hiển thị dòng **"Đóng góp cho"**: mỗi EKS đang gắn → các KR team nó đóng góp (chỉ đọc).
4. Popover Liên kết hiện gợi ý dưới mỗi EKS: "→ KR1, KR3 · Team Technology".

Dữ liệu: `Data.alignments: Record<eksId, teamGoalId[]>`, Team OKR mock ở `teamGoals` (`model.ts`).

## Phase tiếp theo (module Thiết lập & liên kết mục tiêu)
- Liên kết EKS → OKR team nên nằm trong luồng **tạo / sửa EKS** (bắt buộc hoặc khuyến nghị chọn KR team khi tạo EKS), không chỉ trên card My EKS.
- Quản lý duyệt liên kết khi duyệt EKS đầu kỳ.
- Trang Team OKR hiển thị ngược: mỗi KR team ← các EKS đóng góp ← báo cáo tuần gắn các EKS đó.
- Cân nhắc trọng số đóng góp (EKS đóng góp bao nhiêu % vào KR team).
