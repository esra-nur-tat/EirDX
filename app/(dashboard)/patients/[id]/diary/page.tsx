"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { LabRecordsTable } from "@/components/lab-records";
import { TreatmentsTable } from "@/components/treatments-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { delay, motion } from "framer-motion";
import { AdmissionsTable } from "@/components/admissions-table";

export default function PatientDiaryPage() {
  return (
    <motion.div
      className="h-screen flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Upper description */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="m-4 bg-background/40 backdrop-blur-md border border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle>📓 Patient Diary</CardTitle>
          </CardHeader>
          <CardContent>
            This page lists the patient’s laboratory results and treatment processes.
          </CardContent>
        </Card>
      </motion.div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1 px-4 pb-6">
        <div className="space-y-8">
          {[
            { Comp: AdmissionsTable, delay: 0.4 },
            { Comp: LabRecordsTable, delay: 0.6 },
            { Comp: TreatmentsTable, delay: 0.8 },
          ].map(({ Comp, delay }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay }}
            >
              <Comp />
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
