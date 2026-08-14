# Phase 2 Walkthrough — Auth + User + Gateway Services

Phase 2 implementation complete: AuthService, UserService, and ApiGateway fully built and compiled against .NET 9.

## Key Changes

### Auth Service (`backend/src/AuthService`)
- Added NuGet packages: `BCrypt.Net-Next`, `FluentValidation.AspNetCore`, `Npgsql.EntityFrameworkCore.PostgreSQL`, `StackExchange.Redis`, `Microsoft.AspNetCore.Authentication.JwtBearer`.
- Created [UserAuth.cs](file:///d:/GPU%20Compute%20Management%20Platform/backend/src/AuthService/Models/UserAuth.cs) entity model mapped to `users_auth` table in `auth_db`.
- Created [AuthDbContext.cs](file:///d:/GPU%20Compute%20Management%20Platform/backend/src/AuthService/Data/AuthDbContext.cs).
- Built [JwtTokenService.cs](file:///d:/GPU%20Compute%20Management%20Platform/backend/src/AuthService/Services/JwtTokenService.cs) supporting JWT access tokens (15m expiry, user claims) and refresh tokens (30d expiry).
- Built [AuthService.cs](file:///d:/GPU%20Compute%20Management%20Platform/backend/src/AuthService/Services/AuthService.cs) supporting:
  - `POST /api/auth/register`: BCrypt password hashing + profile auto-creation in `UserService`.
  - `POST /api/auth/login`: BCrypt verification + token generation.
  - `POST /api/auth/refresh`: Refresh token rotation.
  - `POST /api/auth/logout`: Revocation via Redis blacklist.
- Built [AuthController.cs](file:///d:/GPU%20Compute%20Management%20Platform/backend/src/AuthService/Controllers/AuthController.cs).

### User Service (`backend/src/UserService`)
- Created [UserProfile.cs](file:///d:/GPU%20Compute%20Management%20Platform/backend/src/UserService/Models/UserProfile.cs) entity model mapped to `user_profiles` table in `user_db`.
- Created [UserDbContext.cs](file:///d:/GPU%20Compute%20Management%20Platform/backend/src/UserService/Data/UserDbContext.cs).
- Built [UserService.cs](file:///d:/GPU%20Compute%20Management%20Platform/backend/src/UserService/Services/UserService.cs) supporting:
  - `GET /api/users/me`: Profile lookup + internal HTTP call to `PaymentService` for wallet balance.
  - `PUT /api/users/me`: Profile update (name, avatar).
  - `GET /api/users/{id}`: Profile lookup by ID.
  - `POST /api/users/internal/create`: Internal profile creation for `AuthService`.
- Built [UsersController.cs](file:///d:/GPU%20Compute%20Management%20Platform/backend/src/UserService/Controllers/UsersController.cs).

### API Gateway (`backend/src/ApiGateway`)
- Verified Ocelot route configurations for `/api/auth/*` -> `:5001` and `/api/users/*` -> `:5002`.
- Configured CORS policies for frontend origins (`http://localhost:3000`, `http://localhost:5173`).

---

## Verification Results

### Automated Build Verification
Ran `dotnet build backend/AIComputePlatform.sln`:
- **Result**: `Build succeeded. 0 Warning(s), 0 Error(s)`.
- All 9 projects in `AIComputePlatform.sln` compiled cleanly.
