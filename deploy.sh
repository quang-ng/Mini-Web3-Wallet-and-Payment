#!/bin/bash

# Web3 Wallet - Docker Deployment Script
# This script helps you deploy the application using Docker and Docker Compose

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "=================================="
echo "Web3 Wallet - Docker Deployment"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Creating .env from template..."
    cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
    echo "✅ .env created. Please edit it with your configuration:"
    echo "   nano .env"
    exit 1
fi

# Check Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Get action from argument
ACTION=${1:-up}

case $ACTION in
    up)
        echo "🚀 Starting services..."
        docker-compose build --no-cache
        docker-compose up -d
        echo ""
        echo "✅ Services started successfully!"
        echo ""
        echo "📍 Access your application:"
        echo "   Frontend:  http://localhost"
        echo "   Backend:   http://localhost:3000"
        echo "   API Docs:  http://localhost:3000/health"
        echo ""
        echo "📊 View logs:"
        echo "   docker-compose logs -f"
        ;;

    down)
        echo "🛑 Stopping services..."
        docker-compose down
        echo "✅ Services stopped"
        ;;

    down-clean)
        echo "🧹 Stopping services and removing data..."
        docker-compose down -v
        echo "✅ Services stopped and data removed"
        ;;

    logs)
        echo "📋 Showing logs (Ctrl+C to exit)..."
        docker-compose logs -f
        ;;

    logs-backend)
        echo "📋 Backend logs (Ctrl+C to exit)..."
        docker-compose logs -f backend
        ;;

    logs-frontend)
        echo "📋 Frontend logs (Ctrl+C to exit)..."
        docker-compose logs -f frontend
        ;;

    logs-db)
        echo "📋 Database logs (Ctrl+C to exit)..."
        docker-compose logs -f database
        ;;

    status)
        echo "📊 Container status:"
        docker-compose ps
        ;;

    restart)
        echo "🔄 Restarting services..."
        docker-compose restart
        echo "✅ Services restarted"
        ;;

    rebuild)
        echo "🔨 Rebuilding images..."
        docker-compose build --no-cache
        echo "✅ Images rebuilt"
        ;;

    backup-db)
        echo "💾 Backing up database..."
        BACKUP_FILE="wallet_db_backup_$(date +%Y%m%d_%H%M%S).sql"
        docker exec wallet_db pg_dump -U ${DB_USER:-quang} wallet_db > "$SCRIPT_DIR/$BACKUP_FILE"
        echo "✅ Database backed up to: $BACKUP_FILE"
        ;;

    restore-db)
        if [ -z "$2" ]; then
            echo "❌ Please provide backup file: ./deploy.sh restore-db <backup_file>"
            exit 1
        fi
        echo "📥 Restoring database from $2..."
        docker exec -i wallet_db psql -U ${DB_USER:-quang} wallet_db < "$2"
        echo "✅ Database restored"
        ;;

    help)
        echo "📖 Usage: ./deploy.sh [command]"
        echo ""
        echo "Commands:"
        echo "  up               - Build and start all services (default)"
        echo "  down             - Stop services"
        echo "  down-clean       - Stop services and remove data"
        echo "  logs             - View logs from all services"
        echo "  logs-backend     - View backend logs"
        echo "  logs-frontend    - View frontend logs"
        echo "  logs-db          - View database logs"
        echo "  status           - Show container status"
        echo "  restart          - Restart all services"
        echo "  rebuild          - Rebuild Docker images"
        echo "  backup-db        - Backup database"
        echo "  restore-db FILE  - Restore database from backup file"
        echo "  help             - Show this help message"
        ;;

    *)
        echo "❌ Unknown command: $ACTION"
        echo "Run './deploy.sh help' for available commands"
        exit 1
        ;;
esac

echo ""
