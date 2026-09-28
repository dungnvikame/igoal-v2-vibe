# Editor báo cáo tuần

Cập nhật: 28/09/2026 · Prototype: `prototype-app/src/Weekly.tsx`, `SlashMenu.tsx`

## Cấu trúc trang
1. **Liên kết**: mặc định trống. Hệ thống không tự gắn EKS / dự án; chỉ gợi ý (dòng "Gợi ý từ nguồn đã dùng") và người dùng bấm mới thêm.
2. **Báo cáo chung**: viết tự do, không chia mục, không cần "/".
3. **Khung Báo cáo dự án** (0..n): 3 mục Kết quả / Khó khăn (không bắt buộc) / Kế hoạch tuần tới. Bản xuất bản ở dự án chỉ lấy nội dung khung đó.

## Lệnh "/"
- Chỉ trong phần viết tự do, gõ ở đầu dòng.
- Menu giữ lệnh editor: **Style** (Text, Heading 1–4, Bullet, Numbered, To-do, Blockquote, Code) · **Insert** (Divider, Table) · **Báo cáo dự án** ở dưới cùng (chỉ dự án user có quyền viết, chưa có khung).
- Không có "Báo cáo chung" trong menu. Trong khung dự án không có "/" (không lồng khung).
- Prototype dùng textarea: định dạng là tiền tố kiểu markdown. Bản thật: rich text editor hiện tại + thêm nhóm "Báo cáo dự án".


## Panel "Lấy từ báo cáo"
- Chỉ hiện báo cáo của các dự án (member) / của team (PM). Không hiện báo cáo tuần trước của chính mình (xem ở panel "Báo cáo cũ") và bản sao báo cáo của mình đã xuất bản sang dự án.
- Bộ lọc: ô tìm + Dự án · Loại báo cáo · Người viết (chỉ hiện bộ lọc có ≥ 2 giá trị), đếm "n/N báo cáo", Xóa lọc. Dùng chung cho báo cáo tuần, tức thời, check-in.
- Nhóm dòng theo loại nội dung (Kết quả / Khó khăn / Kế hoạch); có dòng "Chèn vào: …" cho biết đích: khung dự án tương ứng nếu có, không thì báo cáo chung.

