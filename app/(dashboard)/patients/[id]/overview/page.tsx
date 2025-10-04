"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Activity,
  Weight,
  Ruler,
  Droplets,
  LogIn,
  BedDouble,
  DoorOpen,
  IdCard,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

type Patient = {
  id: string;
  identity_number: string;
  name: string;
  birth_date?: string | null;
  weight?: number | null;
  height?: number | null;
  blood_type?: string | null;
  admission_date?: string | null;
  hospitalization_date?: string | null;
  room?: string | null;
};

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/patients/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.patient) {
          setPatient(data.patient);
        } else {
          toast.error("Patient not found.");
        }
      })
      .catch(() => toast.error("An error occurred while retrieving data."));
  }, [params.id]);

  if (!patient) {
    return <p className="m-6 text-muted-foreground">Loading...</p>;
  }

  // Date format helper
  const formatDate = (d?: string | null) =>
    d ? format(new Date(d), "dd.MM.yyyy") : "-";

  // Calculate Age
  const calculateAge = (birthDate?: string | null) => {
    if (!birthDate) return null;
    const dob = new Date(birthDate);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const age = calculateAge(patient.birth_date);

  const infoCards = [
    {
      title: "Idenitity Number",
      value: patient.identity_number,
      icon: <IdCard className="h-5 w-5 text-primary" />,
    },
    {
      title: "Date of Birth",
      value: patient.birth_date ? formatDate(patient.birth_date) : "-",
      icon: <Calendar className="h-5 w-5 text-cyan-500" />,
    },
    {
      title: "Age",
      value: age ? `${age}` : "-",
      icon: <Activity className="h-5 w-5 text-green-500" />,
    },
    {
      title: "Weight",
      value: patient.weight ? `${patient.weight} kg` : "-",
      icon: <Weight className="h-5 w-5 text-orange-500" />,
    },
    {
      title: "Height",
      value: patient.height ? `${patient.height} cm` : "-",
      icon: <Ruler className="h-5 w-5 text-indigo-500" />,
    },
    {
      title: "Blood Type",
      value: patient.blood_type || "-",
      icon: <Droplets className="h-5 w-5 text-red-500" />,
    },
    {
      title: "Last Admission Date",
      value: formatDate(patient.admission_date),
      icon: <LogIn className="h-5 w-5 text-blue-500" />,
    },
    {
      title: "last Hospitalization Date",
      value: formatDate(patient.hospitalization_date),
      icon: <BedDouble className="h-5 w-5 text-purple-500" />,
    },
    {
      title: "Room",
      value: patient.room || "-",
      icon: <DoorOpen className="h-5 w-5 text-pink-500" />,
    },
  ];

  return (
    <div className="space-y-6 m-4">
      <h1 className="text-3xl font-bold tracking-tight">
        Patient Details: {patient.name}
      </h1>
      <p className="text-muted-foreground">
        Identity Number: {patient.identity_number}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {infoCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
              delay: index * 0.15,
            }}
          >
            <InfoCard title={card.title} value={card.value} icon={card.icon} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function InfoCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card
      className="group bg-background/60 backdrop-blur-sm shadow-md border border-border/50 
      transition-all duration-300 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20"
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
