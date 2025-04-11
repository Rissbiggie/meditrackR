# Running MediTrack on Your Computer

To run the MediTrack application on your local computer, you'll need the following software and complete these steps:

## Required Software
- Node.js (v16 or newer) - The JavaScript runtime that powers the application
- npm (Node Package Manager) - Comes with Node.js installation
- PostgreSQL Database (v13 or newer) - For storing application data
- Git - For cloning the repository (optional, but recommended)

## Step-by-Step Setup Guide

### 1. Install Required Software
- **Node.js & npm**: Download and install from [nodejs.org](https://nodejs.org)
- **PostgreSQL**:
  - Download from [postgresql.org](https://postgresql.org)
  - During installation, note your password and port (default is 5432)

### 2. Clone the Repository
```bash
git clone https://github.com/yourusername/meditrack.git
cd meditrack
```

### 3. Configure Database
Create a PostgreSQL database for the application:

```bash
psql -U postgres
CREATE DATABASE meditrack;
\q
```

### 4. Set Environment Variables
Create a `.env` file in the project root with the following content:

```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/meditrack
SESSION_SECRET=your_secret_key_here
```
Replace `yourpassword` with your PostgreSQL password.

### 5. Install Dependencies
```bash
npm install
```

### 6. Push Database Schema
```bash
node db-push.js
```
This will create all the necessary tables in your PostgreSQL database using Drizzle ORM.

You can verify the database connection and schema using:
```bash
node test-db.js
```
This will show you the PostgreSQL version and list all existing tables.

### 7. Start the Application
```bash
npm run dev
```
This will start the application on http://localhost:3000

## Accessing the Application
Open your browser and navigate to:

http://localhost:3000

You should see the MediTrack login page. You can either:
- Register a new account
- Use one of the demo accounts (if they've been created)

## Features
- **Real-time emergency tracking**: One-tap emergency assistance with precise location data
- **Medical facility locator**: Find nearby medical facilities with navigation support
- **Personal medical profile**: Store vital medical information for emergencies
- **Emergency contacts management**: Add and manage emergency contacts
- **Admin dashboard**: For emergency response teams to monitor and respond to requests

## Troubleshooting
- If you encounter database connection issues, verify your PostgreSQL service is running and check the DATABASE_URL in your `.env` file
- If the application doesn't start, check that port 3000 is not being used by another application
- For any Node.js errors, ensure you're using a compatible version (16+)

## System Requirements
- OS: Windows 10/11, macOS, or Linux
- RAM: 4GB minimum, 8GB recommended
- Storage: At least 1GB of free disk space
- Processor: Any modern multi-core processor (2015 or newer)
- Internet connectivity: Required for map functionality and emergency notifications