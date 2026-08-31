CREATE OR REPLACE VIEW sessions_live_v1
AS
SELECT
    app_id,
    session_id,
    user_id,
    minSimpleState(e.timestamp) AS min_timestamp,
    maxSimpleState(e.timestamp) AS max_timestamp,
    argMaxState(os_name, e.timestamp) AS os_name,
    argMaxState(os_version, e.timestamp) AS os_version,
    argMaxState(locale, e.timestamp) AS locale,
    argMaxState(app_version, e.timestamp) AS app_version,
    argMaxState(app_build_number, e.timestamp) AS app_build_number,
    argMaxState(engine_name, e.timestamp) AS engine_name,
    argMaxState(engine_version, e.timestamp) AS engine_version,
    argMaxState(sdk_version, e.timestamp) AS sdk_version,
    argMaxState(country_code, e.timestamp) AS country_code,
    argMaxState(region_name, e.timestamp) AS region_name,
    countState() AS events_count,
    groupArrayState(event_name) AS events_name,
    groupArrayState(e.timestamp) AS events_timestamp,
    groupArrayState(string_props) AS events_string_props,
    groupArrayState(numeric_props) AS events_numeric_props
FROM events AS e
GROUP BY
    app_id,
    session_id,
    user_id