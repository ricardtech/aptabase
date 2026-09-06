using Amazon.S3;
using Amazon.S3.Model;
using Aptabase.Data;
using Aptabase.Features.Ingestion.Buffer;
using Aptabase.Features.Stats;
using Dapper;
using Microsoft.Extensions.Caching.Memory;
using Npgsql;
using System.Text;
using System.Text.Json;

namespace Aptabase.Features.Export;

public interface IS3EventExporter
{
    Task ExportBatchAsync(IReadOnlyList<EventRow> events, CancellationToken cancellationToken = default);
    Task<(bool success, int count, string message)> SyncAppEventsAsync(string appId, DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default);
    void InvalidateCache(string appId);
}

public class S3ExportSettingsCacheItem
{
    public string AppId { get; set; } = string.Empty;
    public string S3Endpoint { get; set; } = string.Empty;
    public string S3Bucket { get; set; } = string.Empty;
    public string S3Region { get; set; } = "us-east-1";
    public string S3AccessKey { get; set; } = string.Empty;
    public string S3SecretKey { get; set; } = string.Empty;
    public bool Enabled { get; set; }
}

public class S3EventExporter(
    IServiceScopeFactory scopeFactory,
    IMemoryCache memoryCache,
    IQueryClient queryClient,
    ILogger<S3EventExporter> logger
) : IS3EventExporter
{
    private readonly IServiceScopeFactory _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
    private readonly IMemoryCache _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));
    private readonly IQueryClient _queryClient = queryClient ?? throw new ArgumentNullException(nameof(queryClient));
    private readonly ILogger<S3EventExporter> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public void InvalidateCache(string appId)
    {
        _memoryCache.Remove($"s3_export_settings_{appId}");
    }

    public async Task ExportBatchAsync(IReadOnlyList<EventRow> events, CancellationToken cancellationToken = default)
    {
        if (events == null || events.Count == 0) return;

        var appGroups = events.GroupBy(e => e.AppId.Replace("_DEBUG", "", StringComparison.OrdinalIgnoreCase));

        foreach (var group in appGroups)
        {
            var appId = group.Key;
            try
            {
                var settings = await GetSettingsForAppAsync(appId, cancellationToken);
                if (settings == null || !settings.Enabled || string.IsNullOrWhiteSpace(settings.S3Endpoint) || string.IsNullOrWhiteSpace(settings.S3Bucket))
                {
                    continue;
                }

                var config = new AmazonS3Config
                {
                    ServiceURL = settings.S3Endpoint.Trim(),
                    ForcePathStyle = true,
                    AuthenticationRegion = string.IsNullOrWhiteSpace(settings.S3Region) ? "us-east-1" : settings.S3Region.Trim()
                };

                using var s3Client = new AmazonS3Client(settings.S3AccessKey?.Trim(), settings.S3SecretKey?.Trim(), config);

                var sb = new StringBuilder();
                foreach (var ev in group)
                {
                    using var sw = new StringWriter();
                    ev.WriteJson(sw);
                    sb.AppendLine(sw.ToString());
                }

                var suffix = Guid.NewGuid().ToString("N")[..6];
                var key = $"raw-events/{appId}/{DateTime.UtcNow:yyyy/MM/dd/HH}/events_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{suffix}.ndjson";

                var putRequest = new PutObjectRequest
                {
                    BucketName = settings.S3Bucket.Trim(),
                    Key = key,
                    ContentBody = sb.ToString(),
                    ContentType = "application/x-ndjson"
                };

                try
                {
                    await s3Client.PutObjectAsync(putRequest, cancellationToken);
                }
                catch (AmazonS3Exception s3Ex) when (s3Ex.ErrorCode == "NoSuchBucket")
                {
                    await s3Client.PutBucketAsync(settings.S3Bucket.Trim(), cancellationToken);
                    await s3Client.PutObjectAsync(putRequest, cancellationToken);
                }

                await UpdateLastExportedAtAsync(appId, cancellationToken);

                _logger.LogInformation("Exported {Count} events to RustFS/S3 for app {AppId} at key {Key}", group.Count(), appId, key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to export event batch to RustFS/S3 for app {AppId}", appId);
            }
        }
    }

    public async Task<(bool success, int count, string message)> SyncAppEventsAsync(string appId, DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default)
    {
        var from = startDate ?? DateTime.UtcNow.AddDays(-1);
        var to = endDate ?? DateTime.UtcNow;

        try
        {
            var settings = await GetSettingsForAppAsync(appId, cancellationToken);
            if (settings == null || !settings.Enabled || string.IsNullOrWhiteSpace(settings.S3Endpoint) || string.IsNullOrWhiteSpace(settings.S3Bucket))
            {
                return (false, 0, "Exportação RustFS/S3 não está configurada ou ativa para este aplicativo.");
            }

            var query = $@"SELECT * FROM events 
                          WHERE (app_id = '{appId}' OR app_id = '{appId}_DEBUG') 
                            AND timestamp BETWEEN '{from:yyyy-MM-dd HH:mm:ss}' AND '{to:yyyy-MM-dd HH:mm:ss}' 
                          FORMAT JSONEachRow";

            using var stream = await _queryClient.StreamResponseAsync(query, cancellationToken);
            using var reader = new StreamReader(stream);
            var content = await reader.ReadToEndAsync(cancellationToken);

            if (string.IsNullOrWhiteSpace(content))
            {
                return (true, 0, "Nenhum evento encontrado no período selecionado.");
            }

            var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            var count = lines.Length;

            var config = new AmazonS3Config
            {
                ServiceURL = settings.S3Endpoint.Trim(),
                ForcePathStyle = true,
                AuthenticationRegion = string.IsNullOrWhiteSpace(settings.S3Region) ? "us-east-1" : settings.S3Region.Trim()
            };

            using var s3Client = new AmazonS3Client(settings.S3AccessKey?.Trim(), settings.S3SecretKey?.Trim(), config);

            var suffix = Guid.NewGuid().ToString("N")[..6];
            var key = $"raw-events/{appId}/sync/events_{from:yyyyMMdd_HHmmss}_to_{to:yyyyMMdd_HHmmss}_{suffix}.ndjson";

            var putRequest = new PutObjectRequest
            {
                BucketName = settings.S3Bucket.Trim(),
                Key = key,
                ContentBody = content,
                ContentType = "application/x-ndjson"
            };

            try
            {
                await s3Client.PutObjectAsync(putRequest, cancellationToken);
            }
            catch (AmazonS3Exception s3Ex) when (s3Ex.ErrorCode == "NoSuchBucket")
            {
                await s3Client.PutBucketAsync(settings.S3Bucket.Trim(), cancellationToken);
                await s3Client.PutObjectAsync(putRequest, cancellationToken);
            }

            await UpdateLastExportedAtAsync(appId, cancellationToken);

            return (true, count, $"Sincronização concluída com sucesso! {count} eventos gravados no RustFS/S3.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao sincronizar eventos com RustFS/S3 para app {AppId}", appId);
            return (false, 0, $"Falha na sincronização com RustFS/S3: {ex.Message}");
        }
    }

    private async Task<S3ExportSettingsCacheItem?> GetSettingsForAppAsync(string appId, CancellationToken cancellationToken)
    {
        var cacheKey = $"s3_export_settings_{appId}";
        if (_memoryCache.TryGetValue(cacheKey, out S3ExportSettingsCacheItem? cached))
        {
            return cached;
        }

        using var scope = _scopeFactory.CreateScope();
        var dataSource = scope.ServiceProvider.GetRequiredService<NpgsqlDataSource>();
        await using var conn = await dataSource.OpenConnectionAsync(cancellationToken);

        const string sql = @"
            SELECT app_id as AppId, s3_endpoint as S3Endpoint, s3_bucket as S3Bucket,
                   s3_region as S3Region, s3_access_key as S3AccessKey, s3_secret_key as S3SecretKey,
                   enabled as Enabled
            FROM app_export_settings
            WHERE app_id = @appId";

        var settings = await conn.QueryFirstOrDefaultAsync<S3ExportSettingsCacheItem>(sql, new { appId });

        _memoryCache.Set(cacheKey, settings, TimeSpan.FromSeconds(60));
        return settings;
    }

    private async Task UpdateLastExportedAtAsync(string appId, CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dataSource = scope.ServiceProvider.GetRequiredService<NpgsqlDataSource>();
            await using var conn = await dataSource.OpenConnectionAsync(cancellationToken);

            await conn.ExecuteAsync("UPDATE app_export_settings SET last_exported_at = NOW(), updated_at = NOW() WHERE app_id = @appId", new { appId });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not update last_exported_at for app {AppId}", appId);
        }
    }
}
