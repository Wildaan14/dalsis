import pandas as pd
import numpy as np
import os

# ======================================================================
# CONFIGURATION
# ======================================================================
FILE_BPS_PATH = 'd:/DALSIS-AI/DALSIS_ProyekLomba/bps_populasi_jabar.xlsx'
OUTPUT_PATH   = 'd:/DALSIS-AI/backend/data/mrv_output.csv'

# Emission Factors IPCC 2019 Table 10.11 - Southeast Asia (kg/head/year)
EF = {
    'sapi_potong': {'enteric': 47.0,  'manure_ch4': 1.0,  'manure_n2o': 0.66},
    'sapi_perah':  {'enteric': 118.0, 'manure_ch4': 16.0, 'manure_n2o': 1.18},
    'kerbau':      {'enteric': 55.0,  'manure_ch4': 2.0,  'manure_n2o': 0.50},
    'kambing':     {'enteric': 5.0,   'manure_ch4': 0.17, 'manure_n2o': 0.16},
    'domba':       {'enteric': 5.0,   'manure_ch4': 0.28, 'manure_n2o': 0.16},
}

# GWP Factors from IPCC AR6 (2021)
GWP_CH4 = 28
GWP_N2O = 265

def run_mrv_pipeline():
    print("Memulai Perhitungan Emisi MRV (IPCC Tier 1)...")
    
    if not os.path.exists(FILE_BPS_PATH):
        print(f"Error: {FILE_BPS_PATH} tidak ditemukan!")
        return

    df_bps = pd.read_excel(FILE_BPS_PATH)

    # 1. Hitung Emisi per Spesies
    for species, ef in EF.items():
        if species in df_bps.columns:
            # Entry: kg to ton
            df_bps[f'E_enteric_{species}']    = df_bps[species] * ef['enteric']    / 1000
            df_bps[f'E_manure_ch4_{species}'] = df_bps[species] * ef['manure_ch4'] / 1000
            df_bps[f'E_manure_n2o_{species}'] = df_bps[species] * ef['manure_n2o'] / 1000

    # 2. Aggregasi Total
    ch4_cols = [c for c in df_bps.columns if 'E_enteric' in c or 'E_manure_ch4' in c]
    n2o_cols = [c for c in df_bps.columns if 'E_manure_n2o' in c]

    df_bps['total_CH4_ton']   = df_bps[ch4_cols].sum(axis=1)
    df_bps['total_N2O_ton']   = df_bps[n2o_cols].sum(axis=1)
    
    # 3. Konversi ke CO2eq (IPCC AR6)
    df_bps['total_CO2eq_ton'] = (df_bps['total_CH4_ton'] * GWP_CH4) + \
                                (df_bps['total_N2O_ton'] * GWP_N2O)
    
    df_bps['total_ternak']    = df_bps[list(EF.keys())].sum(axis=1)
    df_bps['GHG_intensity']   = df_bps['total_CO2eq_ton'] / df_bps['total_ternak'].replace(0, 1)

    # 4. Kategorisasi Tier Emisi
    def get_tier(x):
        if x > 500:   return 'MERAH'
        elif x > 200: return 'KUNING'
        else:         return 'HIJAU'
    
    df_bps['tier_emisi'] = df_bps['total_CO2eq_ton'].apply(get_tier)

    # 5. Skenario Mitigasi (DALSIS Policy Engine)
    total_jabar = df_bps['total_CO2eq_ton'].sum()
    ch4_manure  = df_bps[[c for c in df_bps.columns if 'manure_ch4' in c]].sum().sum()
    ch4_enteric = df_bps[[c for c in df_bps.columns if 'E_enteric' in c]].sum().sum()

    # S1: Biodigester (-50% Manure CH4)
    reduksi_s1 = ch4_manure * 0.50 * GWP_CH4
    # S2: 3-NOP Dietary Supplement (-30% Enteric CH4)
    reduksi_s2 = ch4_enteric * 0.30 * GWP_CH4
    
    df_bps.to_csv(OUTPUT_PATH, index=False)

    print("\n" + "="*55)
    print("HASIL ANALISIS EMISI ESTIMASI JAWA BARAT")
    print("="*55)
    print(f"Total Emisi Wilayah     : {total_jabar:,.0f} tCO2eq/thn")
    print(f"Reduksi S1 (Biodigester): {reduksi_s1:,.0f} tCO2eq/thn")
    print(f"Reduksi S2 (3-NOP)      : {reduksi_s2:,.0f} tCO2eq/thn")
    print(f"Potensi Reduksi Total   : {reduksi_s1 + reduksi_s2:,.0f} tCO2eq/thn")
    print(f"Kontribusi ke NDC (Est) : {(reduksi_s1 + reduksi_s2) / 12800000 * 100:.2f}%")
    print("="*55)
    print(f"Output MRV tersimpan di: {OUTPUT_PATH}")

if __name__ == "__main__":
    run_mrv_pipeline()
