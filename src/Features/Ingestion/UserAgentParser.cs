using System.Text.RegularExpressions;

namespace Aptabase.Features.Ingestion;

public static class UserAgentParser
{
    private static readonly (string pattern, string name)[] LinuxDistros = new[]
    {
        (@"biglinux(?:[\/\s-]([0-9\._a-zA-Z-]+))?", "BigLinux"),
        (@"manjaro(?:[\/\s-]([0-9\._a-zA-Z-]+))?", "Manjaro Linux"),
        (@"arch(?:\s*linux)?(?:[\/\s-]([0-9\._a-zA-Z-]+))?", "Arch Linux"),
        (@"ubuntu(?:[\/\s-]([0-9\.]+))?", "Ubuntu Linux"),
        (@"debian(?:[\/\s-]([0-9\.]+))?", "Debian Linux"),
        (@"fedora(?:[\/\s-]([0-9\.]+))?", "Fedora Linux"),
        (@"linux\s*mint(?:[\/\s-]([0-9\.]+))?", "Linux Mint"),
        (@"mint(?:[\/\s-]([0-9\.]+))?", "Linux Mint"),
        (@"pop!_os|pop-os(?:[\/\s-]([0-9\.]+))?", "Pop!_OS"),
        (@"zorin(?:[\/\s-]([0-9\.]+))?", "Zorin OS"),
        (@"kali(?:[\/\s-]([0-9\.]+))?", "Kali Linux"),
        (@"opensuse(?:[\/\s-]([0-9\.]+))?", "openSUSE"),
        (@"centos(?:[\/\s-]([0-9\.]+))?", "CentOS"),
        (@"red\s*hat|rhel(?:[\/\s-]([0-9\.]+))?", "Red Hat Enterprise Linux"),
        (@"gentoo", "Gentoo Linux"),
        (@"alpine", "Alpine Linux"),
        (@"void\s*linux", "Void Linux"),
        (@"cros\s+[^\s]+\s+([0-9\.]+)", "ChromeOS"),
    };

