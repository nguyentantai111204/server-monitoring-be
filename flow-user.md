Dưới đây là Flow hoàn chỉnh của người dùng trên Web Dashboard:

1. Giai đoạn: Thiết lập tài khoản & Bảo mật
Đây là bước đầu tiên để người dùng làm chủ hệ thống.

Đăng ký/Đăng nhập: Người dùng truy cập Web, thực hiện Login để nhận Access Token (lưu trong memory) và Refresh Token (lưu trong HttpOnly Cookie).

Quản lý phiên (Session): Người dùng vào mục "Tài khoản" để xem danh sách các thiết bị đang đăng nhập. Nếu thấy thiết bị lạ, người dùng có thể nhấn "Revoke" (thu hồi) để xóa Refresh Token đó khỏi DB, bắt buộc thiết bị đó phải đăng nhập lại.

2. Giai đoạn: Đăng ký & Kích hoạt Server (Provisioning)
Đây là luồng quan trọng nhất để kết nối máy chủ Ubuntu vào hệ thống.

Thêm Server: Người dùng nhấn "Add New Server" -> Nhập tên gợi nhớ (ví dụ: Web-Server-01) và IP.

Nhận Script: Backend sinh ra một agent_token (UUID) gắn với ownerId của người dùng. Web sẽ hiển thị một câu lệnh curl duy nhất (One-liner script).

Cài đặt: Người dùng SSH vào máy Ubuntu (lần duy nhất), dán lệnh curl và chạy.

Xác nhận: Agent cài đặt xong sẽ gửi tín hiệu "Heartbeat" đầu tiên kèm Token. Web Dashboard chuyển trạng thái server từ Pending sang Online.

3. Giai đoạn: Giám sát & Theo dõi (Monitoring)
Luồng này diễn ra tự động, người dùng đóng vai trò là người quan sát.

Xem Tổng quan (Overview): Người dùng xem danh sách tất cả Server mình sở hữu, biết con nào đang sống, con nào chết (Offline).

Xem Chi tiết (Detail): Click vào một Server cụ thể để xem biểu đồ tài nguyên (CPU, RAM, Disk) được cập nhật liên tục (Real-time).

Cấu hình Cảnh báo (Alerting): Người dùng thiết lập quy tắc: "Nếu CPU > 90% trong 2 phút, gửi tin nhắn Telegram".

4. Giai đoạn: Điều khiển & Quản trị (Management)
Đây là lúc người dùng thực hiện quyền "toàn quyền" của mình.

Điều khiển Dịch vụ: Người dùng vào tab "Services", thấy danh sách các dịch vụ đang chạy (Nginx, MySQL...). Nhấn nút Restart -> Lệnh được đẩy vào commands_queue.

Xử lý Tiến trình: Nếu thấy RAM đầy, người dùng vào tab "Processes", tìm tiến trình chiếm nhiều tài nguyên nhất và nhấn Kill.

Kiểm tra Nhật ký (Audit Logs): Người dùng vào mục "Audit Logs" để xem lại lịch sử các lệnh mình đã ra, xem nó thành công hay thất bại và Log chi tiết từ Agent trả về là gì.

5. Tóm tắt các trạng thái của Server trong Flow
Để Web xử lý mượt mà, bạn cần quản lý các trạng thái sau:

PENDING: Server mới tạo trên Web, chưa cài Agent.

ONLINE: Agent đang gửi Metric đều đặn (Heartbeat < 30s).

OFFLINE: Đã quá 1 phút không nhận được dữ liệu từ Agent.

MAINTENANCE: Người dùng tạm thời tắt giám sát để bảo trì máy chủ.