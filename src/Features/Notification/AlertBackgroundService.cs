using Aptabase.Features.Stats;
using Dapper;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Npgsql;
using System.Collections.Concurrent;
using System.Text.Json;

namespace Aptabase.Features.Notification;

public class AlertAppSettingRow
{
    public string AppId { get; set; } = string.Empty;
    public string AppName { get; set; } = string.Empty;
    public string? WhatsGoUrl { get; set; }
    public string? WhatsGoInstance { get; set; }
    public string? WhatsGoToken { get; set; }
    public string? WhatsGoPhone { get; set; }
    public bool WhatsGoEnabled { get; set; }
    public string? TelegramBotToken { get; set; }
    public string? TelegramChatId { get; set; }
    public bool TelegramEnabled { get; set; }
    public bool NotifyCriticalErrors { get; set; }
    public bool NotifyDailySummary { get; set; }
}

public class ErrorItemRow
{
    public string? ErrorId { get; set; }
    public string? AppId { get; set; }
    public DateTime Timestamp { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorType { get; set; }
    public string? StackTrace { get; set; }
    public string? Platform { get; set; }
    public string? OsName { get; set; }
    public string? OsVersion { get; set; }
    public string? AppVersion { get; set; }
    public string? Severity { get; set; }
}

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
                _logger.LogError(ex, "Erro no loop principal do AlertBackgroundService.");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
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

        var settingsList = await conn.QueryAsync<AlertAppSettingRow>(sql);

