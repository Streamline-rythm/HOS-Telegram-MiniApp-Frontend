import { useState, useEffect, useRef } from "react"; // Import react hook
import { io } from 'socket.io-client'; // Import socket for real-time chatting

// ---------------------- Import Component of UI -------------------------
import { ThemeToggle } from "@/components/ThemeToggle";
import { RequestStatus } from "@/components/MessageHistory";
import { TemplateMessages } from "@/components/TemplateMessages";
import { CustomMessageInput } from "@/components/CustomMessageInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ---------------------- Import types, constants, avatar and icons ----------
import { DriverRequest } from "@/types";
import driverAvatar from '@/assets/driver-avatar.png';
import { Activity, Truck } from "lucide-react";


// =============================================================================
const Index = () => {
  const [requests, setRequests] = useState<DriverRequest[]>([]); // Requests history
  const [activeTab, setActiveTab] = useState("templates"); // Switching tabs flag
  const [userId, setUserId] = useState<number>(); // User telegram Id
  const socketRef = useRef(null);
  
  //----------------------at the first render -------------------------
  useEffect(() => {
    //-------------------- Getting user telegram Id ------------------------------
    if (window.Telegram.WebApp) {
      const user = window.Telegram.WebApp.initDataUnsafe?.user;
      if (user) {
        setUserId(user.id);
      } else {
        console.warn("User info not available.");
        }
      } else {
        console.error("Telegram WebApp not available.");
      }

    //------------------- fetching chatting history -----------------------------
    // if (userId) {
    //   fetch(`http://localhost:8000/messages?userId=${userId}`)
    //   .then(res => {
    //     if (!res.ok) throw new Error('Network response was not ok');
    //     return res.json();
    //   })
    //   .then(data => setRequests(data))
    //   .catch(err => console.log(err.message));
    // }
    
  //-------------------- socket connection -------------------------------------
    socketRef.current = io('http://localhost:8000'); 

    return () => { socketRef.current.disconnect(); }; 
  }, []);


  //---------------------- sending request to server -----------------------------
  const handleSendRequest = (requestText: string) => {
    //-------------------- store message to chating history ----------------------
    const newRequest: DriverRequest = {
      id: Date.now().toString(),
      request: requestText,
      timestamp: new Date(),
      status: 'sent'
    };

    setRequests(prev => [...prev, newRequest]);
    setActiveTab("status");

    //------------------- sending message part -----------------------------------
    if (!userId) {
          alert('Please enter your userId before sending messages.');
          return;
        }
        if (!requestText) return;
        socketRef.current.emit('chat message', {
          userId,
          content: requestText,
        });
  };


  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-900">
      <div className="h-full min-w-[350px] max-w-[800px] w-full bg-background flex flex-col relative overflow-y-hidden ">

        {/* ------------------ Title Bar ------------------*/}

        <div className="bg-primary text-primary-foreground p-3 shadow-soft flex-shrink-0">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={driverAvatar}
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

            {/* ------------------ Tablist(templates, status) ------------------ */}
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

            <TabsContent value="status" className="data-[state=active]:flex-1 data-[state=active]:flex data-[state=active]:flex-col mt-2 min-h-0">
              <RequestStatus requests={requests} />
            </TabsContent>

          </Tabs>
        </div>

        {/* ------------------ Custom Input ------------------ */}
        <div className="border bg-card p-4 mx-4 mb-4 mt-2 rounded-lg shadow-soft flex-shrink-0 z-50">
          <CustomMessageInput onSendMessage={handleSendRequest} />
        </div>

      </div>
    </div>
  );
};

export default Index;