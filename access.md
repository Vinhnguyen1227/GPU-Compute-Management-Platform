🔑 1. Pre-Seeded Accounts:


👑 Super Admin Account:
Email: admin@dgx-compute.io
Password: Admin@2026!
Role: ADMIN
👤 Regular User Account:
Email: developer@ai-cloud.io
Password: User@2026!
Role: USER



🛡️ 2. Role & Access Matrix (RBAC):
Role	Access Level	Permissions
USER (Developer)	Customer	Create own projects, submit jobs up to wallet balance, top up via VietQR / PayOS. Cannot see Admin Console.
ENGINEER (Operator)	Tech Operator	Same as User + access to GPU telemetry & node drainage.
ADMIN (Super Admin)	👑 Full Power	Access Admin Console to manage everything!
⚡ 3. Functions in New 4-Tab Admin Console:
🖥️ Node Governance & Pricing:
Live hardware status (Temperature, VRAM, GPU Load).
Set node Maintenance mode.
Update GPU Hourly Pricing in VND (change H100, A100, RTX 4090 rates).
👥 User Management:
List all users with balances and join dates.
Change user roles (USER $\leftrightarrow$ ENGINEER $\leftrightarrow$ ADMIN).
Add manual wallet credit (+ / -) (for promo bonus or manual refund).
Ban / Unban accounts.
⚡ Global Job Inspector:
View all jobs running across the entire cluster from all users.
Force Kill button to terminate runaway jobs.
💰 Platform Revenue Analytics:
Total Platform Revenue Deposited (VND).
Total GPU compute hours billed.
Payment method breakdown (VietQR / VNPay / MoMo).
📝 4. Login & Register Features:
Register Tab: Name, Email, Password, Confirm Password, with password validation and initial welcome bonus balance.
Login Tab: Email, Password with quick-fill "🔑 Đăng nhập Admin" and "👤 Đăng nhập User" for instant 1-click testing.
Persistent Session: Remembers login across browser refreshes.