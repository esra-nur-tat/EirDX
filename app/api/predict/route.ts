// app/api/predict/route.ts
// ===============================================
// 🌡️ What-If Prediction API (Educational Version)
// Builds a 48-hour encoder from Supabase data.
// The last timestep (time_idx = 47) represents “now”
// and contains only the simulated treatment.
// ===============================================

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ------------------------------------------------
// 1️⃣  Constants
// ------------------------------------------------
const medications = [
  "Tacrolimus","Insulin","Olanzapine","Glucagon","Dexamethasone","Sirolimus",
  "Prednisone","Tacrolimus XR","Triamterene-HCTZ (37.5/25)","GlipiZIDE XL",
  "Furosemide","Hydrocortisone","Hydrocortisone Na","Hydrochlorothiazide",
  "Spironolactone","Empagliflozin","CycloSPORINE (Sandimmune)","Eplerenone",
  "Chlorthalidone","Phenytoin","CycloSPORINE (Neoral) MODIFIED","Octreotide Acetate",
  "Fosphenytoin","Phenytoin Sodium (IV)","Valproate Sodium","Dextrose Water",
  "Ritonavir","MetFORMIN XR (Glucophage XR)","Dextrose 50%","MetFORMIN (Glucophage)"
];

const labTypes: Record<string, string[]> = {
  "Hemoglobin A1c": ["-"],
  LDL: ["Calculated","Measured"],
  Cholesterol: ["Serum","HDL"],
  Chloride: ["Combined"],
  Glucose: ["Combined"],
  Potassium: ["Combined"],
  Sodium: ["Combined"],
  Triglycerides: ["Serum"],
};

function formatKey(name: string) {
  return name
    .toLowerCase()
    .replaceAll(" ", "_")
    .replaceAll("(", "")
    .replaceAll(")", "")
    .replaceAll("-", "_")
    .replaceAll("%", "percent");
}

