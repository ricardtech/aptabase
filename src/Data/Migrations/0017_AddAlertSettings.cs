using FluentMigrator;

namespace Aptabase.Data.Migrations;

[Migration(0017)]
public class AddAlertSettings : Migration
{
    public override void Up()
    {
        Execute.Sql(@"
            CREATE TABLE IF NOT EXISTS app_alert_settings (
                app_id VARCHAR(36) PRIMARY KEY,
                whatsgo_url TEXT NULL,
                whatsgo_instance TEXT NULL,
                whatsgo_token TEXT NULL,
                whatsgo_phone TEXT NULL,
                whatsgo_enabled BOOLEAN DEFAULT FALSE,
                telegram_bot_token TEXT NULL,
                telegram_chat_id TEXT NULL,
                telegram_enabled BOOLEAN DEFAULT FALSE,
                notify_critical_errors BOOLEAN DEFAULT TRUE,
                notify_daily_summary BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        ");
    }

    public override void Down()
    {
        Execute.Sql("DROP TABLE IF EXISTS app_alert_settings;");
    }
}
