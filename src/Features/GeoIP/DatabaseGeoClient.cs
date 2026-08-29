using MaxMind.GeoIP2;

namespace Aptabase.Features.GeoIP;

public class DatabaseGeoClient : GeoIPClient
{
    private readonly DatabaseReader _db;

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

        // 3. Fallback ou enriquecimento via banco MaxMind GeoLite2-City local
        if (!string.IsNullOrEmpty(ip) && (string.IsNullOrEmpty(cityName) || string.IsNullOrEmpty(country)))
        {
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
        }

        var locationParts = new List<string>();
        if (!string.IsNullOrEmpty(cityName)) locationParts.Add(cityName);
        if (!string.IsNullOrEmpty(state)) locationParts.Add(state);

        return new GeoLocation
        {
            CountryCode = country,
            RegionName = string.Join(" · ", locationParts)
        };
    }
}