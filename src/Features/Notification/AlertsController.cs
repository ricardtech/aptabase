using Aptabase.Features.Authentication;
using Aptabase.Features.Stats;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System.Text.Json;

namespace Aptabase.Features.Notification;

public class AlertSettingsDto
{
    public string AppId { get; set; } = string.Empty;
    public string? WhatsGoUrl { get; set; }
    public string? WhatsGoInstance { get; set; }
    public string? WhatsGoToken { get; set; }
    public string? WhatsGoPhone { get; set; }
    public bool WhatsGoEnabled { get; set; }
    public string? TelegramBotToken { get; set; }
    public string? TelegramChatId { get; set; }
    public bool TelegramEnabled { get; set; }
    public bool NotifyCriticalErrors { get; set; } = true;
    public bool NotifyDailySummary { get; set; } = true;
}

[ApiController, IsAuthenticated, HasReadAccessToApp]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public class AlertsController(NpgsqlDataSource dataSource, IHttpClientFactory httpClientFactory, ILogger<AlertsController> logger) : Controller
{
    private readonly NpgsqlDataSource _dataSource = dataSource;
    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;
    private readonly ILogger<AlertsController> _logger = logger;

    [HttpGet("/api/apps/{appId}/alerts")]
    public async Task<IActionResult> GetAlerts([FromRoute] string appId)
    {
        await using var conn = await _dataSource.OpenConnectionAsync();
        const string sql = @"
            SELECT app_id as AppId,
                   whatsgo_url as WhatsGoUrl,
                   whatsgo_instance as WhatsGoInstance,
                   whatsgo_token as WhatsGoToken,
                   whatsgo_phone as WhatsGoPhone,
                   whatsgo_enabled as WhatsGoEnabled,
                   telegram_bot_token as TelegramBotToken,
                   telegram_chat_id as TelegramChatId,
                   telegram_enabled as TelegramEnabled,
                   notify_critical_errors as NotifyCriticalErrors,
                   notify_daily_summary as NotifyDailySummary
            FROM app_alert_settings
            WHERE app_id = @appId";

        var settings = await conn.QuerySingleOrDefaultAsync<AlertSettingsDto>(sql, new { appId });
        return Ok(settings ?? new AlertSettingsDto { AppId = appId });
    }

    [HttpPut("/api/apps/{appId}/alerts")]
    public async Task<IActionResult> SaveAlerts([FromRoute] string appId, [FromBody] AlertSettingsDto body)
    {
        await using var conn = await _dataSource.OpenConnectionAsync();
        const string sql = @"
            INSERT INTO app_alert_settings (
                app_id, whatsgo_url, whatsgo_instance, whatsgo_token, whatsgo_phone, whatsgo_enabled,
                telegram_bot_token, telegram_chat_id, telegram_enabled, notify_critical_errors, notify_daily_summary, updated_at
            ) VALUES (
                @appId, @WhatsGoUrl, @WhatsGoInstance, @WhatsGoToken, @WhatsGoPhone, @WhatsGoEnabled,
                @TelegramBotToken, @TelegramChatId, @TelegramEnabled, @NotifyCriticalErrors, @NotifyDailySummary, NOW()
            )
            ON CONFLICT (app_id) DO UPDATE SET
                whatsgo_url = EXCLUDED.whatsgo_url,
                whatsgo_instance = EXCLUDED.whatsgo_instance,
                whatsgo_token = EXCLUDED.whatsgo_token,
                whatsgo_phone = EXCLUDED.whatsgo_phone,
                whatsgo_enabled = EXCLUDED.whatsgo_enabled,
                telegram_bot_token = EXCLUDED.telegram_bot_token,
                telegram_chat_id = EXCLUDED.telegram_chat_id,
                telegram_enabled = EXCLUDED.telegram_enabled,
                notify_critical_errors = EXCLUDED.notify_critical_errors,
                notify_daily_summary = EXCLUDED.notify_daily_summary,
                updated_at = NOW()";

        await conn.ExecuteAsync(sql, new {
            appId,
            body.WhatsGoUrl,
            body.WhatsGoInstance,
            body.WhatsGoToken,
            body.WhatsGoPhone,
            body.WhatsGoEnabled,
            body.TelegramBotToken,
            body.TelegramChatId,
            body.TelegramEnabled,
            body.NotifyCriticalErrors,
            body.NotifyDailySummary
        });

        return Ok(new { success = true, message = "Configurações de alerta salvas com sucesso!" });
    }

    [HttpPost("/api/apps/{appId}/alerts/test-whatsgo")]
    public async Task<IActionResult> TestWhatsGo([FromRoute] string appId, [FromBody] AlertSettingsDto body)
    {
        if (string.IsNullOrWhiteSpace(body.WhatsGoUrl) || string.IsNullOrWhiteSpace(body.WhatsGoPhone))
        {
            return BadRequest(new { success = false, message = "URL do WhatsGo e Telefone de destino são obrigatórios." });
        }

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);

            var baseUrl = body.WhatsGoUrl.TrimEnd('/');
            var endpoint = $"{baseUrl}/message/sendText/{body.WhatsGoInstance ?? "default"}";

            var payload = new
            {
                number = body.WhatsGoPhone.Replace("+", "").Replace(" ", "").Replace("-", ""),
                text = "🔔 *Aptabase v2.0.8 - Teste de Alerta WhatsGo*\n\nConexão com a API do WhatsGo realizada com sucesso! Você receberá alertas em tempo real sobre erros críticos e o resumo diário de telemetria."
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
            if (!string.IsNullOrWhiteSpace(body.WhatsGoToken))
            {
                request.Headers.Add("apikey", body.WhatsGoToken);
                request.Headers.Add("Authorization", $"Bearer {body.WhatsGoToken}");
            }
            request.Content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                return Ok(new { success = true, message = "Mensagem de teste enviada com sucesso via WhatsGo!" });
            }

            var errorBody = await response.Content.ReadAsStringAsync();
            return BadRequest(new { success = false, message = $"WhatsGo API respondeu com status {(int)response.StatusCode}: {errorBody}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao enviar mensagem de teste pelo WhatsGo");
            return BadRequest(new { success = false, message = $"Falha na conexão com WhatsGo: {ex.Message}" });
        }
    }

    [HttpPost("/api/apps/{appId}/alerts/test-telegram")]
    public async Task<IActionResult> TestTelegram([FromRoute] string appId, [FromBody] AlertSettingsDto body)
    {
        if (string.IsNullOrWhiteSpace(body.TelegramBotToken) || string.IsNullOrWhiteSpace(body.TelegramChatId))
        {
            return BadRequest(new { success = false, message = "Token do Bot e Chat ID do Telegram são obrigatórios." });
        }

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);

            var endpoint = $"https://api.telegram.org/bot{body.TelegramBotToken}/sendMessage";
            var payload = new
            {
                chat_id = body.TelegramChatId,
                text = "🔔 *Aptabase v2.0.8 - Teste de Alerta Telegram*\n\nConexão com o Bot do Telegram realizada com sucesso! Você receberá alertas de erros e métricas diárias.",
                parse_mode = "Markdown"
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                return Ok(new { success = true, message = "Mensagem de teste enviada com sucesso via Telegram!" });
            }

            var errorBody = await response.Content.ReadAsStringAsync();
            return BadRequest(new { success = false, message = $"Telegram API respondeu com status {(int)response.StatusCode}: {errorBody}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao enviar mensagem de teste pelo Telegram");
            return BadRequest(new { success = false, message = $"Falha na conexão com Telegram: {ex.Message}" });
        }
    }
}
