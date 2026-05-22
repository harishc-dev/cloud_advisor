# Cloud Advisor

Beginner-friendly full-stack web app that recommends the best cloud provider (AWS, Azure, GCP) based on a short questionnaire. Runs on **Node.js (Express)** and uses **SQLite** for local storage.

## Features
- Landing page + questionnaire
- Recommendation engine that ranks AWS, Azure, and GCP
- Gemini API explanation (backend only) with fallback
- Saves all submissions in SQLite
- Secure input validation and prepared statements

## Folder Structure
```
cloud_advisor/
├─ public/
│  ├─ index.html
│  ├─ assessment.html
│  ├─ result.html
│  ├─ api/
│  │  └─ submit.php
│  └─ assets/
│     ├─ css/styles.css
│     └─ js/app.js
├─ backend/
│  ├─ config.js
│  ├─ db.js
│  ├─ gemini.js
│  └─ scoring.js
├─ schema.sql
├─ package.json
├─ server.js
└─ README.md
```

## Local Setup
1. Install Node.js 18+.
2. Install dependencies:
   - `npm install`
3. Start the server:
   - `npm start`
4. Open `http://localhost:3000`.

## AWS Deployment Guide (EC2)

### 1) Create the EC2 instance
1. Open **AWS Console → EC2 → Launch instance**.
2. Choose **Amazon Linux 2023** (or Ubuntu 22.04) and **t2.micro**.
3. Create or use an SSH key pair.
4. Create a **new security group** for EC2, e.g., `ec2-cloud-advisor-sg`.
   - Inbound: allow **HTTP (80)** from `0.0.0.0/0`.
   - Inbound: allow **SSH (22)** from your IP.
5. Launch the instance.

### 2) Install Node.js on EC2
SSH into EC2 and run:

- **Amazon Linux 2023**
   ```
   sudo dnf update -y
   sudo dnf install -y nodejs npm
   ```

- **Ubuntu 22.04**
   ```
   sudo apt update
   sudo apt install -y nodejs npm
   ```

### 3) Upload project files
1. Zip the project locally.
2. Copy to EC2 (example):
   ```
   scp -i /path/to/key.pem -r cloud_advisor ec2-user@YOUR_EC2_PUBLIC_IP:/home/ec2-user/
   ```
3. Install dependencies and start:
   ```
   cd /home/ec2-user/cloud_advisor
   npm install
   npm start
   ```

### 4) Test the app
Visit `http://YOUR_EC2_PUBLIC_IP:3000/` and complete the assessment.

## Notes
- All Gemini calls are server-side only.
- No API keys are exposed in the frontend.
- SQLite database file is created automatically in `data/cloud_advisor.sqlite`.
