# Docker Deployment Guide

This guide explains how to deploy your Web3 Wallet application using Docker and Docker Compose.

## Services

- **Backend**: Express.js API server (Node.js)
- **Frontend**: React web application (Nginx)
- **Database**: PostgreSQL

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)
- Git

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Mini-Web3-Wallet-and-Payment
```

### 2. Configure Environment Variables

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Edit `.env` with your production values:

```env
# Database
DB_USER=your_db_user
DB_PASSWORD=your_secure_db_password

# Blockchain
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=0xyour_private_key

# Smart Contracts
PAYMENT_VAULT_ADDRESS=0x...
SIMPLE_TOKEN_ADDRESS=0x...

# Security
JWT_SECRET=your_random_secret_key
ENCRYPTION_KEY=your_random_encryption_key

# Frontend
REACT_APP_API_URL=https://your-domain.com/api  # Use your domain in production
```

### 3. Build and Start Services

**Build images** (first time or after code changes):

```bash
docker-compose build
```

**Start all services**:

```bash
docker-compose up -d
```

**View logs**:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

**Stop services**:

```bash
docker-compose down
```

**Stop services and remove data**:

```bash
docker-compose down -v
```

## Service Details

### Backend API
- **Container**: wallet_backend
- **Port**: 3000
- **Exposed as**: http://localhost:3000
- **Health endpoint**: /health

### Frontend Web App
- **Container**: wallet_frontend
- **Port**: 80
- **Exposed as**: http://localhost
- **Routes**: Served by Nginx, API calls proxied to backend

### Database
- **Container**: wallet_db
- **Port**: 5432
- **Database**: wallet_db
- **Data persistence**: Docker volume `postgres_data`

## Production Deployment

### For Server Deployment (with SSL/Domain)

1. **Update Frontend API URL** in `.env`:
```env
REACT_APP_API_URL=https://your-domain.com/api
```

2. **Use reverse proxy** (Nginx/Apache) to:
   - Handle SSL/TLS certificates (Let's Encrypt)
   - Route requests to port 80/443
   - Forward to Docker containers

Example Nginx config for reverse proxy:

```nginx
upstream backend {
    server localhost:3000;
}

upstream frontend {
    server localhost:80;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Backend API
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### Database Backup

Backup PostgreSQL data:

```bash
docker exec wallet_db pg_dump -U quang wallet_db > backup.sql
```

Restore from backup:

```bash
docker exec -i wallet_db psql -U quang wallet_db < backup.sql
```

### Update Application

Pull latest code and restart:

```bash
git pull
docker-compose build
docker-compose up -d
```

## Troubleshooting

### Backend won't connect to database
- Check database is healthy: `docker-compose ps`
- Check logs: `docker-compose logs database`
- Verify DB_USER and DB_PASSWORD in .env

### Frontend can't reach backend API
- Verify backend is running: `docker-compose logs backend`
- Check nginx config forwards /api/ requests correctly
- In production, update REACT_APP_API_URL to match your domain

### Migrations not running
- Check migrations folder exists: `backend/migrations/`
- Review database logs: `docker-compose logs database`
- Manually run migrations: `docker exec wallet_db psql -U quang wallet_db -f /migration.sql`

### Port conflicts
- If ports 80, 3000, or 5432 are in use, modify `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "3001:3000"  # External:Internal
  frontend:
    ports:
      - "8080:80"
  database:
    ports:
      - "5433:5432"
```

## Monitoring

Check container status:

```bash
docker-compose ps
```

Check resource usage:

```bash
docker stats
```

View specific logs with filters:

```bash
docker-compose logs --tail=100 backend
docker-compose logs --since=1h backend
```

## Security Considerations

1. **Environment Variables**: Keep `.env` secure, never commit to git
2. **Database**: Use strong passwords in DB_PASSWORD
3. **Private Keys**: Never commit private keys, use `.env` only
4. **SSL/TLS**: Always use HTTPS in production
5. **Firewall**: Only expose ports 80/443 to internet
6. **Regular backups**: Backup database frequently
7. **Keep images updated**: Periodically rebuild images for security patches

## Additional Notes

- Frontend is served via Nginx for performance (static file caching, compression)
- Database migrations run automatically on startup
- All services use health checks for reliability
- Docker networks isolate services securely
- Data persists in Docker volumes even if containers restart
