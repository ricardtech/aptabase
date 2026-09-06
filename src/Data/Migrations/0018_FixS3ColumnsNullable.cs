using FluentMigrator;

namespace Aptabase.Data.Migrations;

[Migration(0018)]
public class FixS3ColumnsNullable : Migration
{
    public override void Up()
    {
        Execute.Sql(@"
            ALTER TABLE app_export_settings ALTER COLUMN s3_access_key DROP NOT NULL;
            ALTER TABLE app_export_settings ALTER COLUMN s3_secret_key DROP NOT NULL;
        ");
    }

    public override void Down()
    {
    }
}
