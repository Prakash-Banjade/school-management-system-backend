const { DataSource } = require('typeorm');
require('dotenv').config();

const AppDataSource = new DataSource({
    type: 'mysql',
    url: process.env.DATABASE_URL,
    entities: [`${__dirname}/../**/**.entity{.ts,.js}`], // this will automatically load all entity file in the src folder
    timezone: 'Z', // Use UTC,

    synchronize: false, // We'll do this manually
    logging: true, // Shows SQL queries in console
    logger: 'simple-console',
});

async function synchronizeDatabase() {
    try {
        console.log('🔄 Connecting to database...');

        // Initialize connection
        await AppDataSource.initialize();
        console.log('✅ Database connection established');

        // Synchronize schema
        console.log('🔄 Synchronizing database schema...');
        await AppDataSource.synchronize();
        console.log('✅ Database schema synchronized successfully!');

        // Optional: Show table info
        const tables = await AppDataSource.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = '${process.env.DB_DATABASE}'
    `);

        console.log('\n📋 Tables in database:');
        tables.forEach(table => {
            console.log(`  - ${table.TABLE_NAME}`);
        });

    } catch (error) {
        console.error('❌ Error synchronizing database:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        // Close connection
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('\n✅ Database connection closed');
        }
    }
}

// Run synchronization
synchronizeDatabase();