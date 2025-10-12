import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// 🧩 Load scalers from JSON

const scalerPath = path.join(process.cwd(), "app/api/predict/scaler_values.json");
const scalers = JSON.parse(fs.readFileSync(scalerPath, "utf-8"));


// 💊 Load medication effect scaling from JSON

const filePath = path.join(process.cwd(), "app/api/predict/medEffectScale.json");
const medEffectScale = JSON.parse(fs.readFileSync(filePath, "utf-8"));


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

    // 💾 Debug payload
    const debugPath = path.join(process.cwd(), "payload-debug.json");
    fs.writeFileSync(debugPath, JSON.stringify(payload, null, 2), "utf-8");

    // 🌐 Call model API
    const res = await fetch(process.env.PREDICTION_API_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

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
      const scale = dose <= 0 ? 1 : Math.max(0.1, 1 + relEffect * Math.log1p(dose) / 2.5);

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
