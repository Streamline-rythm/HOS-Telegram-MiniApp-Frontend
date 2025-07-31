import { TemplateMessage } from "@/types";
import { MapPin, Coffee, Shield, Search, Timer } from "lucide-react";

export const templates: TemplateMessage[] = [
    {
      id: 'pretrip',
      text: 'Pre Trip Inspection',
      icon: MapPin,
      needsTime: true,
      variant: 'template',
      description: 'Required safety check before starting'
    },
    {
      id: 'break',
      text: 'Break Time',
      icon: Coffee,
      needsTime: true,
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

  export const timeOptions = Array.from({ length: 40 }, (_, i) => ({
    value: `${i + 1}h`,
    label: `${i + 1} hour${i === 0 ? '' : 's'}`,
  }));
  timeOptions.unshift({ value: "30min", label: "30min" });
  timeOptions.unshift({ value: "15min", label: "15min" });

  export const quickTimeOptions = ["30min", "1h", "4h", "11h"];