# Student Attendance System (SAS)

A modern, full-stack attendance management system with automated defaulter tracking and detailed analytics.

## 🚀 Key Features

-   **Admin Dashboard**: Overview of total students, working days, and average attendance.
-   **Attendance Tracking**: Subject-wise and date-specific attendance marking for students.
-   **Defaulter Management**: 
    -   Automatic flagging of students below 75% attendance.
    -   **Filtering by Date Range**: View defaulters for specific periods.
    -   **Aggregated View**: Students who fail in even a single subject are listed once with their overall status highlighted.
-   **Data Exports**: Download defaulter lists in **PDF** and **CSV** formats.
-   **User Roles**: Separate interfaces for Admin and Students.

## 🛠️ Technology Stack

-   **Frontend**: React, Vite, Chart.js, React-Icons, Axios.
-   **Backend**: Node.js, Express, MongoDB, Mongoose.
-   **Authentication**: JWT-based role-based access control.

## 💻 Setup Instructions

### 1. Prerequisites
-   Node.js installed.
-   MongoDB running locally on `mongodb://localhost:27017/school_management`.

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```
*Make sure your `.env` file is configured correctly.*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📖 How to Use

1.  **Register**: Create an initial Admin account through the login page.
2.  **Add Students**: Use the "Manage Students" tab to add students to the database.
3.  **Mark Attendance**: Select a subject and date to mark student presence.
4.  **Check Defaulters**: Visit the "Defaulters" page to see who is below 75%. Use the date filter (From/To) to narrow down the statistics.
