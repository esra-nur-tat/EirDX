"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Activity, Stethoscope, Pill, Heart } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Glow Background */}
      <motion.div className="absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-150px] left-[-150px] w-[500px] h-[500px] rounded-full bg-purple-500/30 blur-[200px]"
        />
        <motion.div
          animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-blue-500/30 blur-[220px]"
        />
      </motion.div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="z-10 text-center space-y-6 px-6 mt-12"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          EirDX
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          An intelligent patient management system{" "}
          <span className="font-semibold">for healthcare professionals.</span>.
          Track lab results, medication records, and AI-powered predictions from
          a single platform.
        </p>

        <div className="flex justify-center">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3209/3209265.png"
            alt="doctor illustration"
            className="w-48 md:w-60 drop-shadow-lg"
          />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center mt-6">
          <Link href="/login">
            <Button size="lg" className="px-8 text-lg">
              Login
            </Button>
          </Link>
          <Link href="#about">
            <Button
              size="lg"
              variant="outline"
              className="px-8 text-lg backdrop-blur-sm"
            >
              View Project
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Features Section */}
      <section
        id="features"
        className="z-10 mt-24 grid grid-cols-1 md:grid-cols-4 gap-3 max-w-7xl px-3"
      >
        {[
          {
            title: "📊 Smart Dashboard",
            desc: "View patient records, lab results, and administered medications in one place.",
            icon: <Activity className="h-8 w-8 text-blue-400" />,
          },
          {
            title: "🧪 Lab Tracking",
            desc: "Monitor key lab values such as Glucose, HbA1c, Sodium, Potassium, and Cholesterol with time-based trends.",
            icon: <Stethoscope className="h-8 w-8 text-purple-400" />,
          },
          {
            title: "💊 Medication Management",
            desc: "Record and manage Insulin, Metformin, Dextrose, and other diabetes medications with dosage and timing details.",
            icon: <Pill className="h-8 w-8 text-pink-400" />,
          },
          {
            title: "🤖 Prediction Module",
            desc: "Use AI model(TFT Model) to predict future lab values and provide clinical decision support for treatment planning.",
            icon: <Stethoscope className="h-8 w-8 text-purple-400" />,
          },
        ].map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.2 }}
            viewport={{ once: true }}
          >
            <Card className="p-6 bg-card/70 backdrop-blur-md border border-white/10 shadow-lg h-full flex flex-col justify-between">
              <div className="flex flex-col items-center space-y-3 text-center">
                {f.icon}
                <h3 className="text-lg font-semibold min-h-[3rem] leading-tight">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* About Section */}
      <section
        id="about"
        className="z-10 mt-24 max-w-4xl px-6 text-center space-y-4"
      >
        <h2 className="text-3xl font-bold">About Project</h2>
        <p className="text-muted-foreground text-lg">
          EirDX is designed to support healthcare professionals in managing
          diabetes and related conditions. By combining lab test results (e.g.,
          Glucose, HbA1c, electrolytes) with medication administration records,
          the platform creates a unified patient timeline. With the integrated
          prediction model, EirDX provides early warnings and future value
          forecasts, helping clinicians optimize treatments and reduce risks.
        </p>
      </section>

      {/* Team Section with Avatars + Social Links + Ideas */}
      <section id="team" className="z-10 mt-24 max-w-6xl px-6 text-center">
        <h2 className="text-3xl font-bold mb-8">Team Members</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              name: "Kayra Durmuş",
              role: "Team Member",
              avatar: "/avatars/kayra.jpg",
              github: "https://github.com/drw2side",
              linkedin:
                "https://www.linkedin.com/in/kayra-durmu%C5%9F-11912b162?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app",
              idea: "Built and fine-tuned a Temporal Fusion Transformer (TFT) model, designing a scalable cloud training pipeline to boost forecasting accuracy and performance. Assisted with the selection and filtering of medications and lab values, ensuring the model’s clinical relevance.",
            },
            {
              name: "Esra Nur Tat",
              role: "Team Member",
              avatar: "/avatars/esra.jpg",
              github: "https://github.com/esra-nur-tat",
              linkedin: "https://www.linkedin.com/in/esra-nur-tat-4a4571206/",
              idea: "Built the test hourly panel dataset by integrating lab and medication data through BigQuery and SQL preprocessing. Developed the interface using Next.js, implementing dynamic data visualization and integrating the Vercel API for seamless model interaction.",
            },
            {
              name: "Zeynep Sude Kaplan",
              role: "Team Member",
              avatar: "/avatars/sude.jpg",
              github: "https://github.com/skaplann",
              linkedin: "https://www.linkedin.com/in/zeynep-sude-kaplan/",
              idea: "Contributed to data preprocessing and modeling using the MIMIC-IV ICU dataset, focusing on integrating lab, medication, and patient-hourly panels with BigQuery and Python for treatment–outcome analysis.",
            },
            {
              name: "Kaan Bilge",
              role: "Team Member",
              avatar: "/avatars/kaan.jpg",
              github: "https://github.com/KaanBilge",
              linkedin: "https://www.linkedin.com/in/kaan-bilge-954111331/",
              idea: "Worked on the data processing pipeline system for predicting drug effects, focusing on model accuracy and saving. Also handled the backend and the API of the website.",
            },
          ].map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 bg-card/70 backdrop-blur-md border border-white/10 shadow-lg h-full flex flex-col items-center space-y-1">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-24 h-24 rounded-full border-2 border-white/20 shadow-md"
                />
                <h3 className="text-lg font-semibold">{member.name}</h3>
                <p className="text-muted-foreground">{member.role}</p>
                <div className="flex gap-4">
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-white transition"
                  >
                    <FaGithub className="h-5 w-5" />
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-blue-400 transition"
                  >
                    <FaLinkedin className="h-5 w-5" />
                  </a>
                </div>
                <p className="text-sm text-center text-muted-foreground italic mt-2">
                  “{member.idea}”
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Special Thanks Section */}
      <section
        id="thanks"
        className="z-10 mt-24 max-w-4xl px-6 text-center space-y-6"
      >
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Heart className="h-7 w-7 text-pink-500" /> Special Thanks
        </h2>
        <p className="text-muted-foreground text-lg">
          Special thanks to our mentors and supporters for their invaluable
          guidance and encouragement throughout this project.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {["Adrian Lopez", "Vibha Shukla"].map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.2 }}
              viewport={{ once: true }}
              className="px-4 py-2 rounded-full bg-card/70 backdrop-blur-md border border-white/10 shadow-md"
            >
              <span className="text-sm font-medium">{name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="z-10 mt-20 mb-6 text-sm text-muted-foreground">
        © {new Date().getFullYear()} EirDX — Amazon University Engagement
        Program
      </footer>
    </div>
  );
}
