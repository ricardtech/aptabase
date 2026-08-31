using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

namespace Aptabase.Features;

[ApiController]
public class VersionController : ControllerBase
{
    [HttpGet("/api/version")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public IActionResult GetVersion()
    {
        try
        {
            // 1. Tenta ler do version.json gerado no wwwroot (produção)
            var wwwrootVersion = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "version.json");
            if (System.IO.File.Exists(wwwrootVersion))
            {
                var content = System.IO.File.ReadAllText(wwwrootVersion);
                var match = Regex.Match(content, @"""version""\s*:\s*""([^""]+)""");
                if (match.Success)
                {
                    return Ok(new { version = match.Groups[1].Value });
                }
            }

            // 2. Tenta ler diretamente do version.ts (em dev/source)
            var paths = new[]
            {
                Path.Combine(Directory.GetCurrentDirectory(), "webapp", "version.ts"),
                Path.Combine(Directory.GetCurrentDirectory(), "src", "webapp", "version.ts"),
            };

            foreach (var p in paths)
            {
                if (System.IO.File.Exists(p))
                {
                    var content = System.IO.File.ReadAllText(p);
                    var match = Regex.Match(content, @"APP_VERSION\s*=\s*""([^""]+)""");
                    if (match.Success)
                    {
                        return Ok(new { version = match.Groups[1].Value });
                    }
                }
            }
        }
        catch { }

        return Ok(new { version = "v2.0.4" });
    }
}
