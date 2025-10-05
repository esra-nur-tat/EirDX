"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Hospital, Stethoscope } from "lucide-react";
import { format } from "date-fns";

type HistoryEvent = {
  id: string;
  type: "visit" | "admission" | "discharge";
  date: string;
  description: string;
  labs?: { name: string; result: number; unit: string }[];
  treatments?: { name: string; dose: string; unit: string }[];
  summary?: string | null;
};

export default function PatientHistoryPage() {
  const params = useParams(); // ✅
  const id = params.id as string;

  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/history/${id}`);
        const data = await res.json();
        setHistory(data.history || []);
      } catch (err) {
        console.error("History fetch error:", err);
      }
    })();
  }, [id]);

  return (
    <Card className="bg-card/70 backdrop-blur-md">
      <CardHeader>
        <CardTitle>📜 Patient Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative border-l border-muted-foreground/30 pl-6 space-y-6">
          {history.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No past records found.
            </p>
          ) : (
            history.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <span className="absolute -left-[10px] top-2 w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/40" />
                <div
                  className="p-4 rounded-md border bg-background/60 hover:bg-background/80 transition cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === event.id ? null : event.id)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {event.type === "visit" && (
                        <Stethoscope className="h-4 w-4 text-blue-500" />
                      )}
                      {event.type === "admission" && (
                        <Hospital className="h-4 w-4 text-green-500" />
                      )}
                      {event.type === "discharge" && (
                        <Calendar className="h-4 w-4 text-red-500" />
                      )}
                      <p className="font-medium">{event.description}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(event.date), "dd.MM.yyyy HH:mm")}
                    </span>
                  </div>

                  {expandedId === event.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 space-y-3"
                    >
                      {event.labs?.length ? (
                        <div>
                          <p className="font-semibold text-sm mb-2">
                            🔬 Lab Results
                          </p>
                          <div className="border rounded-md overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/40">
                                <tr>
                                  <th className="text-left p-2">Test</th>
                                  <th className="text-left p-2">Result</th>
                                  <th className="text-left p-2">Unit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {event.labs.map((lab, i) => (
                                  <tr
                                    key={i}
                                    className="border-t hover:bg-muted/30 transition"
                                  >
                                    <td className="p-2">{lab.name}</td>
                                    <td className="p-2">{lab.result}</td>
                                    <td className="p-2">{lab.unit}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : null}

                      {event.treatments?.length ? (
                        <div>
                          <p className="font-semibold text-sm mb-2">
                            💊 Treatments
                          </p>
                          <div className="border rounded-md overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/40">
                                <tr>
                                  <th className="text-left p-2">
                                    Medication / Applitaction 
                                  </th>
                                  <th className="text-left p-2">Dose</th>
                                  <th className="text-left p-2">Unit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {event.treatments.map((treat, i) => (
                                  <tr
                                    key={i}
                                    className="border-t hover:bg-muted/30 transition"
                                  >
                                    <td className="p-2">{treat.name}</td>
                                    <td className="p-2">{treat.dose}</td>
                                    <td className="p-2">{treat.unit}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : null}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
