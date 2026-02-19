#!/bin/bash

# ==========================================
# Eastgate Hotel Manager Setup Script
# ==========================================
# This script sets up the complete manager system
# with MySQL database and all configurations

set -e  # Exit on error

echo "=========================================="
echo "Eastgate Hotel Manager System Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if MySQL is installed
echo "Checking MySQL installation..."
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL is not installed${NC}"
    echo "Please install MySQL 8.0+ first"
    echo "Download from: https://dev.mysql.com/downloads/"
    exit 1
fi
echo -e "${GREEN}✓ MySQL is installed${NC}"

# Check if Node.js is installed
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ first"
    echo "Download from: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} is installed${NC}"

# Install dependencies
echo ""
echo "Installing Node.js dependencies..."
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file..."
    cp .env.example .env
    
    # Generate random secret
    SECRET=$(openssl rand -base64 32)
    sed -i "s/your-secret-key-here-change-in-production/$SECRET/" .env
    
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ Please update DATABASE_URL in .env with your MySQL credentials${NC}"
else
    echo -e "${YELLOW}⚠ .env file already exists, skipping...${NC}"
fi

# Set up MySQL database
echo ""
read -p "Do you want to set up the MySQL database now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Setting up MySQL database..."
    
    read -p "Enter MySQL root password: " -s MYSQL_PASSWORD
    echo ""
    
    # Check MySQL connection
    if mysql -u root -p"$MYSQL_PASSWORD" -e ";" 2>/dev/null; then
        echo -e "${GREEN}✓ MySQL connection successful${NC}"
        
        # Run setup script on existing database
        mysql -u root -p"$MYSQL_PASSWORD" eastgate_hotel < scripts/setup-mysql.sql
        echo -e "${GREEN}✓ Tables verified${NC}"
        
        # Update .env with database URL
        DB_URL="mysql://eastgate_admin:Change_This_Password_123!@localhost:3306/eastgate_hotel"
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"$DB_URL\"|" .env
        echo -e "${GREEN}✓ .env updated with database URL${NC}"
        echo -e "${YELLOW}⚠ IMPORTANT: Change the database password in .env for production!${NC}"
    else
        echo -e "${RED}❌ Failed to connect to MySQL${NC}"
        echo "Please check your MySQL root password and try again"
        exit 1
    fi
fi

# Generate Prisma client
echo ""
echo "Generating Prisma client..."
npx prisma generate
echo -e "${GREEN}✓ Prisma client generated${NC}"

# Run migrations
echo ""
read -p "Do you want to run database migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running database migrations..."
    npx prisma db push
    echo -e "${GREEN}✓ Migrations completed${NC}"
fi

# Seed database
echo ""
read -p "Do you want to seed the database with initial data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Seeding database..."
    npm run db:seed
    echo -e "${GREEN}✓ Database seeded${NC}"
fi

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✓ Setup completed successfully!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review and update .env file with your settings"
echo "2. Change the default database password for production"
echo "3. Start the development server: npm run dev"
echo "4. Access the application at: http://localhost:3000"
echo ""
echo "Manager Login Credentials (from seed):"
echo "  Email: manager@eastgate.com"
echo "  Password: manager123"
echo ""
echo "For more information, see MANAGER_GUIDE.md"
echo "=========================================="
