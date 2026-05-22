# Cloud Advisor

Beginner-friendly full-stack web app that recommends the best cloud provider (AWS, Azure, GCP) based on a short questionnaire. Runs on **EC2 (PHP 8 + Apache)** and uses **Amazon RDS MySQL**.

## Features
- Landing page + questionnaire
- Recommendation engine that ranks AWS, Azure, and GCP
- Gemini API explanation (backend only) with fallback
- Saves all submissions in MySQL (RDS)
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
│  ├─ config.php
│  ├─ db.php
│  ├─ gemini.php
│  └─ scoring.php
├─ schema.sql
├─ .env.example
└─ README.md
```

## Local Setup (Optional)
1. Install PHP 8 and MySQL client.
2. Copy `.env.example` to `.env` and fill in your values.
3. Configure Apache to serve the `public/` folder as the document root.

## AWS Deployment Guide (EC2 + RDS MySQL)

### 1) Create the RDS MySQL database
1. Open **AWS Console → RDS → Create database**.
2. Choose **Standard create**, **MySQL**.
3. Use **Free tier** or **Dev/Test** for beginner setup.
4. Set DB instance identifier (e.g., `cloud-advisor-db`).
5. Set master username and password (save them).
6. Enable **Public access: No**.
7. VPC: default or your custom VPC.
8. Create a **new security group** for RDS, e.g., `rds-cloud-advisor-sg`.
9. Finish creation and wait for **Available** status.
10. Copy the **Endpoint** (host) from the RDS details page.

### 2) Create the EC2 instance
1. Open **AWS Console → EC2 → Launch instance**.
2. Choose **Amazon Linux 2023** (or Ubuntu 22.04) and **t2.micro**.
3. Create or use an SSH key pair.
4. Create a **new security group** for EC2, e.g., `ec2-cloud-advisor-sg`.
   - Inbound: allow **HTTP (80)** from `0.0.0.0/0`.
   - Inbound: allow **SSH (22)** from your IP.
5. Launch the instance.

### 3) Lock down RDS access to EC2 only
1. Go to **RDS → Databases → your DB → Connectivity & security**.
2. Edit the **RDS security group** inbound rules.
3. Allow **MySQL/Aurora (3306)** from the **EC2 security group** (not from the public internet).

### 4) Install Apache + PHP on EC2
SSH into EC2 and run:

- **Amazon Linux 2023**
  ```
  sudo dnf update -y
  sudo dnf install -y httpd php php-mysqlnd
  sudo systemctl enable httpd
  sudo systemctl start httpd
  ```

- **Ubuntu 22.04**
  ```
  sudo apt update
  sudo apt install -y apache2 php libapache2-mod-php php-mysql
  sudo systemctl enable apache2
  sudo systemctl start apache2
  ```

### 5) Upload project files
1. Zip the project locally.
2. Copy to EC2 (example):
   ```
   scp -i /path/to/key.pem -r cloud_advisor ec2-user@YOUR_EC2_PUBLIC_IP:/home/ec2-user/
   ```
3. Move contents into Apache root:
   ```
   sudo rm -rf /var/www/html/*
   sudo cp -r /home/ec2-user/cloud_advisor/public/* /var/www/html/
   sudo mkdir -p /var/www/cloud_advisor
   sudo cp -r /home/ec2-user/cloud_advisor/backend /var/www/cloud_advisor/
   sudo cp /home/ec2-user/cloud_advisor/.env /var/www/cloud_advisor/
   sudo chown -R apache:apache /var/www/html /var/www/cloud_advisor
   ```

4. Update `public/api/submit.php` include paths if needed (default works with `/var/www/cloud_advisor`).

### 6) Configure Apache to allow PHP outside web root
Edit Apache config and add an alias to backend if needed, or keep current includes:
- The API file is in `/var/www/html/api/submit.php` and references `/var/www/cloud_advisor/backend` and `/var/www/cloud_advisor/.env`.

### 7) Configure environment variables
1. Copy `.env.example` to `.env` and fill values:
   ```
   DB_HOST=your-rds-endpoint.amazonaws.com
   DB_NAME=cloud_advisor
   DB_USER=cloud_user
   DB_PASSWORD=your_password
   DB_PORT=3306
   GEMINI_API_KEY=your_key
   ```
2. Place `.env` at `/var/www/cloud_advisor/.env`.

### 8) Create database schema
Use the MySQL client on EC2 (or your local machine) to run:
```
mysql -h YOUR_RDS_ENDPOINT -u cloud_user -p cloud_advisor < schema.sql
```

### 9) Test the app
Visit `http://YOUR_EC2_PUBLIC_IP/` and complete the assessment.

## Notes
- All Gemini calls are server-side only.
- No API keys are exposed in the frontend.
- RDS access is restricted to the EC2 security group.
