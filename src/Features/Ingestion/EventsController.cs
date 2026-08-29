using Aptabase.Features.GeoIP;
using Aptabase.Features.Ingestion.Buffer;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Aptabase.Features.Ingestion;

[ApiController]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public class EventsController : Controller
{
    private readonly ILogger _logger;
    private readonly IIngestionCache _cache;
    private readonly IEventBuffer _buffer;
    private readonly GeoIPClient _geoIP;

    public EventsController(IIngestionCache cache,
                            IEventBuffer buffer,
                            GeoIPClient geoIP,
                            ILogger<EventsController> logger)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _buffer = buffer ?? throw new ArgumentNullException(nameof(buffer));
        _geoIP = geoIP ?? throw new ArgumentNullException(nameof(geoIP));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [HttpPost("/api/v0/event")]
    [EnableCors("AllowAny")]
    [EnableRateLimiting("EventIngestion")]
    public async Task<IActionResult> Single(
        [FromHeader(Name = "App-Key")] string? appKey,
        [FromHeader(Name = "User-Agent")] string? userAgent,
        [FromBody] EventBody body,
        CancellationToken cancellationToken
    )
    {
        appKey = appKey?.ToUpper() ?? "";

        var (valid, validationMessage) = body.IsValid(_logger);
        if (!valid)
        {
            _logger.LogWarning($"Dropping event from {appKey} because: {validationMessage}.");
            return BadRequest(validationMessage);
        }

        var app = await _cache.FindByAppKey(appKey, cancellationToken);
        if (string.IsNullOrEmpty(app.Id))
            return AppNotFound(appKey);

        if (app.IsLocked) 
            return BadRequest($"Owner account is locked.");

        // Determine OS and Browser
        var isMissingOS = string.IsNullOrWhiteSpace(body.SystemProps.OSName) || 
                          body.SystemProps.OSName.Equals("Web", StringComparison.OrdinalIgnoreCase) || 
                          (body.SystemProps.OSName.Equals("Linux", StringComparison.OrdinalIgnoreCase) && (string.IsNullOrWhiteSpace(body.SystemProps.OSVersion) || body.SystemProps.OSVersion.Equals("1.0")));

        if (isMissingOS && !string.IsNullOrEmpty(userAgent))
        {
            var (osName, osVersion) = UserAgentParser.ParseOperatingSystem(userAgent);
            if (!string.IsNullOrEmpty(osName))
            {
                body.SystemProps.OSName = osName;
                if (!string.IsNullOrEmpty(osVersion))
                    body.SystemProps.OSVersion = osVersion;
            }

            var (engineName, engineVersion) = UserAgentParser.ParseBrowser(userAgent);
            if (!string.IsNullOrEmpty(engineName))
            {
                body.SystemProps.EngineName = engineName;
                body.SystemProps.EngineVersion = engineVersion;
            }
        }

        var isWeb = string.IsNullOrEmpty(body.SystemProps.OSName) || body.SystemProps.OSName.Equals("Web", StringComparison.OrdinalIgnoreCase);

        // We can't rely on User-Agent header sent by the SDK for non-web events, so we fabricate one
        if (!isWeb)
            userAgent = $"{body.SystemProps.OSName}/{body.SystemProps.OSVersion} {body.SystemProps.EngineName}/{body.SystemProps.EngineVersion} {body.SystemProps.Locale}";

        var clientIp = HttpContext.ResolveClientIpAddress();
        if (body.Props != null && body.Props.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object)
        {
            if (body.Props.RootElement.TryGetProperty("IP do Cliente", out var customIpProp) || 
                body.Props.RootElement.TryGetProperty("IP", out customIpProp))
            {
                var customIpStr = customIpProp.GetString()?.Trim() ?? "";
                if (!string.IsNullOrEmpty(customIpStr) && !customIpStr.StartsWith("127.") && !customIpStr.StartsWith("::1"))
                {
                    clientIp = customIpStr;
                }
            }
        }

        var location = _geoIP.GetClientLocation(HttpContext);
        var trackingEvent = NewTrackingEvent(app.Id, location.CountryCode, location.RegionName, clientIp, userAgent ?? "", body);
        _buffer.Add(ref trackingEvent);

        return Ok(new { });
    }

    [HttpOptions("/api/v0/event")]
    [EnableCors("AllowAny")]
    public IActionResult OptionsSingle()
    {
        return Ok();
    }

    [HttpPost("/api/v0/events")]
    [EnableCors("AllowAny")]
    [EnableRateLimiting("EventIngestion")]
    public async Task<IActionResult> Multiple(
        [FromHeader(Name = "App-Key")] string? appKey,
        [FromHeader(Name = "User-Agent")] string? userAgent,
        [FromBody] EventBody[] events,
        CancellationToken cancellationToken
    )
    {
        appKey = appKey?.ToUpper() ?? "";

        if (events.Length > 25)
            return BadRequest($"Too many events ({events.Length}) in a single request. Maximum is 25.");

        var validEvents = events.Where(e => { 
            var (valid, validationMessage) = e.IsValid(_logger);
            if (!valid)
                _logger.LogWarning("Dropping event from {AppKey}. {ValidationMessage}", appKey, validationMessage);
            return valid;
        }).ToArray();

        if (!validEvents.Any())
            return Ok(new { });

        var app = await _cache.FindByAppKey(appKey, cancellationToken);
        if (string.IsNullOrEmpty(app.Id))
            return AppNotFound(appKey);

        if (app.IsLocked) 
            return BadRequest($"Owner account is locked.");

        var clientIp = HttpContext.ResolveClientIpAddress();
        var location = _geoIP.GetClientLocation(HttpContext);
        var trackingEvents = validEvents.Select(e => {
            var eventIp = clientIp;
            if (e.Props != null && e.Props.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object)
            {
                if (e.Props.RootElement.TryGetProperty("IP do Cliente", out var customIpProp) || 
                    e.Props.RootElement.TryGetProperty("IP", out customIpProp))
                {
                    var customIpStr = customIpProp.GetString()?.Trim() ?? "";
                    if (!string.IsNullOrEmpty(customIpStr) && !customIpStr.StartsWith("127.") && !customIpStr.StartsWith("::1"))
                    {
                        eventIp = customIpStr;
                    }
                }
            }
            return NewTrackingEvent(app.Id, location.CountryCode, location.RegionName, eventIp, userAgent ?? "", e);
        });

        _buffer.AddRange(ref trackingEvents);

        return Ok(new { });
    }


    [HttpOptions("/api/v0/events")]
    [EnableCors("AllowAny")]
    public IActionResult OptionsMultiple()
    {
        return Ok();
    }

    private IActionResult AppNotFound(string appKey)
    {
        _logger.LogWarning("Appplication not found with given app key: {AppKey}", appKey);
        return NotFound($"Appplication not found with given app key: {appKey}");
    }

    private static TrackingEvent NewTrackingEvent(string appId, string countryCode, string regionName, string clientIp, string userAgent, EventBody body)
    {
        var (stringProps, numericProps) = body.SplitProps();
        if (!string.IsNullOrEmpty(clientIp) && !stringProps.ContainsKey("IP do Cliente") && !stringProps.ContainsKey("IP"))
        {
            stringProps["IP do Cliente"] = clientIp;
        }

        return new TrackingEvent
        {
            ClientIpAddress = clientIp,
            UserAgent = userAgent,

            AppId = appId,
            EventName = body.EventName,
            Timestamp = body.Timestamp.ToUniversalTime(),
            SessionId = body.SessionId?.ToString() ?? "",
            OSName = body.SystemProps.OSName ?? "",
            OSVersion = body.SystemProps.OSVersion ?? "",
            DeviceModel = body.SystemProps.DeviceModel ?? "",
            Locale = body.SystemProps.Locale ?? "",
            AppVersion = body.SystemProps.AppVersion ?? "",
            EngineName = body.SystemProps.EngineName ?? "",
            EngineVersion = body.SystemProps.EngineVersion ?? "",
            AppBuildNumber = body.SystemProps.AppBuildNumber ?? "",
            SdkVersion = body.SystemProps.SdkVersion ?? "",
            CountryCode = countryCode,
            RegionName = regionName,
            StringProps = stringProps.ToJsonString(),
            NumericProps = numericProps.ToJsonString(),
            IsDebug = body.SystemProps.IsDebug,
        };
    }
}
