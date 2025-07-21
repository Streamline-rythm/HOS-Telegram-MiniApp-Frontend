import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Clock, MapPin, Coffee, Shield, Search, Send, Timer } from "lucide-react";

interface TemplateMessage {
  id: string;
  text: string;
  icon: any;
  needsTime?: boolean;
  variant: 'template' | 'accent' | 'success';
  description: string;
}

const templates: TemplateMessage[] = [
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

const timeOptions = Array.from({ length: 40 }, (_, i) => ({
  value: `${i + 1}h`,
  label: `${i + 1} hour${i === 0 ? '' : 's'}`,
}));
timeOptions.unshift({ value: "30min", label: "30min" });

interface TemplateMessagesProps {
  onSendMessage: (message: string) => void;
}

export function TemplateMessages({ onSendMessage }: TemplateMessagesProps) {
  const [selectedTime, setSelectedTime] = useState<string>("15min");

  const handleTemplateClick = (template: TemplateMessage) => {
    let message = template.text;
    if (template.needsTime) {
      message = `${selectedTime} ${template.text}`;
    }
    onSendMessage(message);
  };

  const quickTimeOptions = ["30min", "1h", "4h", "11h"];

  return (
    <div className="h-full max-w-full flex flex-col px-4 pt-3 space-y-2 ">
      {/* Compact Time Selector */}
      <div className="bg-primary rounded-xl px-3 py-2 shadow-soft flex-shrink-0 w-full">
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="text-primary-foreground" size={20} />
            <h3 className="text-lg font-semibold text-primary-foreground">Time Duration</h3>
          </div>
        </div>

        {/* Compact quick time buttons */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          {quickTimeOptions.map((time) => (
            <Button
              key={time}
              variant={selectedTime === time ? "secondary" : "ghost"}
              className={`h-9 text-sm font-medium ${selectedTime === time ? 'ring-1 ring-primary-foreground/20 bg-primary-foreground text-button' : 'text-primary-foreground hover:bg-primary-foreground/20'}`}
              onClick={() => setSelectedTime(time)}
            >
              {time}
            </Button>
          ))}
        </div>

        {/* Compact custom time selector */}
        <Select value={selectedTime == "15min" ? "" : selectedTime} onValueChange={setSelectedTime}>
          <SelectTrigger className="h-9 bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground text-sm">
            <div className="flex-1 text-center">
              <SelectValue placeholder="Custom time" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <h3 className="text-base font-semibold text-foreground mb-2">Driver Request Templates</h3>
      {/* Compact Template Message Buttons */}
      <div className="flex-1 space-y-2 overflow-y-auto ">
        <div className="space-y-2 w-full">

          {templates.map((template) => {
            const Icon = template.icon;
            const messagePreview = template.needsTime ? `${selectedTime} ${template.text}` : template.text;

            return (
              <AlertDialog key={`${template.id}-${selectedTime}`}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="template"
                    className="w-full justify-start gap-3 px-4 py-2 h-auto min-h-[60px] flex-col items-start bg-primary "
                    >
                    <div className="flex items-center gap-3 w-full">
                      <Icon size={22} />
                      <div className="flex-1 text-left">
                        <div className="text-base font-semibold">
                          {messagePreview}
                        </div>
                        <div className="text-xs opacity-70 font-normal">
                          {template.description}
                        </div>
                      </div>
                      <Send size={16} className="opacity-60" />
                    </div>
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent className="max-w-sm w-[90vw] mx-auto">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-lg">
                      <Icon size={20} className="text-primary" />
                      Confirm Request
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base">
                      Send this request to dispatch?
                      <div className="mt-2 p-2 bg-muted rounded-lg text-base">
                        <strong>"{messagePreview}"</strong>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex gap-2">
                    <AlertDialogCancel className="flex-1 h-10">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleTemplateClick(template)}
                      className="flex-1 h-10"
                    >
                      Send
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            );
          })}
        </div>
      </div>
    </div>
  );
}