    public static (string, string) ParseOperatingSystem(string userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
            return ("", "");

        var ua = userAgent;

        // 1. Android & Android TV & Downloader AFTVnews
        if (ua.Contains("Downloader", StringComparison.OrdinalIgnoreCase))
        {
            return ("Android TV / FireTV", "Downloader AFTVnews");
        }

        if (ua.Contains("Android", StringComparison.OrdinalIgnoreCase))
        {
            var isTv = ua.Contains("Android TV", StringComparison.OrdinalIgnoreCase) || 
                       ua.Contains("BRAVIA", StringComparison.OrdinalIgnoreCase) || 
                       ua.Contains("AFT", StringComparison.OrdinalIgnoreCase) ||
                       ua.Contains("SmartTV", StringComparison.OrdinalIgnoreCase);
            
            var osName = isTv ? "Android TV" : "Android";
            var match = Regex.Match(ua, @"Android\s+([0-9\.]+)", RegexOptions.IgnoreCase);
            var version = match.Success ? match.Groups[1].Value : "14.0";
            return (osName, version);
        }

        // 2. iPadOS & iOS
        if (ua.Contains("iPad", StringComparison.OrdinalIgnoreCase))
        {
            var match = Regex.Match(ua, @"OS\s+([0-9_]+)", RegexOptions.IgnoreCase);
            var version = match.Success ? match.Groups[1].Value.Replace('_', '.') : "17.0";
            return ("iPadOS", version);
        }

        if (ua.Contains("iPhone", StringComparison.OrdinalIgnoreCase) || ua.Contains("iPod", StringComparison.OrdinalIgnoreCase))
        {
            var match = Regex.Match(ua, @"OS\s+([0-9_]+)", RegexOptions.IgnoreCase);
            var version = match.Success ? match.Groups[1].Value.Replace('_', '.') : "17.0";
            return ("iOS", version);
        }

        // 3. Windows (11, 10, 8.1, 7)
        if (ua.Contains("Windows", StringComparison.OrdinalIgnoreCase))
        {
            if (ua.Contains("Windows NT 10.0", StringComparison.OrdinalIgnoreCase))
            {
                return ("Windows", "10 / 11");
            }
            if (ua.Contains("Windows NT 6.3", StringComparison.OrdinalIgnoreCase)) return ("Windows", "8.1");
            if (ua.Contains("Windows NT 6.2", StringComparison.OrdinalIgnoreCase)) return ("Windows", "8");
            if (ua.Contains("Windows NT 6.1", StringComparison.OrdinalIgnoreCase)) return ("Windows", "7");
            if (ua.Contains("Windows NT 6.0", StringComparison.OrdinalIgnoreCase)) return ("Windows", "Vista");
            if (ua.Contains("Windows NT 5.1", StringComparison.OrdinalIgnoreCase)) return ("Windows", "XP");
            
            var winMatch = Regex.Match(ua, @"Windows NT\s+([0-9\.]+)", RegexOptions.IgnoreCase);
            return ("Windows", winMatch.Success ? winMatch.Groups[1].Value : "10 / 11");
        }

        // 4. macOS
        if (ua.Contains("Mac OS X", StringComparison.OrdinalIgnoreCase) || ua.Contains("Macintosh", StringComparison.OrdinalIgnoreCase))
        {
            var match = Regex.Match(ua, @"Mac OS X\s+([0-9_\.]+)", RegexOptions.IgnoreCase);
            var version = match.Success ? match.Groups[1].Value.Replace('_', '.') : "14.0";
            return ("macOS", version);
        }

        // 5. Linux Distributions
        foreach (var (pattern, name) in LinuxDistros)
        {
            var match = Regex.Match(ua, pattern, RegexOptions.IgnoreCase);
            if (match.Success)
            {
                var version = match.Groups.Count > 1 && match.Groups[1].Success ? match.Groups[1].Value : "Rolling";
                return (name, version);
            }
        }

        if (ua.Contains("Linux", StringComparison.OrdinalIgnoreCase) || ua.Contains("X11", StringComparison.OrdinalIgnoreCase))
        {
            var kernelMatch = Regex.Match(ua, @"Linux\s+([0-9\._a-zA-Z-]+)", RegexOptions.IgnoreCase);
            if (kernelMatch.Success && !kernelMatch.Groups[1].Value.Equals("x86_64", StringComparison.OrdinalIgnoreCase) && !kernelMatch.Groups[1].Value.Equals("i686", StringComparison.OrdinalIgnoreCase))
            {
                return ("Linux", kernelMatch.Groups[1].Value);
            }
            return ("Linux", "6.x (Kernel)");
        }

        return ("Outro", "1.0");
    }


    private static Dictionary<string, string> browserKeys = new Dictionary<string, string>
    {
        { "Edg", "Edge" },
        { "Firefox", "Firefox" },
        { "OPiOS", "Opera" },
        { "OPR", "Opera" },
        { "YaBrowser", "Yandex Browser" },
        { "Brave", "Brave" },
        { "Vivaldi", "Vivaldi" }
    };

    private static Regex browserRegex = new Regex(@"\((?<info>.*?)\)(\s|$)|(?<name>.*?)\/(?<version>.*?)(\s|$)", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    public static (string, string) ParseBrowser(string userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
            return ("", "");

        var matches = browserRegex.Matches(userAgent);

        var chromeVersion = "";
        foreach (Match match in matches)
        {
            var name = match.Groups["name"].Value;
            var version = match.Groups["version"].Value;

            foreach (var (key, prettyName) in browserKeys)
            {
                if (name.Equals(key, StringComparison.OrdinalIgnoreCase))
                    return (prettyName, version);
            }

            if (name.Equals("Chrome", StringComparison.OrdinalIgnoreCase))
                chromeVersion = version;

            if (name.Equals("Safari", StringComparison.OrdinalIgnoreCase))
            {
                var safariVersion = matches.FirstOrDefault(x => x.Groups["name"].Value == "Version")?.Groups["version"].Value ?? "";
                if (!string.IsNullOrEmpty(safariVersion))
                    return ("Safari", safariVersion);
            }
        }

        if (!string.IsNullOrEmpty(chromeVersion))
            return ("Chrome", chromeVersion);

        return ("Navegador Web", "1.0");
    }
}