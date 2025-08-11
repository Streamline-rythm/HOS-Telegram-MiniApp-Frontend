import { TemplateMessage } from "@/types";
import { MapPin, Coffee, Shield, Search, Timer } from "lucide-react";

export const templates: TemplateMessage[] = [
    {
      id: 'pretrip',
      text: '15min Pre Trip Inspection',
      icon: MapPin,
      needsTime: false,
      variant: 'template',
      description: 'Required safety check before starting'
    },
    {
      id: 'break',
      text: '30min Break Time',
      icon: Coffee,
      needsTime: false,
      variant: 'accent',
      description: 'Rest period notification'
    },
    {
      id: 'reset',
      text: 'Hour Reset',
      icon: Timer,
      needsTime: true,
      variant: 'success',
      description: 'Mandatory reset period'
    },
    {
      id: 'violations',
      text: 'Check Violations',
      icon: Shield,
      needsTime: false,
      variant: 'template',
      description: 'Review compliance status'
    },
    {
      id: 'inspection',
      text: 'Getting DOT Inspection',
      icon: Search,
      needsTime: false,
      variant: 'accent',
      description: 'Department of Transportation check'
    }
  ];

  export const timeOptions = Array.from({ length: 11 }, (_, i) => ({
    value: `${i + 1}h`,
    label: `${i + 1} hour${i === 0 ? '' : 's'}`,
  }));
  // timeOptions.unshift({ value: "30min", label: "30min" });
  // timeOptions.unshift({ value: "15min", label: "15min" });
  timeOptions.push({ value: "34h", label: "34 hours" });

  export const quickTimeOptions = ["30min", "1h", "4h", "11h"];