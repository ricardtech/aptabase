using FluentMigrator;

namespace Aptabase.Data.Migrations;

[Migration(0015)]
public class AddDataProtectionKeys : Migration
{
    public override void Up()
    {
        Execute.Sql("CREATE TABLE IF NOT EXISTS data_protection_keys (id VARCHAR(200) PRIMARY KEY, xml TEXT NOT NULL);");
    }

    public override void Down()
    {
        Execute.Sql("DROP TABLE IF EXISTS data_protection_keys;");
    }
}
