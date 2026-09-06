using FluentMigrator;

namespace Aptabase.Data.Migrations;

[Migration(0016)]
public class AddS3Exports : Migration
{
    public override void Up()
    {
        Execute.Sql(@"
            CREATE TABLE IF NOT EXISTS app_export_settings (
                app_id VARCHAR(36) PRIMARY KEY,
                s3_endpoint TEXT NOT NULL,
                s3_bucket TEXT NOT NULL,
                s3_region VARCHAR(64) DEFAULT 'us-east-1',
                s3_access_key TEXT NOT NULL,
                s3_secret_key TEXT NOT NULL,
                enabled BOOLEAN DEFAULT TRUE,
                last_exported_at TIMESTAMP WITH TIME ZONE NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        ");
    }

    public override void Down()
    {
        Execute.Sql("DROP TABLE IF EXISTS app_export_settings;");
    }
}
