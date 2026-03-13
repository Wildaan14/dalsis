import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

# ======================================================================
# CONFIGURATION
# ======================================================================
MRV_PATH = 'd:/DALSIS-AI/backend/data/mrv_output.csv'
DSS_PATH = 'd:/DALSIS-AI/backend/data/dss_policy_recommendations.csv'
OUTPUT_DIR = 'd:/DALSIS-AI/DALSIS_ProyekLomba/03_outputs'

def run_visualization():
    print("Menghasilkan Visualisasi Analisis Regional...")
    
    if not os.path.exists(DSS_PATH):
        print("Error: File DSS belum tersedia.")
        return

    df = pd.read_csv(DSS_PATH)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. Plot Emisi CO2eq per Kab/Kota
    plt.figure(figsize=(12, 8))
    df_sorted = df.sort_values('total_CO2eq_ton', ascending=False)
    
    # Warna berdasarkan Tier
    colors = df_sorted['tier_emisi'].map({'MERAH': '#e53935', 'KUNING': '#fb8c00', 'HIJAU': '#43a047'})
    
    sns.barplot(data=df_sorted, x='total_CO2eq_ton', y='nama_wilayah', hue='nama_wilayah', palette=list(colors), legend=False)
    plt.title('Estimasi Emisi GRK Sektor Peternakan per Kab/Kota 2025', fontsize=14, fontweight='bold')
    plt.xlabel('Total Emisi (tCO2eq / Tahun)')
    plt.ylabel('Kabupaten / Kota')
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'regional_emission_ranking.png'), dpi=150)
    print("Visualisasi Ranking Emisi tersimpan.")

    # 2. Matrix Prioritas Intervensi (Heatmap logic)
    plt.figure(figsize=(8, 6))
    pivot_table = pd.crosstab(df['tier_emisi'], df['risk_category'])
    # Reorder index to Red -> Yellow -> Green
    pivot_table = pivot_table.reindex(['MERAH', 'KUNING', 'HIJAU']).fillna(0)
    sns.heatmap(pivot_table, annot=True, cmap='YlOrRd', fmt='g')
    plt.title('Distribusi Prioritas Wilayah (Emisi vs Risiko Panas)')
    plt.xlabel('Kategori Risiko AI (0=Normal, 2=Severe)')
    plt.ylabel('Tier Emisi MRV')
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'priority_matrix_heatmap.png'), dpi=150)
    print("Visualisasi Matriks Prioritas tersimpan.")

    print("\nVisualisasi selesai. Semua file ada di folder 03_outputs/")

if __name__ == "__main__":
    run_visualization()
