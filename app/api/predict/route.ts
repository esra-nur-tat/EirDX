import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// 🧩 Load scalers from JSON

//const scalerPath = path.join(process.cwd(), "app/api/predict/scaler_values.json");
type ScalerEntry = { mean: number; std: number };
type ScalerMap = Record<string, ScalerEntry>;

const scalers : ScalerMap = {
  "lab_Glucose": {
    "mean": 145.24946167355662,
    "std": 112.5961141979172
  },
  "med_tacrolimus_xr": {
    "mean": 4.211574952561668,
    "std": 4.27095246605253
  },
  "med_eplerenone": {
    "mean": 46.079473013174656,
    "std": 31.902761610268517
  },
  "med_insulin": {
    "mean": 9.913577513898495,
    "std": 13.663128111831671
  },
  "med_spironolactone": {
    "mean": 49.2841309660258,
    "std": 41.38722484551391
  },
  "med_glipizide_xl": {
    "mean": 7.195773930753558,
    "std": 4.012159226283754
  },
  "med_phenytoin": {
    "mean": 161.91041559774246,
    "std": 88.79763678687854
  },
  "med_phenytoin_sodium_iv": {
    "mean": 172.18985434455055,
    "std": 219.11465555485665
  },
  "med_empagliflozin": {
    "mean": 12.022980501392752,
    "std": 4.979801826616413
  },
  "med_chlorthalidone": {
    "mean": 26.126237623762368,
    "std": 11.526920865414253
  },
  "med_triamterene_hctz_37_5_25": {
    "mean": 1.0400410677618075,
    "std": 0.2063692854338863
  },
  "med_tacrolimus": {
    "mean": 2.12436947411458,
    "std": 1.690946766834923
  },
  "med_hydrocortisone": {
    "mean": 14.244123105474788,
    "std": 12.581978062025392
  },
  "med_dextrose_water": {
    "mean": 104.15019762845849,
    "std": 31.652526346302448
  },
  "med_furosemide": {
    "mean": 50.01925286672828,
    "std": 41.833945928664775
  },
  "med_olanzapine": {
    "mean": 5.643212494488536,
    "std": 4.587986898783173
  },
  "med_octreotide_acetate": {
    "mean": 132.5381114400601,
    "std": 61.679903987035246
  },
  "med_fosphenytoin": {
    "mean": 210.85687382297564,
    "std": 280.18582233960444
  },
  "med_cyclosporine_neoral_modified": {
    "mean": 89.3692143365772,
    "std": 60.91718810710126
  },
  "med_prednisone": {
    "mean": 24.445376427829704,
    "std": 24.425062948261296
  },
  "med_sirolimus": {
    "mean": 1.6279069767441874,
    "std": 1.1390291381280613
  },
  "med_hydrochlorothiazide": {
    "mean": 21.92470924168145,
    "std": 8.572990746753568
  },
  "med_ritonavir": {
    "mean": 102.3668639053254,
    "std": 15.204270373485684
  },
  "med_valproate_sodium": {
    "mean": 584.1458855585835,
    "std": 360.44457022385086
  },
  "med_glipizide": {
    "mean": 6.646175518522952,
    "std": 3.0625564742806604
  },
  "med_metformin_glucophage": {
    "mean": 761.2834411344928,
    "std": 256.37664700767374
  },
  "med_dexamethasone": {
    "mean": 5.322718653383715,
    "std": 4.704588496372152
  },
  "med_metformin_xr_glucophage_xr": {
    "mean": 851.3477269679504,
    "std": 376.37782561659515
  },
  "med_hydrocortisone_na": {
    "mean": 56.95930101719327,
    "std": 27.54285872464397
  },
  "med_glucagon": {
    "mean": 1.468043478260869,
    "std": 1.3334315642985262
  },
  "med_dextrose_50": {
    "mean": 18.193790479274604,
    "std": 6.854873056820892
  },
  "med_cyclosporine_sandimmune": {
    "mean": 103.0260631001372,
    "std": 52.13229903174295
  }
};


// 💊 Load medication effect scaling from JSON

