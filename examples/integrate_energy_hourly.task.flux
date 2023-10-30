import "date"

// Run every hour
option task = {name: "eachwatt_integrate_hourly", cron: "0 * * * *"}

// Change the bucket and organization name to match your setup
from(bucket: "eachwatt")
    // Always start from 00:00:00 each day
    |> range(start: date.truncate(t: -24h, unit: 1h))
    // Focus on watts
    |> filter(fn: (r) => r["_measurement"] == "power")
    |> filter(fn: (r) => r["_field"] == "power")
    // Aggregate into one hour windows (since we're dealing with kilowatthours)
    |> aggregateWindow(
        every: 1h,
        fn: (tables=<-, column) =>
            tables
                // 1 hour, again
                |> integral(unit: 1h)
                // Convert watthours to kilowatthours, change field name to "kwh"
                |> map(fn: (r) => ({r with _field: "kwh", _value: r._value / 1000.0}))
                // Change _measurement to "energy"
                |> set(key: "_measurement", value: "energy"),
    )
    |> to(bucket: "eachwatt", org: "my-org")
