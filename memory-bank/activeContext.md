# Active Context

## Current Status
- Finished Phase 2 — Auth + User + Gateway Services implementation.
- Solution builds cleanly (`dotnet build AIComputePlatform.sln` -> 0 errors, 0 warnings).

## Key Accomplishments
- **AuthService**:
  - Implemented `UserAuth` model & EF Core `AuthDbContext`.
  - Implemented `JwtTokenService` for token generation & refresh token rotation.
  - Implemented `AuthService` logic for `Register`, `Login`, `Refresh`, and `Logout` (with Redis token revocation).
  - Added FluentValidation request validators.
  - Built `AuthController` and configured DI in `Program.cs`.
- **UserService**:
  - Implemented `UserProfile` model & EF Core `UserDbContext`.
  - Implemented `UserService` profile CRUD (`GET /me`, `PUT /me`, `GET /{id}`).
  - Added internal profile creation endpoint (`POST /internal/create`) for `AuthService` integration.
  - Added internal wallet balance lookup to `PaymentService`.
  - Built `UsersController` and configured JWT Bearer authentication in `Program.cs`.
- **ApiGateway**:
  - Configured Ocelot routes (`/api/auth/*`, `/api/users/*`).
  - Configured CORS policies for frontend development origins (`http://localhost:3000`, `http://localhost:5173`).
