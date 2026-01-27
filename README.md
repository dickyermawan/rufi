<div align="center">
  <a href="https://github.com/dickyermawan/rufi">
    <img src="public/icon.svg" alt="Rufi Logo" width="120" height="120">
  </a>

  <h1 align="center">Rufi - S3 File Manager</h1>

  <p align="center">
    <strong>Modern • Fast • Multi-Provider</strong>
  </p>

  <p align="center">
    A beautiful, high-performance S3 file manager built for speed and usability.<br />
    Manage your Cloudflare R2, AWS S3, and MinIO buckets with granular control.
  </p>

  <p align="center">
    <a href="https://hub.docker.com/r/dickyermawan/rufi">
      <img src="https://img.shields.io/docker/v/dickyermawan/rufi?style=flat-square&color=blue&label=Docker%20Image" alt="Docker Version" />
    </a>
    <a href="https://github.com/dickyermawan/rufi/blob/master/LICENSE">
      <img src="https://img.shields.io/github/license/dickyermawan/rufi?style=flat-square&color=green" alt="License" />
    </a>
    <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Prisma-ORM-teal?style=flat-square&logo=prisma" alt="Prisma" />
  </p>
</div>

---

## 📸 Screenshots

| Desktop View (Grid) | Mobile View (List) |
|:---:|:---:|
| <img src="https://placehold.co/800x500/e0e0e0/333333?text=Desktop+File+Manager" alt="Desktop View" width="100%"> | <img src="https://placehold.co/300x600/e0e0e0/333333?text=Mobile+View" alt="Mobile View" width="100%"> |

> *Experience a responsive design that adapts perfectly to any device.*

---

## ✨ Key Features

<table>
  <tr>
    <td width="50%">
      <h3>🚀 Powerful Core</h3>
      <ul>
        <li><strong>Multi-provider</strong>: Cloudflare R2, AWS S3, MinIO support.</li>
        <li><strong>Full Operations</strong>: Upload, download, delete, rename, copy/move.</li>
        <li><strong>Smart Search</strong>: Instant prefix search within folders.</li>
        <li><strong>Pagination</strong>: Handle folders with thousands of files effortlessly.</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🎨 Modern UX</h3>
      <ul>
        <li><strong>Drag & Drop</strong>: Full-screen drop zone for uploads.</li>
        <li><strong>File Previews</strong>: Native preview for Images, Video, Audio, PDF.</li>
        <li><strong>Code Editor</strong>: Edit text/code directly in browser.</li>
        <li><strong>Dark Mode</strong>: Easy on the eyes with auto-switching theme.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <h3>🛡️ Enterprise-Grade Management</h3>
      <ul>
        <li><strong>Granular Permissions</strong>: 9 distinct permission levels per user per bucket.</li>
        <li><strong>Home Directories</strong>: Isolate users to specific folders.</li>
        <li><strong>Secure Sharing</strong>: Public links with password & expiry protection.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🐳 Quick Start (Docker)

Get up and running in seconds with our official Docker image.

### 1. Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  rufi:
    image: dickyermawan/rufi:v1.0.0
    container_name: rufi
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/rufi.db
      - APP_URL=http://localhost:3000
      - JWT_SECRET=change_this_to_secure_random_string
      - ENCRYPTION_KEY=change_this_to_32_chars_exactly!!!
      - ROOT_USERNAME=admin
      - ROOT_PASSWORD=admin123
    restart: unless-stopped
```

### 2. Launch

```bash
docker-compose up -d
```

Visit **http://localhost:3000** and login with `admin` / `admin123`.

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|:--------:|
| `JWT_SECRET` | Secret for session tokens | ✅ |
| `ENCRYPTION_KEY` | 32-char key for S3 credentials | ✅ |
| `ROOT_USERNAME` | Admin username (default: admin) | ❌ |
| `ROOT_PASSWORD` | Admin password (default: admin123) | ❌ |
| `DATABASE_URL` | SQLite path (default: file:/app/data/rufi.db) | ❌ |

---

## 🛠️ Development

<details>
<summary>Click to expand development instructions</summary>

1. **Clone & Install**
   ```bash
   git clone https://github.com/dickyermawan/rufi.git
   cd rufi
   npm install
   ```

2. **Setup Env**
   ```bash
   cp .env.example .env
   ```

3. **Database**
   ```bash
   npx prisma migrate deploy
   ```

4. **Run**
   ```bash
   npm run dev
   ```
</details>

---

## 📈 Star History

<a href="https://star-history.com/#dickyermawan/rufi&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=dickyermawan/rufi&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=dickyermawan/rufi&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=dickyermawan/rufi&type=Date" />
 </picture>
</a>

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <br />
  Made with ❤️ by <a href="https://github.com/dickyermawan">Dicky Ermawan S.</a>
</div>
