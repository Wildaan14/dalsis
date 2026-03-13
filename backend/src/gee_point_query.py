import ee
import sys
import json
from datetime import datetime, timedelta

# ======================================================================
# CONFIGURATION
# ======================================================================
SERVICE_ACCOUNT = 'dalsis-gee-service@itali-490108.iam.gserviceaccount.com'
JSON_KEY_PATH = 'd:/DALSIS-AI/itali-490108-0a1542717b90.json'

def get_point_data(lat, lon):
    try:
        credentials = ee.ServiceAccountCredentials(SERVICE_ACCOUNT, JSON_KEY_PATH)
        ee.Initialize(credentials, project='itali-490108')
        
        point = ee.Geometry.Point([lon, lat])
        
        # Define date range (last 30 days for median)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        start_str = start_date.strftime('%Y-%m-%d')
        end_str = end_date.strftime('%Y-%m-%d')

        # 1. NDVI (Sentinel-2)
        s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
            .filterBounds(point) \
            .filterDate(start_str, end_str) \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) \
            .median()
        
        ndvi_val = 0
        if s2.bandNames().size().getInfo() > 0:
            ndvi = s2.normalizedDifference(['B8', 'B4']).rename('NDVI')
            stats = ndvi.reduceRegion(reducer=ee.Reducer.mean(), geometry=point, scale=10).getInfo()
            ndvi_val = stats.get('NDVI', 0)

        # 2. LST (MODIS)
        lst_col = ee.ImageCollection('MODIS/061/MOD11A1') \
            .filterBounds(point) \
            .filterDate(start_str, end_str) \
            .select('LST_Day_1km') \
            .median()
        
        lst_val = 0
        if lst_col.bandNames().size().getInfo() > 0:
            lst_c = lst_col.multiply(0.02).subtract(273.15).rename('LST')
            stats = lst_c.reduceRegion(reducer=ee.Reducer.mean(), geometry=point, scale=1000).getInfo()
            lst_val = stats.get('LST', 0)

        # 3. ERA5-Land (Temp & Humidity)
        era5 = ee.ImageCollection("ECMWF/ERA5_LAND/HOURLY") \
            .filterBounds(point) \
            .filterDate(start_str, end_str) \
            .select(['temperature_2m', 'dewpoint_temperature_2m']) \
            .median()
        
        air_temp = 0
        humidity = 0
        if era5.bandNames().size().getInfo() > 0:
            t_air_img = era5.select('temperature_2m').subtract(273.15)
            td_air_img = era5.select('dewpoint_temperature_2m').subtract(273.15)
            rh_img = td_air_img.expression(
                '100 * (exp((17.625 * td) / (243.04 + td)) / exp((17.625 * t) / (243.04 + t)))',
                {'t': t_air_img, 'td': td_air_img}
            ).rename('RH')
            
            stats = ee.Image.cat([t_air_img.rename('T'), rh_img]).reduceRegion(
                reducer=ee.Reducer.mean(), geometry=point, scale=10000
            ).getInfo()
            air_temp = stats.get('T', 0)
            humidity = stats.get('RH', 0)

        result = {
            "lat": lat,
            "lon": lon,
            "air_temp_c": round(air_temp, 2) if air_temp else 0,
            "humidity_rh": round(humidity, 1) if humidity else 0,
            "ndvi_pakan": round(ndvi_val, 4) if ndvi_val else 0,
            "lst_temp_c": round(lst_val, 2) if lst_val else 0,
            "success": True
        }
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) > 2:
        lat_arg = float(sys.argv[1])
        lon_arg = float(sys.argv[2])
        get_point_data(lat_arg, lon_arg)
    else:
        print(json.dumps({"success": False, "error": "No coordinates provided"}))