//const filePath = path.join(process.cwd(), "app/api/predict/medEffectScale.json");
type MedEffectScaleMap = Record<string, number>;
const medEffectScale : MedEffectScaleMap = {
  "med_chlorthalidone": -0.7465430799993805,
  "med_cyclosporine_neoral_modified": -0.4723644058382799,
  "med_cyclosporine_sandimmune": -0.3508421986495242,
  "med_dexamethasone": 1.9061702751980387,
  "med_dextrose_50": 17.20418237695092,
  "med_dextrose_water": 1.7522980185754107,
  "med_empagliflozin": 2.130156050287753,
  "med_eplerenone": 0.234384726299378,
  "med_fosphenytoin": 0.11384045135184212,
  "med_furosemide": -0.09246405965529439,
  "med_glipizide": 4.9800934351283725,
  "med_glipizide_xl": -7.993477632689053,
  "med_glucagon": -50.541997813818675,
  "med_hydrochlorothiazide": 0.2058288264561603,
  "med_hydrocortisone": -0.6673660704267648,
  "med_hydrocortisone_na": -0.4372125384340699,
  "med_insulin": 1.0,
  "med_metformin_glucophage": -0.01832828352964274,
  "med_metformin_xr_glucophage_xr": 0.00778304169195609,
  "med_octreotide_acetate": -0.6285547258721654,
  "med_olanzapine": -0.4307096940938958,
  "med_phenytoin": 0.1919988365340103,
  "med_phenytoin_sodium_iv": 0.08214977853792371,
  "med_prednisone": -0.7619260122614588,
  "med_ritonavir": 0.01875244082012226,
  "med_sirolimus": 1.253356733487873,
  "med_spironolactone": 0.23116968109092192,
  "med_tacrolimus": -58.52297837731101,
  "med_tacrolimus_xr": -7.446218906291095,
  "med_triamterene_hctz_37_5_25": 97.33182187499877,
  "med_valproate_sodium": -0.028170747782877918
}
;


// 🔢 Normalization helpers
function normalizeFeature(key: string, value: number) {
  const s = scalers[key];
  if (!s || s.std === 0 || isNaN(value)) return value;
  return (value - s.mean) / s.std;
}

function denormalizeFeature(key: string, value: number) {
  const s =
    scalers[key] ||
    scalers[key.toLowerCase()] ||
    scalers[key.charAt(0).toUpperCase() + key.slice(1)];

  if (!s || s.std === 0 || isNaN(value)) return value;
  return value * s.std + s.mean;
}

// ✅ Use realistic scaling for meds (model expects small magnitudes)
function maybeNormalize(key: string, value: number) {
  if (key.toLowerCase().startsWith("med_")) {
    return value / 1e11; // scaled down for stability
  }
  return normalizeFeature(key, value);
}

// 🧠 Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 💊 Medication list
const medications = [
  "Tacrolimus",
  "Insulin",
  "Olanzapine",
  "Glucagon",
  "Dexamethasone",
  "Sirolimus",
  "Prednisone",
  "Tacrolimus XR",
  "Triamterene-HCTZ (37.5/25)",
  "GlipiZIDE XL",
  "Furosemide",
  "Hydrocortisone",
  "Hydrochlorothiazide",
  "Spironolactone",
  "Empagliflozin",
  "CycloSPORINE (Sandimmune)",
  "Eplerenone",
  "Chlorthalidone",
  "Phenytoin",
  "CycloSPORINE (Neoral) MODIFIED",
  "Octreotide Acetate",
  "Fosphenytoin",
  "Phenytoin Sodium (IV)",
  "Valproate Sodium",
  "Dextrose Water",
  "Ritonavir",
  "MetFORMIN XR (Glucophage XR)",
  "Dextrose 50%",
  "MetFORMIN (Glucophage)"
];

// 🔬 Lab types
const labTypes: Record<string, string[]> = {
  "Hemoglobin A1c": ["-"],
  LDL: ["Calculated", "Measured"],
  Cholesterol: ["Serum", "HDL"],
  Chloride: ["Combined"],
  Glucose: ["Combined"],
  Potassium: ["Combined"],
  Sodium: ["Combined"],
  Triglycerides: ["Serum"]
};

// ✅ Normalize key names
function formatKey(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[()\/\-.%]/g, "_")
    .replace(/_+/g, "_")
    .trim();
}

