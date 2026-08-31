using System.Data.Common;
using System.Xml.Linq;
using Dapper;
using Microsoft.AspNetCore.DataProtection.Repositories;

namespace Aptabase.Data;

public class PostgreSqlXmlRepository : IXmlRepository
{
    private readonly DbDataSource _dataSource;

    public PostgreSqlXmlRepository(DbDataSource dataSource)
    {
        _dataSource = dataSource ?? throw new ArgumentNullException(nameof(dataSource));
    }

    public IReadOnlyCollection<XElement> GetAllElements()
    {
        try
        {
            using var conn = _dataSource.CreateConnection();
            conn.Open();
            var rows = conn.Query<string>("SELECT xml FROM data_protection_keys;");
            var list = new List<XElement>();
            foreach (var xml in rows)
            {
                if (!string.IsNullOrWhiteSpace(xml))
                {
                    try
                    {
                        list.Add(XElement.Parse(xml));
                    }
                    catch { }
                }
            }
            return list.AsReadOnly();
        }
        catch
        {
            return Array.Empty<XElement>();
        }
    }

    public void StoreElement(XElement element, string friendlyName)
    {
        if (element == null) throw new ArgumentNullException(nameof(element));

        try
        {
            using var conn = _dataSource.CreateConnection();
            conn.Open();
            var id = !string.IsNullOrWhiteSpace(friendlyName) ? friendlyName : Guid.NewGuid().ToString();
            var xml = element.ToString(SaveOptions.DisableFormatting);
            conn.Execute(
                @"INSERT INTO data_protection_keys (id, xml) 
                  VALUES (@id, @xml) 
                  ON CONFLICT (id) DO UPDATE SET xml = EXCLUDED.xml;",
                new { id, xml });
        }
        catch
        {
            // Ignora falha de concorrencia
        }
    }
}
