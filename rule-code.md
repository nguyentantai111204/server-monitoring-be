AI Agent Rules:

Architecture: Tuân thủ NestJS Modular Architecture. Entity nằm trong thư mục entities/ của từng module.

Base Class: Tất cả Entity mới phải extends BaseEntity.

Response: Không được trả về dữ liệu thô. Tất cả Controller phải sử dụng TransformInterceptor.

Error: Sử dụng HttpException chuẩn của NestJS; không dùng try-catch tùy tiện ở Controller (để GlobalExceptionFilter xử lý).

Validation: Mọi Request DTO phải có class-validator decorators.

Naming: Class theo PascalCase, tên file/folder theo kebab-case, tên bảng database theo snake_case.