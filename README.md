# Web GitHub Pages – Auto Comment Phòng Trọ

Thư mục này là phần web điều khiển, tách hoàn toàn khỏi Chrome Extension.

## Đưa lên GitHub Pages

1. Tạo một repository GitHub mới.
2. Đưa toàn bộ file trong thư mục `web-github` lên thư mục gốc của repository.
3. Bật GitHub Pages cho nhánh chứa các file này.
4. Mở URL dạng `https://TEN-TAI-KHOAN.github.io/TEN-REPOSITORY/`.
5. Cài phần Extension và tải lại trang web.

## File cần có trên GitHub

- `index.html`
- `app.js`
- `.nojekyll`

## Cơ chế mới

- Web gửi lệnh sang Extension bằng cầu nối `window.postMessage`.
- Extension thực hiện quét Facebook, mở bài viết và gửi bình luận kèm ảnh.
- Khi GitHub Pages bị CORS, API đọc bài và API AI tự chuyển qua Extension.
- Link được thêm vào `Link đã quét ở nhóm` ngay sau khi đọc thành công nội dung bài viết.
- Các lần quét sau tự loại toàn bộ link đã có trong danh sách này.
- Nút `Xoá danh sách đã quét` cho phép quét lại từ đầu.

## Dữ liệu lưu ở đâu

API key, thiết lập, kho mẫu, ảnh mẫu và link đã quét được lưu trong trình duyệt theo đúng URL GitHub Pages. Không đổi URL repository nếu muốn giữ nguyên dữ liệu đã lưu.
