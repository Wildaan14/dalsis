import ee
import pandas as pd
import numpy as np
import os

# ======================================================================
# CONFIGURATION
# ======================================================================
# Ganti dengan Project ID GEE Anda
PROJECT_ID = 'itali-490108' 
OUTPUT_FILE = 'd:/DALSIS-AI/backend/data/data_iklim_jabar_2025.csv'

def run_extraction():
    print("Inisialisasi Google Earth Engine...")
    try:
        # Gunakan ee.Authenticate() secara manual di terminal jika belum dilakukan
        ee.Initialize(project=PROJECT_ID)
        print(f"Berhasil terhubung ke GEE Project: {PROJECT_ID}")
    except Exception as e:
        print(f"Gagal Inisialisasi GEE: {e}")
        print("Pastikan Anda sudah menjalankan 'ee.Authenticate()' di terminal.")
        return

    # Batas wilayah 27 kab/kota Jawa Barat
    print("Mengambil batas wilayah Jawa Barat (FAO GAUL Level 2)...")
    jabar = ee.FeatureCollection("FAO/GAUL/2015/level2") \
              .filter(ee.Filter.eq('ADM1_NAME', 'Jawa Barat'))

    results = []

    print("Memulai ekstraksi data bulanan Januari - Desember 2025...")
    for month in range(1, 13):
        start_date = f'2025-{month:02d}-01'
        # Akhir bulan aman
        end_date = f'2025-{month:02d}-28'
        
        print(f"  |-- Memproses Bulan: {month:02d}/2025...")

        # 1. ERA5: Suhu & Kelembaban (Monthly Aggregated)
        era5 = (ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY_AGGR')
                  .filterDate(start_date, end_date)
                  .first()
                  .select(['temperature_2m', 'dewpoint_temperature_2m']))

        # 2. MODIS LST (Siang hari, resolusi 1km)
        lst = (ee.ImageCollection('MODIS/061/MOD11A2')
                  .filterDate(start_date, end_date)
                  .select('LST_Day_1km')
                  .mean()
                  .multiply(0.02).subtract(273.15)) # Scale + K to C

        # 3. CHIRPS: Curah Hujan (Total Bulanan)
        rain = (ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
                  .filterDate(start_date, end_date)
                  .select('precipitation')
                  .sum()) # mm/month

        # 4. MODIS NDVI: Ketersediaan Pakan
        ndvi = (ee.ImageCollection('MODIS/061/MOD13A3')
                  .filterDate(start_date, end_date)
                  .select('NDVI')
                  .mean()
                  .multiply(0.0001)) # Scale factor

        # Gabungkan semua band ke satu image untuk reduceRegions
        combined = era5.addBands([
            lst.rename('LST'), 
            rain.rename('rain'), 
            ndvi.rename('NDVI')
        ])

        # Hitung rata-rata per kab/kota (District Level)
        stats = combined.reduceRegions(
            collection=jabar, 
            reducer=ee.Reducer.mean(), 
            scale=1000
        ).getInfo()

        for feat in stats['features']:
            prop = feat['properties']
            
            # Konversi Kelvin ke Celsius dengan penanganan None
            T_K = prop.get('temperature_2m')
            Td_K = prop.get('dewpoint_temperature_2m')
            
            if T_K is None or Td_K is None:
                T_C = 25.0
                Td_C = 20.0
            else:
                T_C = T_K - 273.15
                Td_C = Td_K - 273.15

            # Hitung Kelembaban Relatif (RH)
            try:
                RH = 100 * np.exp(17.625 * Td_C / (243.04 + Td_C)) / \
                           np.exp(17.625 * T_C / (243.04 + T_C))
            except:
                RH = 80.0

            # Hitung THI
            THI = (1.8 * T_C + 32) - (0.55 - 0.0055 * RH) * ((1.8 * T_C + 32) - 58)

            # Penanganan None untuk LST, Rain, NDVI
            val_lst = prop.get('LST')
            val_rain = prop.get('rain')
            val_ndvi = prop.get('NDVI')
            
            val_lst = round(val_lst, 2) if val_lst is not None else 0.0
            val_rain = round(val_rain, 1) if val_rain is not None else 0.0
            val_ndvi = round(val_ndvi, 4) if val_ndvi is not None else 0.0

            # Klasifikasi Risiko Heat Stress
            if THI <= 72:
                risk = 0  # Normal
            elif THI <= 79:
                risk = 1  # Stres Ringan
            else:
                risk = 2  # Stres Sedang/Parah

            results.append({
                'kab_kota': prop.get('ADM2_NAME'),
                'bulan': month,
                'T_celsius': round(T_C, 2),
                'RH_persen': round(RH, 2),
                'THI': round(THI, 2),
                'LST_celsius': val_lst,
                'curah_hujan': val_rain,
                'NDVI': val_ndvi,
                'risk_category': risk
            })

    # Simpan ke CSV
    df_iklim = pd.DataFrame(results)
    df_iklim.to_csv(OUTPUT_FILE, index=False)
    
    print("\n" + "="*50)
    print(f"EKSTRAKSI SELESAI!")
    print(f"Output tersimpan di: {OUTPUT_FILE}")
    print(f"Total baris data: {len(df_iklim)} (Target: 324)")
    print("="*50)
    print(df_iklim.head())

if __name__ == "__main__":
    run_extraction()
