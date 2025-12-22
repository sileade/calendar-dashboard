# Widgets Research

## SPb Public Transport

### Source: transport.orgp.spb.ru

The official St. Petersburg transport portal provides GTFS data and real-time forecasts.

**NPM Package:** `orgp` (https://www.npmjs.com/package/orgp)

**Key Methods:**
- `getRoutes()` - Returns all routes from GTFS feed
- `getStops()` - Returns all stops from GTFS feed
- `getNearestStops(radius, lat, lon)` - Returns stops within radius
- `getForecastByStopId(id, callback)` - Returns real-time arrival forecast

**Data Source:**
- GTFS feed: http://transport.orgp.spb.ru/Portal/transport/internalapi/gtfs/feed.zip
- Real-time API: transport.orgp.spb.ru

## Yandex Traffic

### Source: Yandex Maps JavaScript API 2.1

**Provider:** `ymaps.traffic.provider.Actual`

**Key Features:**
- Real-time traffic data
- Traffic level (0-10 points)
- Traffic events layer
- Auto-update every 4 minutes

**State Fields:**
- `isInited` - Provider ready flag
- `level` - Traffic level (0-10)
- `localtime` - Local time (HH:MM)
- `timestamp` - UTC timestamp
- `infoLayerShown` - Events layer flag

**Usage Example:**
```javascript
var actualProvider = new ymaps.traffic.provider.Actual({}, {infoLayerShown: true});
actualProvider.setMap(myMap);

actualProvider.state.events.add('change', function () {
    var level = actualProvider.state.get('level');
    console.log('Traffic level:', level);
});
```

**API Key:** Required for commercial use, free tier available