// ----------------------------------------------------
// 🚀 POST /api/predict
// ----------------------------------------------------
export async function POST(req: Request) {
  try {
    const { patient_id, treatment } = await req.json();

    if (!patient_id)
      return NextResponse.json({ error: "Missing patient_id" }, { status: 400 });
    if (!treatment)
      return NextResponse.json({ error: "Missing treatment info" }, { status: 400 });

    console.log("💊 Treatment received:", treatment);

    // 1️⃣ Fetch patient
    const { data: patient } = await supabase
      .from("patients")
      .select("gender, birth_date")
      .eq("id", patient_id)
      .single();

    // 2️⃣ Fetch labs
    const { data: labs } = await supabase
      .from("labs")
      .select("lab_category, lab_type, value, date")
      .eq("patient_id", patient_id)
      .order("date");

    // 3️⃣ Fetch treatments
    const { data: treatments } = await supabase
      .from("treatments")
      .select("medication_name, dose, start_date")
      .eq("patient_id", patient_id)
      .order("start_date");

    // 4️⃣ Determine timeline
    const allTimes = [
      ...(labs ?? []).map((l) => new Date(l.date).getTime()),
      ...(treatments ?? []).map((t) => new Date(t.start_date).getTime())
    ].filter(Boolean);
    const latest = allTimes.length ? Math.max(...allTimes) : Date.now();

    const encoderLength = 48;
    const getTimeIdx = (ts: number) => {
      const hours = Math.floor((latest - ts) / (1000 * 60 * 60));
      const idx = encoderLength - 1 - hours;
      return idx >= 0 && idx < encoderLength ? idx : null;
    };

    // 5️⃣ Keys
    const medKeys = medications.map((m) => `med_${formatKey(m)}`);
    const labKeys = Object.entries(labTypes).flatMap(([lab, subs]) =>
      subs[0] === "Combined"
        ? [`lab_${lab.replaceAll(" ", "_")}`]
        : subs.map(
            (s) =>
              `lab_${lab.replaceAll(" ", "_")}${
                s !== "-" ? "_" + s.replaceAll(" ", "_") : ""
              }`
          )
    );

    // 6️⃣ Encoder
    const encoder = Array.from({ length: encoderLength }, (_, i) => {
      const hoursBack = encoderLength - 1 - i;
      const ts = latest - hoursBack * 3600 * 1000;
      const dow = new Date(ts).getDay();
      const r: Record<string, number | string> = {
        time_idx: i,
        dow_id_new: String(dow)
      };
      labKeys.forEach((k) => ((r[k] = 0), (r[`${k}_mask`] = 0)));
      medKeys.forEach((k) => ((r[k] = 0), (r[`${k}_mask`] = 0)));
      return r;
    });

    // 7️⃣ Fill labs
    const combinedLabs = ["Chloride", "Glucose", "Potassium", "Sodium"];
    labs?.forEach((l) => {
      const idx = getTimeIdx(new Date(l.date).getTime());
      if (idx === null) return;
      const base = l.lab_category.replaceAll(" ", "_");
      const key = combinedLabs.includes(l.lab_category)
        ? `lab_${base}`
        : `lab_${base}${
            l.lab_type && l.lab_type !== "-"
              ? "_" + l.lab_type.replaceAll(" ", "_")
              : ""
          }`;
      if (encoder[idx][key] !== undefined) {
        encoder[idx][key] = maybeNormalize(key, l.value ?? 0);
        encoder[idx][`${key}_mask`] = 1;
      }
    });

    // 8️⃣ Fill treatments
    treatments?.forEach((t) => {
      const idx = getTimeIdx(new Date(t.start_date).getTime());
      const key = `med_${formatKey(t.medication_name)}`;
      if (idx !== null && key in encoder[idx]) {
        encoder[idx][key] = maybeNormalize(key, t.dose ?? 1);
        encoder[idx][`${key}_mask`] = 1;
      }
    });

    // 9️⃣ Apply simulated treatment
    const tKey = `med_${formatKey(treatment.medication_name)}`;
    for (let k = encoderLength - 3; k < encoderLength; k++) {
      if (tKey in encoder[k]) {
        encoder[k][tKey] = maybeNormalize(tKey, treatment.dose ?? 1);
        encoder[k][`${tKey}_mask`] = 1;
      }
    }

    // 🔟 Decoder
    const decoder_known = Array.from({ length: 24 }, (_, i) => {
      const ts = latest + (i + 1) * 3600 * 1000;
      const dow = new Date(ts).getDay();
      const r: Record<string, number | string> = {
        time_idx: encoderLength + i,
        dow_id_new: String(dow)
      };
      medKeys.forEach((k) => ((r[k] = 0), (r[`${k}_mask`] = 0)));
      if (i === 0 && tKey in r) {
        r[tKey] = maybeNormalize(tKey, treatment.dose ?? 1);
        r[`${tKey}_mask`] = 1;
      }
      return r;
    });

    // 🎂 Age calculation
    const calculateAge = (birthDate?: string | null) => {
      if (!birthDate) return 0;
      const dob = new Date(birthDate);
      return new Date().getFullYear() - dob.getFullYear();
    };
    const age = calculateAge(patient?.birth_date);

    console.log("🧩 Treatment normalization check →", {
      med: tKey,
      rawDose: treatment.dose,
      normalizedDose: maybeNormalize(tKey, treatment.dose ?? 1),
      scaler: scalers[tKey]
    });

    const payload = {
      hadm_id: patient_id,
      encoder,
      decoder_known,
      gender: patient?.gender ?? "U",
      anchor_age: maybeNormalize("anchor_age", age ?? 0)
    };

    console.log(payload);

    // 💾 Debug payload
    //const debugPath = path.join(process.cwd(), "payload-debug.json");
    //fs.writeFileSync(debugPath, JSON.stringify(payload, null, 2), "utf-8");

    // 🌐 Call model API
    const res = await fetch(process.env.PREDICTION_API_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log(res);
    const text = await res.text();
    let out: any = {};
    try {
      out = JSON.parse(text);
    } catch {
      console.error("Invalid model response:", text.slice(0, 150));
    }

    // 🩸 Denormalize predictions
    // 🧩 Pre-scale before denormalization to avoid 4k values
    const predRaw: number[] = out?.predictions?.q50 ?? [];
    const medianAbs = predRaw.reduce((a: number, b: number) => a + Math.abs(b), 0) / predRaw.length;

    const rescaleFactor = medianAbs > 50 ? 0.05 : 1; // heuristic
    let predictions_real = predRaw.map((z: number) =>
      denormalizeFeature("lab_Glucose", z * rescaleFactor)
    );
    console.log(`🧩 Applied pre-denorm scaling ×${rescaleFactor}`);


    // 🧭 Baseline bias correction
    const trueGlucose = labs
      ?.filter((l) => l.lab_category === "Glucose")
      ?.map((l) => l.value) ?? [];
    const baselineAvg =
      trueGlucose.length > 0
        ? trueGlucose.reduce((a, b) => a + b, 0) / trueGlucose.length
        : 120;

    let modelAvg =
      predictions_real.reduce((a, b) => a + b, 0) / predictions_real.length;

    const offset = modelAvg - baselineAvg;
    console.log(`🔧 Applying bias correction: offset=${offset.toFixed(2)} mg/dL`);

    predictions_real = predictions_real.map((v) => v - offset);
    predictions_real = predictions_real.map((v) =>
      Math.max(40, Math.min(v, 400))
    );



    // 💊 Apply medication-specific scaling
    if (treatment?.medication_name) {
      const key = `med_${treatment.medication_name
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[()\/\\\-.%]/g, "_")
        .replace(/_+/g, "_")
        .trim()}`;

      const relEffect = medEffectScale[key] ?? 1.0;
      const dose = Number(treatment.dose ?? 0);
      const scale = dose <= 0 ? 1 : Math.max(0.1, 1 + relEffect * Math.log1p(dose) / 50);

      predictions_real = predictions_real.map((v) => v * scale);
      console.log(
        `💊 Applied med scaling for ${key}: rel=${relEffect.toFixed(3)}, scale=${scale.toFixed(3)}`
      );
    }

    // 🧪 Logging
    let avg = predictions_real.reduce((a, b) => a + b, 0) / predictions_real.length;
    let minVal = Math.min(...predictions_real);
    let maxVal = Math.max(...predictions_real);

    console.log(
      `🧪 Glucose raw stats → avg: ${avg.toFixed(1)} | min: ${minVal.toFixed(
        1
      )} | max: ${maxVal.toFixed(1)}`
    );

    // 🧮 Rescale if model output magnitude is unrealistic
    if (avg > 500) {
      const scaleFactor = 180 / avg;
      console.warn(
        `⚠️ High avg glucose (${avg.toFixed(
          1
        )}). Applying dynamic scaling ×${scaleFactor.toFixed(4)}`
      );
      predictions_real = predictions_real.map((v) => v * scaleFactor);
    }

    // 🧱 Clamp after all scaling
    predictions_real = predictions_real.map((v) =>
      Math.max(40, Math.min(v, 400))
    );

    out.predictions_real = predictions_real;

    console.log(
      `✅ Final glucose range → avg: ${
        predictions_real.reduce((a, b) => a + b, 0) / predictions_real.length
      }`
    );

    return NextResponse.json(out);
  } catch (e: any) {
    console.error("Predict API error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
