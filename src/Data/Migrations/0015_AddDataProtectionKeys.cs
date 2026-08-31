using FluentMigrator;

namespace Aptabase.Data.Migrations;

[Migration(0015)]
public class AddDataProtectionKeys : Migration
{
    public override void Up()
    {
        Create.Table("data_protection_keys")
            .WithColumn("id").AsString(200).PrimaryKey()
            .WithColumn("xml").AsString().NotNullable();
    }

    public override void Down()
    {
        Delete.Table("data_protection_keys");
    }
}
