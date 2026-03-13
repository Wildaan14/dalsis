import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, cohen_kappa_score
import shap
import matplotlib.pyplot as plt
import os

# ======================================================================
# CONFIGURATION
# ======================================================================
INPUDATA_PATH    = 'd:/DALSIS-AI/backend/data/dataset_dalsis_final_2025.csv'
OUTPUT_PRED  = 'd:/DALSIS-AI/backend/data/ai_output_per_kota.csv'
OUTPUT_DIR   = 'd:/DALSIS-AI/DALSIS_ProyekLomba/03_outputs'

def run_ai_training():
    print("Memulai Pelatihan Model AI (District-Level Heat Stress Risk)...")
    
    if not os.path.exists(INPUDATA_PATH):
        print(f"Error: {INPUDATA_PATH} tidak ditemukan! Jalankan tahap 2 terlebih dahulu.")
        return

    df = pd.read_csv(INPUDATA_PATH).dropna()

    FEATURES = [
        'THI', 'LST_celsius', 'curah_hujan', 'NDVI',
        'densitas_ternak', 'proporsi_sapi_perah', 'bulan_sin', 'bulan_cos'
    ]
    X = df[FEATURES].values
    y = df['risk_category'].values

    # 1. Inisialisasi Model Random Forest
    rf = RandomForestClassifier(
        n_estimators=500, 
        max_depth=8, 
        random_state=42, 
        n_jobs=-1
    )

    # 2. Evaluasi 5-Fold Cross Validation (karena dataset kecil ~324 obs)
    print("Mengevaluasi model dengan 5-Fold Cross Validation...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    f1_cv = cross_val_score(rf, X, y, cv=cv, scoring='f1_weighted')
    
    print("\n" + "="*45)
    print(f"RF 5-Fold CV F1-weighted: {f1_cv.mean():.3f} ± {f1_cv.std():.3f}")
    print("="*45)

    # 3. Final Training
    rf.fit(X, y)
    y_pred = rf.predict(X)
    
    print("\nLaporan Klasifikasi (Internal Validation):")
    unique_labels = np.unique(y)
    target_names = ['Normal', 'Ringan', 'Sedang/Parah']
    actual_targets = [target_names[i] for i in unique_labels]
    print(classification_report(y, y_pred, target_names=actual_targets))
    print(f"Cohen's Kappa Score: {cohen_kappa_score(y, y_pred):.3f}")

    # 4. SHAP Analysis (Feature Importance Visualization)
    print("\nMenyusun analisis SHAP...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    explainer = shap.TreeExplainer(rf)
    shap_values = explainer.shap_values(X)

    plt.figure(figsize=(10, 6))
    # SHAP version differences handling
    if isinstance(shap_values, list):
        s_vals = shap_values
    else:
        s_vals = shap_values
        
    shap.summary_plot(s_vals, X, feature_names=FEATURES, plot_type='bar', show=False)
    plt.title("DALSIS: SHAP District-Level Risk Importance")
    plt.tight_layout()
    shap_plot_path = os.path.join(OUTPUT_DIR, 'shap_bar_district.png')
    plt.savefig(shap_plot_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"SHAP Plot tersimpan di: {shap_plot_path}")

    # 5. Prediksi dan Simpan Data
    df['risk_pred']  = rf.predict(X)
    df['risk_proba_severe'] = rf.predict_proba(X)[:, 2] if len(np.unique(y)) > 2 else 0
    
    df.to_csv(OUTPUT_PRED, index=False)
    print(f"Hasil prediksi tersimpan di: {OUTPUT_PRED}")

if __name__ == "__main__":
    run_ai_training()
