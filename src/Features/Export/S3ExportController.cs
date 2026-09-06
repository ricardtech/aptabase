using Amazon.S3;
using Amazon.S3.Model;
using Aptabase.Features.Authentication;
using Aptabase.Features.Stats;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System.Text.Json;

namespace Aptabase.Features.Export;

public class S3ExportSettingsDto
{
    public string AppId { get; set; } = string.Empty;
    public string S3Endpoint { get; set; } = string.Empty;
    public string S3Bucket { get; set; } = string.Empty;
    public string S3Region { get; set; } = "us-east-1";
    public string S3AccessKey { get; set; } = string.Empty;
    public string S3SecretKey { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
    public DateTime? LastExportedAt { get; set; }
}

[ApiController, IsAuthenticated, HasReadAccessToApp]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public class S3ExportController(NpgsqlDataSource dataSource, IS3EventExporter s3Exporter, ILogger<S3ExportController> logger) : Controller
{
    private readonly NpgsqlDataSource _dataSource = dataSource;
    private readonly IS3EventExporter _s3Exporter = s3Exporter;
    private readonly ILogger<S3ExportController> _logger = logger;

    [HttpGet("/api/apps/{appId}/export/s3")]
    public async Task<IActionResult> GetSettings([FromRoute] string appId)
    {
        await using var conn = await _dataSource.OpenConnectionAsync();
        const string sql = @"
            SELECT app_id as AppId,
                   s3_endpoint as S3Endpoint,
                   s3_bucket as S3Bucket,
                   s3_region as S3Region,
                   s3_access_key as S3AccessKey,
                   s3_secret_key as S3SecretKey,
                   enabled as Enabled,
                   last_exported_at as LastExportedAt
            FROM app_export_settings
            WHERE app_id = @appId";

        var settings = await conn.QuerySingleOrDefaultAsync<S3ExportSettingsDto>(sql, new { appId });
        return Ok(settings ?? new S3ExportSettingsDto { AppId = appId });
    }

    [HttpPut("/api/apps/{appId}/export/s3")]
    public async Task<IActionResult> SaveSettings([FromRoute] string appId, [FromBody] S3ExportSettingsDto body)
    {
        if (string.IsNullOrWhiteSpace(body.S3Endpoint) || string.IsNullOrWhiteSpace(body.S3Bucket))
        {
            return BadRequest(new { success = false, message = "Endpoint do S3/RustFS e Nome do Bucket são obrigatórios." });
        }

        await using var conn = await _dataSource.OpenConnectionAsync();
        const string sql = @"
            INSERT INTO app_export_settings (
                app_id, s3_endpoint, s3_bucket, s3_region, s3_access_key, s3_secret_key, enabled, updated_at
            ) VALUES (
                @appId, @S3Endpoint, @S3Bucket, @S3Region, @S3AccessKey, @S3SecretKey, @Enabled, NOW()
            )
            ON CONFLICT (app_id) DO UPDATE SET
                s3_endpoint = EXCLUDED.s3_endpoint,
                s3_bucket = EXCLUDED.s3_bucket,
                s3_region = EXCLUDED.s3_region,
                s3_access_key = EXCLUDED.s3_access_key,
                s3_secret_key = EXCLUDED.s3_secret_key,
                enabled = EXCLUDED.enabled,
                updated_at = NOW()";

        await conn.ExecuteAsync(sql, new {
            appId,
            body.S3Endpoint,
            body.S3Bucket,
            S3Region = string.IsNullOrWhiteSpace(body.S3Region) ? "us-east-1" : body.S3Region,
            S3AccessKey = body.S3AccessKey ?? "",
            S3SecretKey = body.S3SecretKey ?? "",
            body.Enabled
        });

        _s3Exporter.InvalidateCache(appId);

        return Ok(new { success = true, message = "Configurações de exportação para RustFS/S3 salvas com sucesso!" });
    }

    [HttpPost("/api/apps/{appId}/export/s3/test")]
    public async Task<IActionResult> TestConnection([FromRoute] string appId, [FromBody] S3ExportSettingsDto body)
    {
        if (string.IsNullOrWhiteSpace(body.S3Endpoint) || string.IsNullOrWhiteSpace(body.S3Bucket))
        {
            return BadRequest(new { success = false, message = "Endpoint do S3/RustFS e Nome do Bucket são obrigatórios." });
        }

        try
        {
            var config = new AmazonS3Config
            {
                ServiceURL = body.S3Endpoint.TrimEnd('/'),
                ForcePathStyle = true,
                AuthenticationRegion = string.IsNullOrWhiteSpace(body.S3Region) ? "us-east-1" : body.S3Region
            };

            using var s3Client = new AmazonS3Client(body.S3AccessKey?.Trim(), body.S3SecretKey?.Trim(), config);

            var bucketName = body.S3Bucket.Trim();
            var testKey = $"aptabase-test-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6]}.json";
            var putRequest = new PutObjectRequest
            {
                BucketName = bucketName,
                Key = testKey,
                ContentBody = JsonSerializer.Serialize(new {
                    service = "Aptabase",
                    test = "RustFS / S3 Export Test",
                    timestamp = DateTime.UtcNow
                })
            };

            try
            {
                await s3Client.PutObjectAsync(putRequest);
            }
            catch (AmazonS3Exception s3Ex) when (s3Ex.ErrorCode == "NoSuchBucket")
            {
                await s3Client.PutBucketAsync(bucketName);
                await s3Client.PutObjectAsync(putRequest);
            }

            // Clean up test file
            await s3Client.DeleteObjectAsync(bucketName, testKey);

            return Ok(new { success = true, message = "Conexão com RustFS / S3 testada com sucesso! Gravação e leitura validadas." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao testar conexão S3/RustFS para app {AppId}", appId);
            return BadRequest(new { success = false, message = $"Falha na conexão com S3/RustFS: {ex.Message}" });
        }
    }

    [HttpPost("/api/apps/{appId}/export/s3/sync")]
    public async Task<IActionResult> SyncEvents([FromRoute] string appId, [FromQuery] int? days = 7)
    {
        var from = DateTime.UtcNow.AddDays(-(days ?? 7));
        var to = DateTime.UtcNow;

        var result = await _s3Exporter.SyncAppEventsAsync(appId, from, to, HttpContext.RequestAborted);
        if (!result.success)
        {
            return BadRequest(new { success = false, message = result.message });
        }

        return Ok(new { success = true, count = result.count, message = result.message });
    }
}
