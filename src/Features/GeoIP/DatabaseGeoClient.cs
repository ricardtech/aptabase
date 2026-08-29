using System.Collections.Concurrent;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using MaxMind.GeoIP2;

namespace Aptabase.Features.GeoIP;

public class DatabaseGeoClient : GeoIPClient
{
    private readonly DatabaseReader _db;
    private static readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(3) };
    private static readonly ConcurrentDictionary<string, GeoLocation> _cache = new();

    public DatabaseGeoClient(EnvSettings env)
        : base(env)
    {
        _db = new DatabaseReader(Path.Combine(env.EtcDirectoryPath, "geoip/GeoLite2-City.mmdb"));
    }

    public override GeoLocation GetClientLocation(HttpContext httpContext)
    {
        // 1. Extração direta dos cabeçalhos do Cloudflare Tunnel (Edge Geolocation)
        var cfCountry = httpContext.Request.Headers["CF-IPCountry"].ToString()?.Trim()?.ToUpper() ?? "";
        var cfCity = httpContext.Request.Headers["CF-IPCity"].ToString()?.Trim() ?? "";
        var cfRegion = httpContext.Request.Headers["CF-Region"].ToString()?.Trim() ?? "";
        var cfRegionCode = httpContext.Request.Headers["CF-Region-Code"].ToString()?.Trim() ?? "";

        // 2. Extração e limpeza do IP do cliente (IPv4 ou IPv6)
        var ip = httpContext.ResolveClientIpAddress();

        string country = cfCountry;
        string state = !string.IsNullOrEmpty(cfRegion) ? cfRegion : cfRegionCode;
        string cityName = cfCity;

        // Se já temos a cidade pelo Cloudflare, retornamos imediatamente
        if (!string.IsNullOrEmpty(country) && !string.IsNullOrEmpty(cityName))
        {
            var parts = new List<string> { cityName };
            if (!string.IsNullOrEmpty(state)) parts.Add(state);
            return new GeoLocation
            {
                CountryCode = country,
                RegionName = string.Join(" · ", parts)
            };
        }

        if (string.IsNullOrEmpty(ip))
            return GeoLocation.Empty;

        // 3. Verifica no cache em memória
        if (_cache.TryGetValue(ip, out var cachedLoc))
        {
            return cachedLoc;
        }

        // 4. Fallback via banco MaxMind GeoLite2-City local
        try
        {
            if (_db.TryCity(ip, out var city) && city != null)
            {
                if (string.IsNullOrEmpty(country))
                    country = city.Country?.IsoCode?.ToUpper() ?? "";
                if (string.IsNullOrEmpty(state))
                    state = city.MostSpecificSubdivision?.Name ?? "";
                if (string.IsNullOrEmpty(cityName))
                    cityName = city.City?.Name ?? "";
            }
        }
        catch
        {
            // Ignora erro de parsing em IPs locais/inválidos
        }

        // 5. Fallback Online Inteligente para IPv6 / Provedores Brasileiros não mapeados no banco local
        if ((string.IsNullOrEmpty(cityName) || string.IsNullOrEmpty(state)) && !IsLocalIp(ip))
        {
            try
            {
                var onlineResult = QueryOnlineGeoIp(ip);
                if (onlineResult.HasValue)
                {
                    if (string.IsNullOrEmpty(country)) country = onlineResult.Value.CountryCode;
                    if (string.IsNullOrEmpty(cityName)) cityName = onlineResult.Value.City;
                    if (string.IsNullOrEmpty(state)) state = onlineResult.Value.State;
                }
            }
            catch
            {
                // Ignora falhas externas
            }
        }

        var locationParts = new List<string>();
        if (!string.IsNullOrEmpty(cityName)) locationParts.Add(cityName);
        if (!string.IsNullOrEmpty(state)) locationParts.Add(state);

        var finalLoc = new GeoLocation
        {
            CountryCode = country,
            RegionName = string.Join(" · ", locationParts)
        };

        if (!string.IsNullOrEmpty(ip))
        {
            _cache.TryAdd(ip, finalLoc);
        }

        return finalLoc;
    }

    private static (string CountryCode, string State, string City)? QueryOnlineGeoIp(string ip)
    {
        try
        {
            var resp = _httpClient.GetFromJsonAsync<IpApiResponse>($"http://ip-api.com/json/{ip}?lang=pt-BR").GetAwaiter().GetResult();
            if (resp != null && resp.Status == "success")
            {
                return (resp.CountryCode ?? "BR", resp.RegionName ?? "", resp.City ?? "");
            }
        }
        catch
        {
            // fallback secundário
            try
            {
                var resp2 = _httpClient.GetFromJsonAsync<IpWhoisResponse>($"https://ipwho.is/{ip}").GetAwaiter().GetResult();
                if (resp2 != null && resp2.Success)
                {
                    return (resp2.CountryCode ?? "BR", resp2.Region ?? "", resp2.City ?? "");
                }
            }
            catch { }
        }
        return null;
    }

    private static bool IsLocalIp(string ip)
    {
        return ip == "127.0.0.1" || ip == "::1" || ip.StartsWith("10.") || ip.StartsWith("192.168.") || ip.StartsWith("172.");
    }

    private sealed class IpApiResponse
    {
        [JsonPropertyName("status")] public string Status { get; set; } = "";
        [JsonPropertyName("countryCode")] public string CountryCode { get; set; } = "";
        [JsonPropertyName("regionName")] public string RegionName { get; set; } = "";
        [JsonPropertyName("city")] public string City { get; set; } = "";
    }

    private sealed class IpWhoisResponse
    {
        [JsonPropertyName("success")] public bool Success { get; set; }
        [JsonPropertyName("country_code")] public string CountryCode { get; set; } = "";
        [JsonPropertyName("region")] public string Region { get; set; } = "";
        [JsonPropertyName("city")] public string City { get; set; } = "";
    }
}