        foreach (var s in settingsList)
        {
            string appId = s.AppId;
            string appName = s.AppName;

            try
            {
                var errors = await queryClient.NamedQueryAsync<ErrorItemRow>("get_errors__v1", new {
                    app_id = appId,
                    start_date = DateTime.UtcNow.AddMinutes(-10).ToString("yyyy-MM-dd HH:mm:ss"),
                    end_date = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
                    limit = 10,
                    offset = 0
                }, cancellationToken);

                var errorList = errors.ToList();
                if (errorList.Count > 0)
                {
                    string dedupeKey = $"{appId}_{errorList.Count}_{errorList.First().ErrorType}";
                    if (_lastAlertSent.TryGetValue(dedupeKey, out var lastSent) && (DateTime.UtcNow - lastSent).TotalMinutes < 15)
                    {
                        continue;
                    }

                    _lastAlertSent[dedupeKey] = DateTime.UtcNow;

                    var firstErr = errorList.First();
                    string errType = firstErr.ErrorType ?? "Erro de Aplicativo";
                    string errMessage = firstErr.ErrorMessage ?? "Falha detectada no aplicativo.";

                    var brTime = DateTime.UtcNow.AddHours(-3);

                    string whatsGoText = $"🚨 *ALERTA DE ERRO NO APP: {appName}*\n\n" +
                                         $"*Tipo:* `{errType}`\n" +
                                         $"*Mensagem:* {errMessage}\n" +
                                         $"*Ocorrências recentes:* {errorList.Count} nos últimos 10 min.\n" +
                                         $"*Data/Hora:* {brTime:dd/MM/yyyy HH:mm:ss} (Horário de Brasília)\n\n" +
                                         $"Acesse seu painel Aptabase para mais detalhes.";

                    string telegramText = $"🚨 <b>ALERTA DE ERRO NO APP: {appName}</b>\n\n" +
                                          $"<b>Tipo:</b> <code>{errType}</code>\n" +
                                          $"<b>Mensagem:</b> {errMessage}\n" +
                                          $"<b>Ocorrências recentes:</b> {errorList.Count} nos últimos 10 min.\n" +
                                          $"<b>Data/Hora:</b> {brTime:dd/MM/yyyy HH:mm:ss} (Horário de Brasília)\n\n" +
                                          $"Acesse seu painel Aptabase para mais detalhes.";

                    if (s.WhatsGoEnabled && !string.IsNullOrWhiteSpace(s.WhatsGoUrl) && !string.IsNullOrWhiteSpace(s.WhatsGoPhone))
                    {
                        await SendWhatsGoAsync(s.WhatsGoUrl, s.WhatsGoInstance, s.WhatsGoToken, s.WhatsGoPhone, whatsGoText);
                    }

                    if (s.TelegramEnabled && !string.IsNullOrWhiteSpace(s.TelegramBotToken) && !string.IsNullOrWhiteSpace(s.TelegramChatId))
                    {
                        await SendTelegramAsync(s.TelegramBotToken, s.TelegramChatId, telegramText);
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

            var settingsList = await conn.QueryAsync<AlertAppSettingRow>(sql);

            foreach (var s in settingsList)
            {
                string appId = s.AppId;
                string appName = s.AppName;

                try
                {
                    string whatsGoSummary = $"📊 *Resumo Diário Aptabase - {appName}*\n" +
                                            $"*Data:* {now:dd/MM/yyyy}\n\n" +
                                            $"Seu aplicativo está ativo e recebendo telemetria com sucesso!\n" +
                                            $"Consulte o painel web para analisar métricas detalhadas de usuários e sessões.";

                    string telegramSummary = $"📊 <b>Resumo Diário Aptabase - {appName}</b>\n" +
                                             $"<b>Data:</b> {now:dd/MM/yyyy}\n\n" +
                                             $"Seu aplicativo está ativo e recebendo telemetria com sucesso!\n" +
                                             $"Consulte o painel web para analisar métricas detalhadas de usuários e sessões.";

                    if (s.WhatsGoEnabled && !string.IsNullOrWhiteSpace(s.WhatsGoUrl) && !string.IsNullOrWhiteSpace(s.WhatsGoPhone))
                    {
                        await SendWhatsGoAsync(s.WhatsGoUrl, s.WhatsGoInstance, s.WhatsGoToken, s.WhatsGoPhone, whatsGoSummary);
                    }

                    if (s.TelegramEnabled && !string.IsNullOrWhiteSpace(s.TelegramBotToken) && !string.IsNullOrWhiteSpace(s.TelegramChatId))
                    {
                        await SendTelegramAsync(s.TelegramBotToken, s.TelegramChatId, telegramSummary);
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
            client.Timeout = TimeSpan.FromSeconds(30);
            var baseUrl = url.Trim().TrimEnd('/');
            var inst = string.IsNullOrWhiteSpace(instance) ? "default" : instance.Trim();
            var cleanToken = token?.Trim().Trim('"', '\'');
            var cleanPhone = phone.Replace("+", "").Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "").Trim();

            var encodedToken = !string.IsNullOrWhiteSpace(cleanToken) ? Uri.EscapeDataString(cleanToken) : "";
            var endpointsToTry = new[]
            {
                $"{baseUrl}/v1/message/sendText",
                $"{baseUrl}/v1/message/sendText?apikey={encodedToken}&apiKey={encodedToken}",
                $"{baseUrl}/message/sendText/{inst}",
                $"{baseUrl}/message/sendText/{inst}?apikey={encodedToken}&apiKey={encodedToken}",
                $"{baseUrl}/message/sendText"
            };

            var payload = new
            {
                instance = inst,
                to = cleanPhone,
                text = message,
                apikey = cleanToken,
                apiKey = cleanToken,
                token = cleanToken,
                key = cleanToken,
                number = cleanPhone,
                recipient = cleanPhone,
                phone = cleanPhone,
                message = message,
                textMessage = new { text = message },
                options = new { delay = 1200, presence = "composing", linkPreview = false }
            };

            foreach (var endpoint in endpointsToTry)
            {
                using var req = new HttpRequestMessage(HttpMethod.Post, endpoint);
                if (!string.IsNullOrWhiteSpace(cleanToken))
                {
                    req.Headers.TryAddWithoutValidation("X-API-Key", cleanToken);
                    req.Headers.TryAddWithoutValidation("x-api-key", cleanToken);
                    req.Headers.TryAddWithoutValidation("apikey", cleanToken);
                    req.Headers.TryAddWithoutValidation("apiKey", cleanToken);
                    req.Headers.TryAddWithoutValidation("token", cleanToken);
                    req.Headers.TryAddWithoutValidation("X-Auth-Token", cleanToken);
                    req.Headers.TryAddWithoutValidation("Authorization", $"Bearer {cleanToken}");
                }
                req.Content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
                var response = await client.SendAsync(req);
                var responseText = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("WhatsGo alert sent to {Endpoint}: StatusCode={StatusCode}, Body={Body}", endpoint, response.StatusCode, responseText);

                if (response.IsSuccessStatusCode)
                {
                    break;
                }
            }
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
            client.Timeout = TimeSpan.FromSeconds(30);
            var rawToken = token.Trim();
            var cleanToken = rawToken.StartsWith("bot", StringComparison.OrdinalIgnoreCase) ? rawToken[3..] : rawToken;
            var cleanChatId = chatId.Trim();

            var endpoint = $"https://api.telegram.org/bot{cleanToken}/sendMessage";
            var payload = new
            {
                chat_id = cleanChatId,
                text = message,
                parse_mode = "HTML"
            };

            using var req = new HttpRequestMessage(HttpMethod.Post, endpoint);
            req.Content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
            var response = await client.SendAsync(req);
            _logger.LogInformation("Telegram alert sent: StatusCode={StatusCode}", response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao disparar Telegram");
        }
    }
}
