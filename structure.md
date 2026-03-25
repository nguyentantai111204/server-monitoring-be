src/
├── common/                           # Tầng dùng chung (Shared Kernel)
│   ├── constants/                    # Enum: user-role.enum.ts, server-status.enum.ts
│   ├── decorators/                   # Custom Decorators: @GetUser.ts, @Public.ts
│   ├── dto/                          # DTO dùng chung: pagination.dto.ts
│   ├── filters/                      # http-exception.filter.ts (Chuẩn Error Handling)
│   ├── guards/                       # jwt-auth.guard.ts, roles.guard.ts
│   ├── interceptors/                 # transform.interceptor.ts (Chuẩn Response)
│   ├── interfaces/                   # api-response.interface.ts
│   └── pipes/                        # custom-validation.pipe.ts
│
├── config/                           # Tầng cấu hình (Configuration)
│   ├── app.config.ts                 # Cấu hình Port, Global Prefix
│   ├── database.config.ts            # Cấu hình TypeORM / PostgreSQL
│   ├── jwt.config.ts                 # Cấu hình Secret key & Expire time
│   └── index.ts                      # Load .env bằng @nestjs/config
│
├── modules/                          # Tầng nghiệp vụ (Domain Modules)
│   ├── auth/                         # --- Module Xác thực ---
│   │   ├── dto/                      # login.dto.ts, register.dto.ts
│   │   ├── strategies/               # jwt.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   │
│   ├── users/                        # --- Module Người dùng ---
│   │   ├── entities/                 # user.entity.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   │
│   ├── servers/                      # --- Module Quản lý Server ---
│   │   ├── entities/                 # server.entity.ts, assignment.entity.ts
│   │   ├── dto/                      # create-server.dto.ts, update-server.dto.ts
│   │   ├── servers.controller.ts
│   │   ├── servers.service.ts
│   │   └── servers.module.ts
│   │
│   ├── metrics/                      # --- Module Giám sát (CPU/RAM/Disk) ---
│   │   ├── entities/                 # metric.entity.ts
│   │   ├── dto/                      # push-metric.dto.ts
│   │   ├── metrics.controller.ts     # Endpoint cho Agent đẩy data
│   │   ├── metrics.service.ts
│   │   └── metrics.module.ts
│   │
│   └── commands/                     # --- Module Điều khiển (Agent Commands) ---
│       ├── entities/                 # command.entity.ts
│       ├── dto/                      # execute-command.dto.ts, command-result.dto.ts
│       ├── commands.controller.ts
│       ├── commands.service.ts       # Xử lý Logic hàng đợi lệnh
│       └── commands.module.ts
│
├── providers/                        # Tầng dịch vụ bên thứ 3 (Internal/External)
│   ├── telegram/                     # Bot thông báo qua Telegram
│   │   ├── telegram.service.ts
│   │   └── telegram.module.ts
│   └── redis/                        # Caching (nếu cần)
│
├── app.module.ts                     # Root Module (Nối Database & nạp Modules)
└── main.ts                           # File chạy chính (Cấu hình Swagger, Global Filter)