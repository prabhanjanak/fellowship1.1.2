# Fellowship Examination & Admission Portal (v6)

A professional, end-to-end management system for Fellowship programs, specifically tailored for the **Sankara Academy of Vision**.

## 🚀 Overview
This portal handles the entire lifecycle of fellowship admissions:
- **Application Portal**: Multi-step forms with document uploads and Razorpay integration.
* **Admin Dashboard**: Real-time stats and management of candidates, programs, and units.
* **Examination System**: Online entrance exams with automated scoring.
* **Interview Management**: Live panel queue tracking (Waiting Hall TV Display).
* **Seat Allocation**: Smart merit-based allocation system with seat matrix tracking.
* **Communication**: Automated email triggers for call letters and admission offers.

## 🛠️ Technology Stack
- **Frontend**: React (Vite), TailwindCSS, Lucide Icons, Recharts, Mammoth.js (for .docx).
- **Backend**: Node.js (Express), TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **State Management**: React Query (TanStack).

## 📦 Project Structure
- `/artifacts/fellowship-exam`: The main frontend React application.
- `/artifacts/api-server`: The backend Express API service.
- `/lib/db`: Shared database schema and Drizzle configurations.
- `/artifacts/fellowship_data_export.sql`: **Current Database State (Schema + Data)**.

## ⚙️ Deployment Instructions (For Seniors)

### 1. Database Setup
1. Create a new PostgreSQL database (e.g., `fellowship_db`).
2. Import the provided SQL dump to restore the exact current state:
   ```bash
   psql -U postgres -d fellowship_db -f artifacts/fellowship_data_export.sql
   ```

### 2. Backend Configuration
1. Navigate to `artifacts/api-server`.
2. Create/edit `.env` file with your server details:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/fellowship_db
   PORT=5000
   JWT_SECRET=your_secret_key
   ```
3. Run `npm install` and `npm start` (or use PM2).

### 3. Frontend Configuration
1. Navigate to `artifacts/fellowship-exam`.
2. Edit `.env` to point to your API URL:
   ```env
   VITE_API_URL=http://your-server-ip:5000/api
   ```
3. Run `npm install` and `npm run build`. Serve the `dist` folder using Nginx.

## 📧 Email Settings
Once deployed, log in as `super_admin` and navigate to **Email Settings** to configure your SMTP host and automated admission triggers.

## 📺 Waiting Hall TV Display
The live interview queue can be accessed publicly at the `/tv` route (e.g., `https://your-portal.com/tv`).

---
**Developed for July 2026 Batch.**