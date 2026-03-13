import pandas as pd
import numpy as np
import os

# ======================================================================
# CONFIGURATION
# ======================================================================
FILE_IKLIM_PATH  = 'd:/DALSIS-AI/backend/data/data_iklim_jabar_2025.csv'
FILE_BPS_PATH    = 'd:/DALSIS-AI/DALSIS_ProyekLomba/bps_populasi_jabar.xlsx'
OUTPUT_PATH      = 'd:/DALSIS-AI/backend/data/dataset_dalsis_final_2025.csv'

# Luas wilayah (km2) - Data BPS 2025
LUAS_KM2 = {
    'Kabupaten Bogor': 2995, 'Kabupaten Sukabumi': 4162, 'Kabupaten Cianjur': 3480,
    'Kabupaten Bandung': 1768, 'Kabupaten Garut': 3065, 'Kabupaten Tasikmalaya': 2651,
    'Kabupaten Ciamis': 1433, 'Kabupaten Kuningan': 1117, 'Kabupaten Cirebon': 984,
    'Kabupaten Majalengka': 1204, 'Kabupaten Sumedang': 1522, 'Kabupaten Indramayu': 2099,
    'Kabupaten Subang': 1883, 'Kabupaten Purwakarta': 825, 'Kabupaten Karawang': 1652,
    'Kabupaten Bekasi': 1274, 'Kabupaten Bandung Barat': 1305, 'Kabupaten Pangandaran': 1010,
    'Kota Bogor': 118, 'Kota Sukabumi': 48, 'Kota Bandung': 168, 'Kota Cirebon': 37,
    'Kota Bekasi': 210, 'Kota Depok': 200, 'Kota Cimahi': 40, 'Kota Tasikmalaya': 184, 
    'Kota Banjar': 114
}

def run_merge():
    print("Memulai penggabungan data GEE dan BPS...")
    
    if not os.path.exists(FILE_IKLIM_PATH) or not os.path.exists(FILE_BPS_PATH):
        print(f"Error: {FILE_IKLIM_PATH} atau {FILE_BPS_PATH} tidak ditemukan!")
        return

    df_iklim = pd.read_csv(FILE_IKLIM_PATH)
    df_bps   = pd.read_excel(FILE_BPS_PATH)

    print(f"Data Iklim: {len(df_iklim)} baris")
    print(f"Data BPS: {len(df_bps)} wilayah")

    # 1. Persiapkan Fitur BPS
    df_bps['luas_km2']     = df_bps['nama_wilayah'].map(LUAS_KM2)
    df_bps['total_ternak']  = df_bps[['sapi_potong','sapi_perah','kambing','domba','kerbau']].sum(axis=1)
    df_bps['densitas_ternak'] = df_bps['total_ternak'] / df_bps['luas_km2']
    df_bps['proporsi_sapi_perah'] = df_bps['sapi_perah'] / df_bps['total_ternak'].replace(0, 1)

    # 2. Normalisasi Nama Wilayah untuk Kelancaran Merge
    print("Normalisasi nama wilayah...")
    def clean_name(name):
        name = str(name).lower()
        for prefix in ['kabupaten ', 'kota ', 'kab. ']:
            name = name.replace(prefix, '')
        return name.strip()

    df_iklim['clean_name'] = df_iklim['kab_kota'].apply(clean_name)
    df_bps['clean_name'] = df_bps['nama_wilayah'].apply(clean_name)

    # 3. Merge Data
    df = df_iklim.merge(
        df_bps[['clean_name', 'nama_wilayah', 'total_ternak', 'densitas_ternak', 'proporsi_sapi_perah']],
        on='clean_name',
        how='left'
    )

    # 3. Feature Engineering: Siklus Temporal (Sin/Cos Encoding)
    print("Melakukan encoding siklus temporal (Bulan)...")
    df['bulan_sin'] = np.sin(2 * np.pi * df['bulan'] / 12)
    df['bulan_cos'] = np.cos(2 * np.pi * df['bulan'] / 12)

    # 4. Final Cleanup
    df = df.dropna(subset=['total_ternak'])
    df.to_csv(OUTPUT_PATH, index=False)

    print(f"\n==================================================")
    print(f"PENGGABUNGAN SELESAI!")
    print(f"Output tersimpan di: {OUTPUT_PATH}")
    print(f"Dataset Final Shape: {df.shape}")
    print("="*50)
    print(df.head())

if __name__ == "__main__":
    run_merge()
