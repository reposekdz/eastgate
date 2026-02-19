#!/bin/bash
# EastGate Hotel - Prisma Fix Script for Git Bash / WSL

echo "Stopping any running Node processes..."
taskkill //F //IM node.exe 2>/dev/null || true

echo "Removing Prisma cache..."
rm -rf node_modules/.prisma 2>/dev/null || true

echo "Generating Prisma client..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "Prisma generated successfully!"
    
    echo "Pushing schema to database..."
    npx prisma db push
    
    if [ $? -eq 0 ]; then
        echo "Database schema pushed successfully!"
    else
        echo "Failed to push database schema"
    fi
else
    echo "Failed to generate Prisma client"
fi
