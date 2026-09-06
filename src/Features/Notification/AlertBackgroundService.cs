using Aptabase.Features.Stats;
using Dapper;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Npgsql;
using System.Collections.Concurrent;
using System.Text.Json;

namespace Aptabase.Features.Notification;

public class AlertBackgroundService(
    IServiceScopeFactory scopeFactory,
    IHttpClientFactory httpClientFactory,
    ILogger<AlertBackgroundService> logger
) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;
    private readonly ILogger<AlertBackgroundService> _logger = logger;
    private static readonly ConcurrentDictionary<string, DateTime> _lastAlertSent = new();
    private static DateTime _lastDailySummarySentDate = DateTime.MinValue;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AlertBackgroundService iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessAlertsAsync(stoppingToken);
                await ProcessDailySummaryAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no loop do AlertBackgroundService.");
            }

            await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
        }
    }

    private async Task ProcessAlertsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dataSource = scope.ServiceProvider.GetRequiredService<NpgsqlDataSource>();
        var queryClient = scope.ServiceProvider.GetRequiredService<IQueryClient>();

        await using var conn = await dataSource.OpenConnectionAsync(cancellationToken);
        const string sql = @"
            SELECT s.app_id as AppId, a.name as AppName,
                   s.whatsgo_url as WhatsGoUrl, s.whatsgo_instance as WhatsGoInstance,
                   s.whatsgo_token as WhatsGoToken, s.whatsgo_phone as WhatsGoPhone,
                   s.whatsgo_enabled as WhatsGoEnabled, s.telegram_bot_token as TelegramBotToken,
                   s.telegram_chat_id as TelegramChatId, s.telegram_enabled as TelegramEnabled,
                   s.notify_critical_errors as NotifyCriticalErrors
            FROM app_alert_settings s
            INNER JOIN apps a ON a.id = s.app_id
            WHERE (s.whatsgo_enabled = TRUE OR s.telegram_enabled = TRUE)
              AND s.notify_critical_errors = TRUE
              AND a.deleted_at IS NULL";

        var settingsList = await conn.QueryAsync<dynamic>(sql);

        foreach (var s in settingsList)
        {
            string appId = s.appid;
            string appName = s.appname;

            try
            {
                var errors = await queryClient.NamedQueryAsync<dynamic>("get_errors__v1", new {
                    app_id = appId,
                    date_from = DateTime.UtcNow.AddMinutes(-5).ToString("yyyy-MM-dd HH:mm:ss")
                }, cancellationToken);

                var errorList = errors.ToList();
                if (errorList.Count > 0)
                {
                    string dedupeKey = $"{appId}_{errorList.Count}";
                    if (_lastAlertSent.TryGetValue(dedupeKey, out var lastSent) && (DateTime.UtcNow - lastSent).TotalMinutes < 15)
                    {
                        continue;
                    }

                    _lastAlertSent[dedupeKey] = DateTime.UtcNow;

                    var firstErr = errorList.First();
                    string errType = firstErr.name ?? firstErr.type ?? "Critical Error";
                    string errMessage = firstErr.message ?? "Erro detectado no aplicativo.";

                    string alertText = $"🚨 *ALERTA DE ERRO NO APP: {appName}*\n\n" +
                                       $"*Tipo:* `{errType}`\n" +
                                       $"*Mensagem:* {errMessage}\n" +
                                       $"*Ocorrências recentes:* {errorList.Count} nos últimos 5 min.\n" +
                                       $"*Data/Hora:* {DateTime.UtcNow:dd/MM/yyyy HH:mm:ss} UTC\n\n" +
                                       $"Acesse seu painel Aptabase para mais detalhes.";

                    if ((bool)s.whatsgoenabled && !string.IsNullOrWhiteSpace((string)s.whatsgourl) && !string.IsNullOrWhiteSpace((string)s.whatsgophone))
                    {
                        await SendWhatsGoAsync((string)s.whatsgourl, (string)s.whatsgoinstance, (string)s.whatsgotoken, (string)s.whatsgophone, alertText);
                    }

                    if ((bool)s.telegramenabled && !string.IsNullOrWhiteSpace((string)s.telegrambottoken) && !string.IsNullOrWhiteSpace((string)s.telegramchatid))
                    {
                        await SendTelegramAsync((string)s.telegrambottoken, (string)s.telegramchatid, alertText);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Erro ao verificar alertas de erro para o app {AppId}", appId);
            }
        }
    }

    private async Task ProcessDailySummaryAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow.AddHours(-3); // Horário de Brasília
        if (now.Hour == 8 && _lastDailySummarySentDate.Date != now.Date)
        {
            _lastDailySummarySentDate = now.Date;

            using var scope = _scopeFactory.CreateScope();
            var dataSource = scope.ServiceProvider.GetRequiredService<NpgsqlDataSource>();
            var queryClient = scope.ServiceProvider.GetRequiredService<IQueryClient>();

            await using var conn = await dataSource.OpenConnectionAsync(cancellationToken);
            const string sql = @"
                SELECT s.app_id as AppId, a.name as AppName,
                       s.whatsgo_url as WhatsGoUrl, s.whatsgo_instance as WhatsGoInstance,
                       s.whatsgo_token as WhatsGoToken, s.whatsgo_phone as WhatsGoPhone,
                       s.whatsgo_enabled as WhatsGoEnabled, s.telegram_bot_token as TelegramBotToken,
                       s.telegram_chat_id as TelegramChatId, s.telegram_enabled as TelegramEnabled,
                       s.notify_daily_summary as NotifyDailySummary
                FROM app_alert_settings s
                INNER JOIN apps a ON a.id = s.app_id
                WHERE (s.whatsgo_enabled = TRUE OR s.telegram_enabled = TRUE)
                  AND s.notify_daily_summary = TRUE
                  AND a.deleted_at IS NULL";

            var settingsList = await conn.QueryAsync<dynamic>(sql);

            foreach (var s in settingsList)
            {
                string appId = s.appid;
                string appName = s.appname;

                try
                {
                    string summaryText = $"📊 *Resumo Diário Aptabase - {appName}*\n" +
                                         $"*Data:* {now:dd/MM/yyyy}\n\n" +
                                         $"Seu aplicativo está ativo e recebendo telemetria com sucesso!\n" +
                                         $"Consulte o painel web para analisar métricas detalhadas de usuários e sessões.";

                    if ((bool)s.whatsgoenabled && !string.IsNullOrWhiteSpace((string)s.whatsgourl) && !string.IsNullOrWhiteSpace((string)s.whatsgophone))
                    {
                        await SendWhatsGoAsync((string)s.whatsgourl, (string)s.whatsgoinstance, (string)s.whatsgotoken, (string)s.whatsgophone, summaryText);
                    }

                    if ((bool)s.telegramenabled && !string.IsNullOrWhiteSpace((string)s.telegrambottoken) && !string.IsNullOrWhiteSpace((string)s.telegramchatid))
                    {
                        await SendTelegramAsync((string)s.telegrambottoken, (string)s.telegramchatid, summaryText);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Erro ao enviar resumo diário para app {AppId}", appId);
                }
            }
        }
    }

    private async Task SendWhatsGoAsync(string url, string? instance, string? token, string phone, string message)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            var endpoint = $"{url.TrimEnd('/')}/message/sendText/{instance ?? "default"}";
            var payload = new
            {
                number = phone.Replace("+", "").Replace(" ", "").Replace("-", ""),
                text = message
            };

            using var req = new HttpRequestMessage(HttpMethod.Post, endpoint);
            if (!string.IsNullOrWhiteSpace(token))
            {
                req.Headers.Add("apikey", token);
                req.Headers.Add("Authorization", $"Bearer {token}");
            }
            req.Content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
            await client.SendAsync(req);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao disparar WhatsGo");
        }
    }

    private async Task SendTelegramAsync(string token, string chatId, string message)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            var endpoint = $"https://api.telegram.org/bot{token}/sendMessage";
            var payload = new
            {
                chat_id = chatId,
                text = message,
                parse_mode = "Markdown"
            };

            using var req = new HttpRequestMessage(HttpMethod.Post, endpoint);
            req.Content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
            await client.SendAsync(req);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao disparar Telegram");
        }
    }
}
