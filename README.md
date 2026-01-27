# Rufi - S3 File Manager

A modern, multi-provider S3 file manager with user management and granular permissions.

## Features

- **Multi-provider S3 Support**: Cloudflare R2, AWS S3, MinIO, and any S3-compatible storage
- **File Operations**: List, upload, download, delete, rename, copy, create folders
- **Text Editor**: Edit text files directly in the browser with syntax highlighting
- **File Preview**: Preview images, videos, audio, PDFs, and text files
- **User Management**: Create users with custom permissions per bucket
- **Granular Permissions**: 9 different permission types per user per bucket
- **Home Directory**: Restrict users to specific directories within buckets
- **Public Sharing**: Generate shareable links with optional password and expiry
- **Multi-language**: English and Indonesian (easily extensible)
- **Dark Mode**: Toggle between light and dark themes
- **Docker Ready**: Easy deployment with Docker Compose

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **UI**: Adobe React Spectrum
- **Backend**: Next.js API Routes
- **Database**: SQLite (via Prisma ORM)
- **Authentication**: JWT with httpOnly cookies
- **S3 Client**: AWS SDK v3

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/rufi.git
cd rufi
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Initialize database:
```bash
npx prisma migrate deploy
npx prisma generate
```

5. Start development server:
```bash
npm run dev
```

6. Open http://localhost:3000 and login with the root credentials from `.env`

### Docker Deployment

1. Configure environment:
```bash
cp .env.example .env
# Edit .env with your production settings
```

2. Build and run:
```bash
docker-compose up -d
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `APP_URL` | Application URL | `http://localhost:3000` |
| `JWT_SECRET` | Secret for JWT tokens | (required) |
| `ENCRYPTION_KEY` | Key for encrypting S3 secrets | (required) |
| `ROOT_USERNAME` | Initial admin username | `admin` |
| `ROOT_PASSWORD` | Initial admin password | `admin123` |
| `DATABASE_URL` | SQLite database path | `file:./data/rufi.db` |

### Adding S3 Providers

After logging in as root:

1. Go to **Buckets** in the sidebar
2. Click **Add Bucket**
3. Enter your S3 provider details:
   - **Cloudflare R2**: `https://<account-id>.r2.cloudflarestorage.com`
   - **AWS S3**: `https://s3.<region>.amazonaws.com`
   - **MinIO**: `http://localhost:9000`
4. Test connection and save

### User Permissions

Each user can have different permissions per bucket:

| Permission | Description |
|------------|-------------|
| List | View files and folders |
| Upload | Upload new files |
| Download | Download files |
| Delete | Delete files and folders |
| Rename | Rename and move files |
| Copy | Copy files |
| Create Folder | Create new folders |
| Edit | Edit text files |
| Share | Create public share links |

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Files
- `GET /api/files` - List files
- `DELETE /api/files` - Delete files
- `POST /api/files/folder` - Create folder
- `POST /api/files/upload-url` - Get presigned upload URL
- `GET /api/files/download-url` - Get presigned download URL
- `GET /api/files/content` - Get file content (text)
- `PUT /api/files/content` - Save file content
- `POST /api/files/rename` - Rename file
- `POST /api/files/copy` - Copy file

### Users (Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users` - Update user
- `DELETE /api/users` - Delete user
- `GET /api/users/access` - Get user bucket access
- `POST /api/users/access` - Set user bucket access

### Buckets (Admin only)
- `GET /api/buckets` - List buckets
- `POST /api/buckets` - Create bucket
- `PUT /api/buckets` - Update bucket
- `DELETE /api/buckets` - Delete bucket
- `POST /api/buckets/test` - Test bucket connection

### Sharing
- `GET /api/share` - List user's shared links
- `POST /api/share` - Create shared link
- `DELETE /api/share` - Delete shared link
- `GET /api/share/[token]` - Access shared file

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Run Prisma Studio (database browser)
npx prisma studio

# Generate Prisma client after schema changes
npx prisma generate

# Create migration after schema changes
npx prisma migrate dev --name <migration-name>
```

## License

MIT