// ------------------------------------------------
// 2️⃣  Route handler
// ------------------------------------------------
export async function POST(req: Request) {
  try {
    const { patient_id, treatment } = await req.json();
    if (!patient_id) return Response.json({ error: "Missing patient_id" }, { status: 400 });
    if (!treatment) return Response.json({ error: "Missing treatment info" }, { status: 400 });

    // ------------------------------------------------
    // 3️⃣  Fetch patient, labs, treatments from Supabase
    // ------------------------------------------------
    const { data: patient } = await supabase
      .from("patients")
      .select("gender, anchor_age")
      .eq("id", patient_id)
      .single();

    const { data: labs } = await supabase
      .from("labs")
      .select("lab_category, lab_type, value, date")
      .eq("patient_id", patient_id)
      .order("date");

    const { data: treatments } = await supabase
      .from("treatments")
      .select("medication_name, dose, start_time")
      .eq("patient_id", patient_id)
      .order("start_time");

    // ------------------------------------------------
    // 4️⃣  Determine latest timestamp from history
    // ------------------------------------------------
    const allTimes = [
      ...((labs ?? []).map(l => new Date(l.date).getTime())),
      ...((treatments ?? []).map(t => new Date(t.start_time).getTime())),
    ].filter(Boolean);

    const latest = allTimes.length ? Math.max(...allTimes) : Date.now();
    const getTimeIdx = (ts: number) => {
      const hours = Math.floor((latest - ts) / (1000 * 60 * 60));
      const idx = 46 - hours;      // only fill 0-46 with history
      return idx >= 0 && idx <= 46 ? idx : null;
    };

    // ------------------------------------------------
    // 5️⃣  Generate keys
    // ------------------------------------------------
    const medKeys = medications.map(m => `med_${formatKey(m)}`);
    const labKeys = Object.entries(labTypes).flatMap(([lab, subs]) =>
      subs[0] === "Combined"
        ? [`lab_${lab.replaceAll(" ", "_")}`]
        : subs.map(s =>
            `lab_${lab.replaceAll(" ", "_")}${s !== "-" ? "_" + s.replaceAll(" ", "_") : ""}`
          )
    );

    // ------------------------------------------------
    // 6️⃣  Build base encoder (48 timesteps)
    // ------------------------------------------------
    const encoder = Array.from({ length: 48 }, (_, i) => {
      const r: Record<string, number> = { time_idx: i };
      labKeys.forEach(k => {
        r[k] = 0;
        r[`${k}_mask`] = 0;
      });
      medKeys.forEach(k => {
        r[k] = 0;
        r[`${k}_mask`] = 0;
      });
      return r;
    });

    // ------------------------------------------------
    // 7️⃣  Fill historical data (idx 0-46)
    // ------------------------------------------------
    const combinedLabs = ["Chloride","Glucose","Potassium","Sodium"];
    labs?.forEach(l => {
      const idx = getTimeIdx(new Date(l.date).getTime());
      if (idx === null) return;
      const base = l.lab_category.replaceAll(" ", "_");
      const key = combinedLabs.includes(l.lab_category)
        ? `lab_${base}`
        : `lab_${base}${l.lab_type && l.lab_type !== "-" ? "_" + l.lab_type.replaceAll(" ", "_") : ""}`;
      if (encoder[idx][key] !== undefined) {
        encoder[idx][key] = l.value ?? 0;
        encoder[idx][`${key}_mask`] = 1;
      }
    });

    treatments?.forEach(t => {
      const idx = getTimeIdx(new Date(t.start_time).getTime());
      if (idx === null) return;
      const key = `med_${formatKey(t.medication_name)}`;
      if (encoder[idx][key] !== undefined) {
        encoder[idx][key] = t.dose ?? 1;
        encoder[idx][`${key}_mask`] = 1;
      }
    });

    // ------------------------------------------------
    // 8️⃣  Inject simulated treatment at time_idx = 47
    // ------------------------------------------------
    const tKey = `med_${formatKey(treatment.medication_name)}`;
    encoder[47] = { ...encoder[47] }; // ensure object exists
    labKeys.forEach(k => {             // zero all lab masks
      encoder[47][k] = 0;
      encoder[47][`${k}_mask`] = 0;
    });
    medKeys.forEach(k => {             // zero all meds
      encoder[47][k] = 0;
      encoder[47][`${k}_mask`] = 0;
    });
    // apply simulated med
    if (encoder[47][tKey] !== undefined) {
      encoder[47][tKey] = treatment.dose ?? 1;
      encoder[47][`${tKey}_mask`] = 1;
    }

    // ------------------------------------------------
    // 9️⃣  Build model payload
    // ------------------------------------------------
    const payload = {
      hadm_id: patient_id,
      horizon: 24,
      units: "mg/dL",
      time_idx: "time_idx",
      target: "target_Glucose",
      group_ids: ["hadm_id"],
      weight: "target_Glucose_mask",
      max_encoder_length: 48,
      min_encoder_length: 48,
      min_prediction_length: 24,
      max_prediction_length: 24,
      static_categoricals: ["gender"],
      static_reals: ["anchor_age"],
      //time_varying_known_categoricals: ["dow_id_new"],
      time_varying_known_reals: medKeys.flatMap(k => [k, `${k}_mask`]),
      time_varying_unknown_reals: labKeys.flatMap(k => [k, `${k}_mask`]),
      add_relative_time_idx: true,
      add_encoder_length: true,
      allow_missing_timesteps: false,
      data: encoder,
    };

    // ------------------------------------------------
    // 🔟  Call model endpoint
    // ------------------------------------------------
    const res = await fetch(process.env.PREDICTION_API_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const out = await res.json();

    console.log("🔍 Model raw output:", out);
    // ------------------------------------------------
    // 11️⃣  Return simplified response
    // ------------------------------------------------
    return Response.json({
      hadm_id: out.hadm_id,
      horizon: out.horizon,
      units: out.units,
      predictions: out.predictions.q50,
      treatment,   // echo treatment info for frontend legend
    });
  } catch (e: any) {
    console.error("Predict API error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
