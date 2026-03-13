import pandas as pd
import os

# ======================================================================
# CONFIGURATION
# ======================================================================
FILE_AI_PATH = 'd:/DALSIS-AI/backend/data/ai_output_per_kota.csv'
MRV_PATH     = 'd:/DALSIS-AI/backend/data/mrv_output.csv'
DSS_PATH     = 'd:/DALSIS-AI/backend/data/dss_policy_recommendations.csv'

def run_dss_engine():
    print("Memulai DSS Policy Recommendation Engine...")
    
    if not os.path.exists(FILE_AI_PATH) or not os.path.exists(MRV_PATH):
        print("Error: File input (AI/MRV) belum lengkap. Jalankan tahap 3 & 4.")
        return

    df_ai  = pd.read_csv(FILE_AI_PATH)
    df_mrv = pd.read_csv(MRV_PATH)

    # Gabungkan data untuk analisis komprehensif (rata-rata tahunan AI risk)
    df_ai_agg = df_ai.groupby('kab_kota')['risk_category'].max().reset_index()
    
    df_dss = df_mrv.merge(df_ai_agg, left_on='nama_wilayah', right_on='kab_kota', how='left')

    def generate_recommendation(row):
        tier = row['tier_emisi']
        risk = row['risk_category']
        
        # Matrix 3x3 Decision Logic
        if tier == 'MERAH':
            if risk >= 2:
                return 'DARURAT: (1) Wajib lapor SIGN-SMART, (2) Subsidi biodigester komunal, (3) Aktivasi Heat Alert SMS, (4) Mobilisasi Dokter Hewan.'
            elif risk == 1:
                return 'WARNING: (1) Program mitigasi emisi intensif, (2) Sosialisasi manajemen ventilasi kandang, (3) Pantau tren THI mingguan.'
            else:
                return 'MODERAT: (1) Prioritas mitigasi emisi (Biodigester/3-NOP), (2) Monitoring emisi berkala, (3) Roadmap NDC Kab/Kota.'
        
        elif tier == 'KUNING':
            if risk >= 2:
                return 'WARNING: (1) Protokol adaptasi panas, (2) Fasilitasi akses hijauan (NDVI), (3) Monitor emisi agar tidak naik ke Merah.'
            elif risk == 1:
                return 'MODERAT: (1) Sosialisasi best practice manajemen panas, (2) Monitoring emisi rutin, (3) Efisiensi pakan.'
            else:
                return 'NORMAL: (1) Monitoring emisi berkala, (2) Sosialisasi efisiensi pakan rendah emisi.'
        
        else: # HIJAU
            if risk >= 2:
                return 'MODERAT: (1) Waspada musim kemarau, (2) Siapkan intervensi adaptasi meskipun emisi rendah.'
            elif risk == 1:
                return 'NORMAL: (1) Update sistem EWS periodik, (2) Monitoring ketersediaan pakan.'
            else:
                return 'OPTIMAL: (1) Daftarkan ke mekanisme kredit karbon nasional, (2) Pertahankan manajemen yang ada.'

    df_dss['rekomendasi_kebijakan'] = df_dss.apply(generate_recommendation, axis=1)

    # Tambahkan Kolom Prioritas
    def get_priority(row):
        if row['tier_emisi'] == 'MERAH' and row['risk_category'] >= 1: return 'ALERT: DARURAT'
        if row['tier_emisi'] == 'MERAH' or row['risk_category'] >= 2: return 'WARNING: TINGGI'
        if row['tier_emisi'] == 'KUNING' or row['risk_category'] == 1: return 'MODERAT'
        return 'NORMAL'

    df_dss['status_prioritas'] = df_dss.apply(get_priority, axis=1)

    df_dss = df_dss[['nama_wilayah', 'total_CO2eq_ton', 'tier_emisi', 'risk_category', 'status_prioritas', 'rekomendasi_kebijakan']]
    df_dss.to_csv(DSS_PATH, index=False)

    print("\n" + "="*75)
    print("CONTOH REKOMENDASI KEBIJAKAN DALSIS PER WILAYAH")
    print("="*75)
    for _, r in df_dss.head(10).iterrows():
        print(f"[{r['status_prioritas']}] {r['nama_wilayah']} | MRV: {r['tier_emisi']}")
        print(f"   Rekomendasi: {r['rekomendasi_kebijakan']}\n")
    
    print(f"Output DSS tersimpan di: {DSS_PATH}")

if __name__ == "__main__":
    run_dss_engine()
