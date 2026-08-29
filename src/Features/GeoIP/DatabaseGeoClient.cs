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
        var ip = httpContext.ResolveClientIpAddress();
        
        if (string.IsNullOrEmpty(ip))
            return GeoLocation.Empty;

        if (_db.TryCity(ip, out var city) && city != null)
        {
            var country = city.Country?.IsoCode?.ToUpper() ?? "";
            var state = city.MostSpecificSubdivision?.Name ?? "";
            var cityName = city.City?.Name ?? "";

            var locationParts = new List<string>();
            if (!string.IsNullOrEmpty(cityName)) locationParts.Add(cityName);
            if (!string.IsNullOrEmpty(state)) locationParts.Add(state);

            return new GeoLocation
            {
                CountryCode = country,
                RegionName = string.Join(" · ", locationParts)
            };
        }

        return GeoLocation.Empty;
    }
}