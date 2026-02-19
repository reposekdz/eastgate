-- ========================================
-- Eastgate Hotel - MySQL Database Setup (Use Existing)
-- ========================================
-- Run: mysql -u root -p eastgate_hotel < setup-mysql.sql

USE eastgate_hotel;

-- Display confirmation
SELECT 'Database eastgate_hotel created successfully!' AS Status;
SELECT USER, HOST FROM mysql.user WHERE USER = 'eastgate_admin';

-- ========================================
-- Configuration Settings
-- ========================================

-- Set time zone (adjust as needed)
SET GLOBAL time_zone = '+02:00';

-- Optimize for InnoDB
SET GLOBAL innodb_buffer_pool_size = 268435456; -- 256MB (adjust based on your RAM)
SET GLOBAL max_connections = 200;
SET GLOBAL wait_timeout = 600;
SET GLOBAL interactive_timeout = 600;

-- Enable query cache for better performance
SET GLOBAL query_cache_type = 1;
SET GLOBAL query_cache_size = 67108864; -- 64MB

-- ========================================
-- After running this script:
-- ========================================
-- 1. Update your .env file with:
--    DATABASE_URL="mysql://eastgate_admin:Change_This_Password_123!@localhost:3306/eastgate_hotel"
--
-- 2. Run Prisma migrations:
--    npx prisma migrate dev --name init
--
-- 3. Generate Prisma client:
--    npx prisma generate
--
-- 4. Seed the database:
--    npm run db:seed
-- ========================================
