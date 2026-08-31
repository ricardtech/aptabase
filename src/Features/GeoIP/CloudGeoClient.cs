using System.Text.Json;

namespace Aptabase.Features.GeoIP;

public class CloudGeoClient : GeoIPClient
{
    private readonly Dictionary<string, string> _regions;

    public CloudGeoClient(EnvSettings env)
        : base(env)
    {
        var text = File.ReadAllText(Path.Combine(env.EtcDirectoryPath, "geoip/iso3166-2.json"));
        var regions = JsonSerializer.Deserialize<Dictionary<string, string>>(text);
        if (regions == null)
            throw new Exception("Failed to deserialize geoip/iso3166-2.json");

        _regions = regions;
    }

    public override GeoLocation GetClientLocation(HttpContext httpContext, string? clientIp = null)
    {
        var countryCode = GetHeader(httpContext, "cdn-requestcountrycode", "CloudFront-Viewer-Country", "CF-IPCountry");
        var regionCode = GetHeader(httpContext, "cdn-requeststatecode", "Cloudfront-Viewer-Country-Region");
        var regionName = _regions.TryGetValue($"{countryCode}-{regionCode}", out var name) ? name : "";
        var cityName = httpContext.Request.Headers["CF-IPCity"].ToString() ?? "";

        var locationParts = new List<string>();
        if (!string.IsNullOrEmpty(cityName)) locationParts.Add(cityName);
        if (!string.IsNullOrEmpty(regionName)) locationParts.Add(regionName);

        return new GeoLocation
        {
            CountryCode = countryCode ?? "",
            RegionName = string.Join(" · ", locationParts)
        };
    }

    private static string GetHeader(HttpContext httpContext, params string[] names)
    {
        foreach (var name in names)
        {
            var value = httpContext.Request.Headers[name].ToString()?.ToUpper() ?? "";
            if (!string.IsNullOrEmpty(value))
                return value;
        }

        return "";
    }
}