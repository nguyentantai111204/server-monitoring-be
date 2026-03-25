Tổng quan Hệ thống Cơ sở dữ liệu (Final Schema)
Dưới đây là 6 nhóm bảng cốt lõi giúp hệ thống vận hành trơn tru và bảo mật.

1. Nhóm Người dùng & Phiên đăng nhập (Identity & Sessions)
Nhóm này quản lý tài khoản admin và kiểm soát việc duy trì đăng nhập trên nhiều thiết bị.

users: Lưu thông tin người dùng.

id (UUID, PK)

username (Varchar, Unique)

password_hash (Text): Mật khẩu đã băm (Bcrypt).

full_name (Varchar)

role (Enum): ADMIN, OPERATOR, VIEWER.

created_at (Timestamp)

refresh_tokens: Quản lý phiên đăng nhập (tách riêng để bảo mật).

id (UUID, PK)

user_id (UUID, FK -> users.id)

token (Text): Mã refresh token (nên được băm).

expires_at (Timestamp)

is_revoked (Boolean): Dùng để đăng xuất từ xa hoặc thu hồi quyền.

user_agent (Text): Thông tin trình duyệt/thiết bị.

2. Nhóm Quản lý Server (Assets)
Lưu thông tin các máy Ubuntu mà người dùng đăng ký.

servers: Danh sách máy chủ.

id (UUID, PK)

owner_id (UUID, FK -> users.id): Quan trọng để xác định ai sở hữu server nào.

name (Varchar): Tên gợi nhớ (Ví dụ: "Server Web Do An").

ip_address (Varchar)

agent_token (UUID, Unique): Token riêng biệt để Agent xác thực với Backend.

status (Enum): ONLINE, OFFLINE, PENDING.

last_heartbeat (Timestamp): Cập nhật mỗi khi Agent gửi Metric.

3. Nhóm Giám sát (Monitoring)
Lưu trữ dữ liệu "sức khỏe" của máy chủ theo thời gian.

server_metrics: (Bảng này sẽ có dung lượng lớn nhất).

id (BigInt, PK)

server_id (UUID, FK -> servers.id)

cpu_usage (Float)

ram_usage (Float)

disk_usage (Float)

network_in/out (BigInt)

timestamp (Timestamp): Index cột này để vẽ biểu đồ nhanh hơn.

4. Nhóm Điều khiển (Command Queue)
Hàng đợi các lệnh từ Web gửi xuống Agent.

commands_queue: Lưu các yêu cầu điều khiển.

id (UUID, PK)

server_id (UUID, FK -> servers.id)

created_by (UUID, FK -> users.id)

command_type (Enum): RESTART_SERVICE, SHELL_CMD, UPDATE_AGENT.

payload (JSONB): Chứa tham số lệnh (Ví dụ: {"service": "nginx"}).

status (Enum): PENDING, PROCESSING, SUCCESS, FAILED.

result_log (Text): Lưu log trả về từ Agent sau khi thực hiện xong.

5. Nhóm Cảnh báo & Nhật ký (Alerts & Logs)
Theo dõi hành vi và thông báo sự cố.

alert_rules: Cấu hình ngưỡng báo động.

id (PK)

server_id (FK)

metric_type (CPU/RAM)

threshold (Vượt quá 90%...)

is_active (Boolean)

audit_logs: Nhật ký bảo mật (Ai đã làm gì).

id (BigInt, PK)

user_id (FK)

action (Varchar): "LOGIN", "RESTART_SERVER", "DELETE_USER".

description (Text)

timestamp (Timestamp)

💡 Tóm tắt quan hệ (ERD logic):
Một User có nhiều RefreshTokens (Đăng nhập nhiều máy).

Một User sở hữu nhiều Servers.

Một Server sinh ra nhiều Metrics (Mỗi 15s một bản ghi).

Một Server nhận nhiều Commands từ chủ sở hữu.