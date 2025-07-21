import { useState, useEffect } from "react";
import { TemplateMessages } from "@/components/TemplateMessages";
import { RequestStatus } from "@/components/MessageHistory";
import { CustomMessageInput } from "@/components/CustomMessageInput";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Truck } from "lucide-react";

interface DriverRequest {
  id: string;
  request: string;
  timestamp: Date;
  status: 'sent' | 'acknowledged' | 'completed';
  response?: string;
}

const Index = () => {
  const [requests, setRequests] = useState<DriverRequest[]>([]);
  const [activeTab, setActiveTab] = useState("templates");

  // Simulate dispatch acknowledgment for demo
  useEffect(() => {
    const timer = setTimeout(() => {
      if (requests.length > 0) {
        const latestRequest = requests[requests.length - 1];
        if (latestRequest.status === 'sent') {
          setRequests(prev => prev.map(req =>
            req.id === latestRequest.id
              ? { ...req, status: 'acknowledged', response: "Request received. Processing..." }
              : req
          ));
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [requests]);

  const handleSendRequest = (requestText: string) => {
    const newRequest: DriverRequest = {
      id: Date.now().toString(),
      request: requestText,
      timestamp: new Date(),
      status: 'sent'
    };

    setRequests(prev => [...prev, newRequest]);
    setActiveTab("status");
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-900">
      <div className="h-full min-w-[350px] max-w-[500px] w-full bg-background flex flex-col relative overflow-y-hidden ">

        {/* ------------------ Title Bar ------------------*/}

        <div className="bg-primary text-primary-foreground p-3 shadow-soft flex-shrink-0">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="./src/assets/driver-avatar.png"
                  alt="Driver"
                  className="w-[50px] h-[50px] rounded-full border-2 border-primary-border"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-success rounded-full border-2 border-primary-border"></div>
              </div>
              <div>
                <h1 className="font-bold text-lg">HOS support</h1>
                <p className="text-sm opacity-85">Smart AI Communication</p>
              </div>
            </div>
              <ThemeToggle />
          </div>
        </div>

        {/* ------------------ Main Page ------------------ */}

        <div className="flex-1 flex flex-col mx-4 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">

            {/* ------------------ Tablist(request, chatting history) ------------------ */}
            <TabsList className="grid w-full grid-cols-2 mt-2 flex-shrink-0">
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <Truck size={20} />
                Driver Requests
              </TabsTrigger>
              <TabsTrigger value="status" className="flex items-center gap-2">
                <Activity size={20} />
                Status
              </TabsTrigger>
            </TabsList>

            {/* ------------------ Driver Request Content ------------------ */}

            <TabsContent value="templates" className="data-[state=active]:flex-1 mt-0 overflow-hidden min-h-0">
              <TemplateMessages onSendMessage={handleSendRequest} />
            </TabsContent>

            <TabsContent value="status" className="data-[state=active]:flex-1 data-[state=active]:flex data-[state=active]:flex-col mt-4 min-h-0">
              <RequestStatus requests={requests} />
            </TabsContent>

          </Tabs>
        </div>

        {/* ------------------ Custom Input ------------------ */}
        <div className="border bg-card p-4 mx-4 mb-4 mt-2 rounded-lg shadow-soft flex-shrink-0">
          <CustomMessageInput onSendMessage={handleSendRequest} />
        </div>

      </div>
    </div>
  );
};

export default Index;
