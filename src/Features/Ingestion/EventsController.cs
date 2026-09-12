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

        if (IsBotOrCrawler(userAgent))
        {
            _logger.LogInformation("Dropping bot/crawler event from {AppKey}. UA: {UserAgent}", appKey, userAgent);
            return Ok(new { });
        }

        // Determine OS and Browser accurately from props, headers and user agent
        EnrichOperatingSystemAndBrowser(body, userAgent);

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

        var location = _geoIP.GetClientLocation(HttpContext, clientIp);
        if (body.Props != null && body.Props.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object)
        {
            var customCity = body.Props.RootElement.TryGetProperty("Cidade", out var cityProp) ? cityProp.GetString()?.Trim() : "";
            var customRegion = body.Props.RootElement.TryGetProperty("Estado", out var regProp) ? regProp.GetString()?.Trim() : "";
            var customCountry = body.Props.RootElement.TryGetProperty("País", out var countryProp) ? countryProp.GetString()?.Trim()?.ToUpper() : "";

            if (!string.IsNullOrEmpty(customCity))
            {
                var parts = new List<string> { customCity };
                if (!string.IsNullOrEmpty(customRegion)) parts.Add(customRegion);
                location = new Aptabase.Features.GeoIP.GeoLocation
                {
                    CountryCode = !string.IsNullOrEmpty(customCountry) ? customCountry : (string.IsNullOrEmpty(location.CountryCode) ? "BR" : location.CountryCode),
                    RegionName = string.Join(" · ", parts)
                };
            }
        }        var trackingEvent = NewTrackingEvent(app.Id, location.CountryCode, location.RegionName, location.IspName, location.Asn, clientIp, userAgent ?? "", body);
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

        if (IsBotOrCrawler(userAgent))
        {
            _logger.LogInformation("Dropping batch bot/crawler events from {AppKey}. UA: {UserAgent}", appKey, userAgent);
            return Ok(new { });
        }

        var defaultClientIp = HttpContext.ResolveClientIpAddress();
        var trackingEvents = validEvents.Select(e => {
            EnrichOperatingSystemAndBrowser(e, userAgent);
            var eventIp = defaultClientIp;
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
            var location = _geoIP.GetClientLocation(HttpContext, eventIp);
            if (e.Props != null && e.Props.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object)
            {
                var customCity = e.Props.RootElement.TryGetProperty("Cidade", out var cityProp) ? cityProp.GetString()?.Trim() : "";
                var customRegion = e.Props.RootElement.TryGetProperty("Estado", out var regProp) ? regProp.GetString()?.Trim() : "";
                var customCountry = e.Props.RootElement.TryGetProperty("País", out var countryProp) ? countryProp.GetString()?.Trim()?.ToUpper() : "";

                if (!string.IsNullOrEmpty(customCity))
                {
                    var parts = new List<string> { customCity };
                    if (!string.IsNullOrEmpty(customRegion)) parts.Add(customRegion);
                    location = new Aptabase.Features.GeoIP.GeoLocation
                    {
                        CountryCode = !string.IsNullOrEmpty(customCountry) ? customCountry : (string.IsNullOrEmpty(location.CountryCode) ? "BR" : location.CountryCode),
                        RegionName = string.Join(" · ", parts),
                        IspName = location.IspName,
                        Asn = location.Asn
                    };
                }
            }
            return NewTrackingEvent(app.Id, location.CountryCode, location.RegionName, location.IspName, location.Asn, eventIp, userAgent ?? "", e);
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

    private static void EnrichOperatingSystemAndBrowser(EventBody body, string? userAgent)
    {
        // 1. Inspecionar propriedades customizadas de telemetria enviadas pelo app/site
        if (body.Props != null && body.Props.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object)
        {
            var props = body.Props.RootElement;
            string? customDistro = null;
            string? customSystem = null;

            if (props.TryGetProperty("Distribuição", out var d1) || props.TryGetProperty("Distribuicao", out d1) || props.TryGetProperty("Distro", out d1))
                customDistro = d1.GetString()?.Trim();

            if (props.TryGetProperty("Sistema / Distribuição", out var s1) || props.TryGetProperty("Sistema / Distribuicao", out s1) || props.TryGetProperty("Sistema Operacional", out s1) || props.TryGetProperty("SO", out s1))
                customSystem = s1.GetString()?.Trim();

            if (!string.IsNullOrEmpty(customDistro) && !customDistro.Equals("Linux", StringComparison.OrdinalIgnoreCase))
            {
                body.SystemProps.OSName = NormalizeDistroName(customDistro);

                if (!string.IsNullOrEmpty(customSystem) && (string.IsNullOrEmpty(body.SystemProps.OSVersion) || body.SystemProps.OSVersion.Equals("1.0") || body.SystemProps.OSVersion.StartsWith("(")))
                {
                    var cleaned = customSystem.Replace(customDistro, "").Trim();
                    if (!string.IsNullOrEmpty(cleaned))
                    {
                        body.SystemProps.OSVersion = cleaned;
                    }
                }
            }
            else if (!string.IsNullOrEmpty(customSystem) && !customSystem.Equals("Linux", StringComparison.OrdinalIgnoreCase))
            {
                var (distro, ver) = ExtractDistroFromSystemString(customSystem);
                if (!string.IsNullOrEmpty(distro))
                {
                    body.SystemProps.OSName = distro;
                    if (!string.IsNullOrEmpty(ver))
                        body.SystemProps.OSVersion = ver;
                }
            }
        }

        // 2. Se o SO ainda for genérico ("Linux", "Web", "Outro", vazio) ou com versão indefinida
        var isGenericOrMissing = string.IsNullOrWhiteSpace(body.SystemProps.OSName) ||
                                 body.SystemProps.OSName.Equals("Web", StringComparison.OrdinalIgnoreCase) ||
                                 body.SystemProps.OSName.Equals("Outro", StringComparison.OrdinalIgnoreCase) ||
                                 (body.SystemProps.OSName.Equals("Linux", StringComparison.OrdinalIgnoreCase) && 
                                  (string.IsNullOrWhiteSpace(body.SystemProps.OSVersion) || 
                                   body.SystemProps.OSVersion.Equals("1.0") || 
                                   body.SystemProps.OSVersion.Contains("Kernel", StringComparison.OrdinalIgnoreCase) ||
                                   body.SystemProps.OSVersion.StartsWith("(")));

        if (isGenericOrMissing && !string.IsNullOrEmpty(userAgent))
        {
            var (osName, osVersion) = UserAgentParser.ParseOperatingSystem(userAgent);
            if (!string.IsNullOrEmpty(osName) && !osName.Equals("Linux", StringComparison.OrdinalIgnoreCase))
            {
                body.SystemProps.OSName = osName;
                if (!string.IsNullOrEmpty(osVersion))
                    body.SystemProps.OSVersion = osVersion;
            }
        }

        // 3. Detectar Navegador
        if (string.IsNullOrWhiteSpace(body.SystemProps.EngineName) && !string.IsNullOrEmpty(userAgent))
        {
            var (engineName, engineVersion) = UserAgentParser.ParseBrowser(userAgent);
            if (!string.IsNullOrEmpty(engineName))
            {
                body.SystemProps.EngineName = engineName;
                body.SystemProps.EngineVersion = engineVersion;
            }
        }
        else if (string.IsNullOrWhiteSpace(body.SystemProps.EngineName) && body.Props != null && body.Props.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object)
        {
            if (body.Props.RootElement.TryGetProperty("Navegador", out var navProp))
            {
                var navStr = navProp.GetString()?.Trim();
                if (!string.IsNullOrEmpty(navStr))
                {
                    body.SystemProps.EngineName = navStr;
                }
            }
        }
    }

    private static string NormalizeDistroName(string distro)
    {
        var d = distro.Trim();
        if (d.Contains("BigLinux", StringComparison.OrdinalIgnoreCase)) return "BigLinux";
        if (d.Contains("Ubuntu", StringComparison.OrdinalIgnoreCase)) return "Ubuntu";
        if (d.Contains("Manjaro", StringComparison.OrdinalIgnoreCase)) return "Manjaro";
        if (d.Contains("Arch", StringComparison.OrdinalIgnoreCase)) return "Arch Linux";
        if (d.Contains("Debian", StringComparison.OrdinalIgnoreCase)) return "Debian";
        if (d.Contains("Fedora", StringComparison.OrdinalIgnoreCase)) return "Fedora";
        if (d.Contains("Mint", StringComparison.OrdinalIgnoreCase)) return "Linux Mint";
        if (d.Contains("Pop!_OS", StringComparison.OrdinalIgnoreCase) || d.Contains("PopOS", StringComparison.OrdinalIgnoreCase)) return "Pop!_OS";
        if (d.Contains("Zorin", StringComparison.OrdinalIgnoreCase)) return "Zorin OS";
        if (d.Contains("Kali", StringComparison.OrdinalIgnoreCase)) return "Kali Linux";
        if (d.Contains("openSUSE", StringComparison.OrdinalIgnoreCase) || d.Contains("SUSE", StringComparison.OrdinalIgnoreCase)) return "openSUSE";
        if (d.Contains("CentOS", StringComparison.OrdinalIgnoreCase)) return "CentOS";
        if (d.Contains("Red Hat", StringComparison.OrdinalIgnoreCase) || d.Contains("RHEL", StringComparison.OrdinalIgnoreCase)) return "Red Hat";
        if (d.Contains("Gentoo", StringComparison.OrdinalIgnoreCase)) return "Gentoo";
        if (d.Contains("Alpine", StringComparison.OrdinalIgnoreCase)) return "Alpine Linux";
        if (d.Contains("Void", StringComparison.OrdinalIgnoreCase)) return "Void Linux";
        if (d.Contains("Endeavour", StringComparison.OrdinalIgnoreCase)) return "EndeavourOS";
        if (d.Contains("Garuda", StringComparison.OrdinalIgnoreCase)) return "Garuda Linux";
        if (d.Contains("Artix", StringComparison.OrdinalIgnoreCase)) return "Artix Linux";
        if (d.Contains("Deepin", StringComparison.OrdinalIgnoreCase)) return "Deepin";
        if (d.Contains("elementary", StringComparison.OrdinalIgnoreCase)) return "elementary OS";
        return d;
    }

    private static (string distro, string version) ExtractDistroFromSystemString(string sys)
    {
        var s = sys.Trim();
        string[] distros = ["BigLinux", "Ubuntu", "Manjaro", "Arch Linux", "Debian", "Fedora", "Linux Mint", "Pop!_OS", "Zorin OS", "Kali Linux", "openSUSE", "CentOS", "Red Hat", "EndeavourOS", "Garuda Linux", "Deepin"];
        foreach (var d in distros)
        {
            if (s.Contains(d, StringComparison.OrdinalIgnoreCase))
            {
                var ver = s.Replace(d, "", StringComparison.OrdinalIgnoreCase).Trim();
                return (NormalizeDistroName(d), ver);
            }
        }
        return ("", "");
    }

    private static TrackingEvent NewTrackingEvent(string appId, string countryCode, string regionName, string ispName, string asn, string clientIp, string userAgent, EventBody body)
    {
        var (stringProps, numericProps) = body.SplitProps();
        if (!string.IsNullOrEmpty(clientIp) && !stringProps.ContainsKey("IP do Cliente") && !stringProps.ContainsKey("IP"))
        {
            stringProps["IP do Cliente"] = clientIp;
        }

        if (!string.IsNullOrEmpty(ispName) && !stringProps.ContainsKey("Provedor") && !stringProps.ContainsKey("ISP"))
        {
            stringProps["Provedor"] = !string.IsNullOrEmpty(asn) ? $"{ispName} ({asn})" : ispName;
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

    private static readonly System.Text.RegularExpressions.Regex BotRegex = new System.Text.RegularExpressions.Regex(
        @"(bot|crawler|spider|scraper|slurp|seek|fetcher|googlebot|bingbot|yandexbot|baiduspider|duckduckbot|petalbot|bytespider|sogou|exabot|ia_archiver|ahrefsbot|semrushbot|mj12bot|dotbot|screaming\s*frog|blexbot|dataforseo|serpstat|dataprovider|zoominfo|builtwith|censys|shodan|leakix|zgrab|masscan|nmap|nikto|sqlmap|nuclei|shadowserver|openvas|acunetix|nessus|dirbuster|gobuster|wpscan|headlesschrome|phantomjs|puppeteer|playwright|selenium)",
        System.Text.RegularExpressions.RegexOptions.IgnoreCase | System.Text.RegularExpressions.RegexOptions.Compiled
    );

    private static bool IsBotOrCrawler(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent)) return false;
        return BotRegex.IsMatch(userAgent);
    }
}
