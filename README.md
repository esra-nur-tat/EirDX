# 🧬 EirDX: AI-Driven Clinical Glucose Prediction Platform

EirDX is a **Next.js 15 + TypeScript** platform integrated with **Supabase** and a **Python-based ML pipeline** to simulate and visualize patient glucose predictions under different treatments.  
It allows clinicians and researchers to perform *“What-If” simulations* to see how medications affect glucose levels in real time.

---

## 🚀 Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/UI, Recharts  
- **Backend:** Next.js API Routes, Supabase (PostgreSQL + Auth)  
- **Machine Learning:** Python model endpoint (TFT-based glucose forecasting)  
- **Data:** MIMIC-IV Dataset (de-identified clinical data)

---

## 🧩 Core Features

- 🩸 **What-If Glucose Prediction:** simulate how different medications (e.g., Insulin, Dextrose 50%) affect blood glucose  
- 📈 **Dynamic Visualization:** Recharts line graphs comparing past glucose values with model predictions  
- ⚕️ **Treatment Scaling Engine:** dose- and medication-specific normalization and bias correction  
- 🔐 **Supabase Integration:** patient, lab, and treatment records stored in Supabase  
- ⚡ **Fast Deployment:** optimized for Vercel (edge functions, serverless API routes)

---

## 🧠 Project Structure

```
EirDX/
├── app/
│   ├── api/
│   │   └── predict/route.ts       # Predict API connecting to ML model
│   ├── patients/[id]/what-if/     # Core simulation dashboard
│   └── page.tsx                   # Entry page
├── components/ui/                 # Reusable UI components (Shadcn)
├── public/                        # Static assets
├── styles/                        # Global styles
└── ...
```

---

## ⚙️ Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/esra-nur-tat/EirDX.git
cd EirDX
```

### 2️⃣ Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3️⃣ Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
PREDICTION_API_URL=https://your-python-model-endpoint.com/predict
```

---

## 📊 Model API

EirDX communicates with an external **Python FastAPI model** that handles:
- Data normalization / scaling  
- Glucose level prediction  
- Medication effect simulation  

**Endpoint:**  
```
POST /api/predict
```

**Request Body:**
```json
{
  "patient_id": "abc123",
  "treatment": {
    "medication_name": "insulin",
    "dose": 10,
    "unit": "Units",
    "route": "SC"
  }
}
```

**Response:**
```json
{
  "predictions_real": [95.2, 98.4, 102.7, ...]
}
```

---

## 🧭 Deployment

The easiest way to deploy is via **Vercel**:

1. Connect your GitHub repo  
2. Add environment variables under *Project Settings → Environment Variables*  
3. Deploy — it automatically builds and hosts your app at `https://<project>.vercel.app`

For more details, see the [Next.js Deployment Docs](https://nextjs.org/docs/deployment).

---

## ⭐ Acknowledgments

Special thanks to the **MIMIC-IV** open dataset contributors, **Supabase**, and **Next.js** community. 
