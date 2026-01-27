# Rufi - S3 File Manager ☁️

A modern, high-performance, multi-provider S3 file manager designed for speed and usability. Built with **Next.js**, **React Spectrum**, and **Prisma**.

Rufi provides a beautiful, responsive interface to manage your S3 buckets (Cloudflare R2, AWS S3, MinIO) with granular user permissions, file previews, and advanced management features.

---

## ✨ Features

### 🚀 Core Capabilities
- **Multi-provider Support**: Connect seamlessly with Cloudflare R2, AWS S3, MinIO, and any S3-compatible storage.
- **Full File Operations**: Upload, download, list, delete, rename, copy/move files and folders.
- **Drag & Drop Upload**: Upload files and folders effortlessly by dragging them onto the interface. Includes progress tracking.
- **Smart Search**: Quickly find files in the current folder with prefix search (supports debounce).
- **Pagination**: Efficiently browse folders with thousands of files using "Load More" functionality.

### 🎨 User Interface & Experience
- **Responsive Design**: Fully optimized for Desktop, Tablet, and Mobile devices.
- **View Modes**: Switch between Grid and List views (persisted in local storage).
- **File Previews**: Built-in preview for Images, Videos, Audio, PDF, and Text files.
- **Code Editor**: Edit text/code files directly in the browser with syntax highlighting.
- **Dark Mode**: Automatic or manual toggle for Dark/Light theme.

### 🛡️ Security & Management
- **User Management**: Create multiple users with role-based access.
- **Granular Permissions**: 9 distinct permission levels per bucket (List, Upload, Delete, Share, etc.).
- **Home Directories**: Restrict users to specific folders within a bucket.
- **Public Sharing**: Generate secure public links with optional password protection and expiration dates.

---

## 🐳 Quick Start with Docker

The easiest way to run Rufi is using Docker. We provide a pre-built image on Docker Hub.

### Prerequisites
- Docker and Docker Compose installed on your machine.

### Deployment Steps

1. **Create a `docker-compose.yml` file:**

```yaml
version: '3.8'

services:
  rufi:
    image: dickyermawan/rufi:v1.0.0
    container_name: rufi
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data  # Persist database
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/rufi.db
      - APP_URL=http://localhost:3000
      - JWT_SECRET=change_this_to_a_secure_random_string
      - ENCRYPTION_KEY=change_this_to_exactly_32_characters_long
      - ROOT_USERNAME=admin
      - ROOT_PASSWORD=admin123
    restart: unless-stopped
```

2. **Start the application:**

```bash
docker-compose up -d
```

3. **Access Rufi:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.
   Login with the credentials defined in `ROOT_USERNAME` and `ROOT_PASSWORD`.

---

## 🛠️ Manual Installation

If you prefer to run it without Docker:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dickyermawan/rufi.git
   cd rufi
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Copy `.env.example` to `.env` and update the values.
   ```bash
   cp .env.example .env
   ```

4. **Initialize Database:**
   ```bash
   npx prisma migrate deploy
   ```

5. **Run Development Server:**
   ```bash
   npm run dev
   ```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|:--------:|
| `NODE_ENV` | Environment mode (development/production) | `development` | No |
| `APP_URL` | Base URL of the application | `http://localhost:3000` | No |
| `JWT_SECRET` | Secret key for signing session tokens | - | **Yes** |
| `ENCRYPTION_KEY` | 32-char key for encrypting S3 credentials | - | **Yes** |
| `ROOT_USERNAME` | Initial Administrator Username | `admin` | No |
| `ROOT_PASSWORD` | Initial Administrator Password | `admin123` | No |
| `DATABASE_URL` | Database connection string (SQLite) | `file:./data/rufi.db` | No |

### Adding Buckets (S3 Providers)

1. Log in as **Admin**.
2. Navigate to **Buckets** sidebar menu.
3. Click **Add Bucket** (+).
4. Fill in your S3 details:
   - **Name**: Display name for the bucket.
   - **Endpoint**: 
     - R2: `https://<account_id>.r2.cloudflarestorage.com`
     - AWS: `https://s3.<region>.amazonaws.com`
   - **Access Key & Secret Key**: Your S3 credentials.
   - **Region**: e.g., `auto`, `us-east-1`.
5. Click **Test Connection** to verify, then **Create**.

---

## 📖 User Guide

### File Management
- **Navigation**: Click folders to navigate. Use breadcrumbs to go back.
- **Search**: Type in the search bar at the top to filter files in the current folder.
- **Upload**: Drag files anywhere onto the screen or use the **Upload** button.
- **Bulk Actions**: Select multiple files (checkbox or Ctrl+Click) to **Delete** or **Download** in bulk.

### Sharing
- Right-click any file and select **Share**.
- Set an optional **Password** or **Expiration Time**.
- Copy the link and send it to anyone!

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
