import { useState, useEffect, useRef } from "react"; // Import react hook
import { io } from 'socket.io-client'; // Import socket for real-time chatting

// ---------------------- Import Component of UI -------------------------
import { Skeleton } from "@/components/ui/skeleton";
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
  const socketRef = useRef(null);
  const basicUrl = "https://hos.run.place";
  const webApp = window.Telegram.WebApp as any || null;

  const [userId, setUserId] = useState<string>(); // User telegram Id
  const [activeTab, setActiveTab] = useState("templates"); // Switching tabs flag
  const [isLoading, setIsLoading] = useState<Boolean>(false); // Rendering page flag
  const [requests, setRequests] = useState<DriverRequest[]>([]); // Requests history

  // -------------------- Verify if user is member or not -------------
  const verifyUser = (userId) => {
    if (typeof window.Telegram === 'undefined' || !window.Telegram.WebApp) {
      alert("❌ Telegram WebApp is not available. Please open this Mini App from Telegram.");
      return;
    }
    fetch(`${basicUrl}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // "ngrok-skip-browser-warning": "69420"
      },
      body: JSON.stringify({ telegramId: userId })
    }).then(res => {
      if (!res.ok) {
        webApp.showAlert("❌ Unauthorized access.", () => { webApp.close(); });
      }
    }).catch(err => {
      console.error("Error verifying user:", err);
      webApp.showAlert("❌ Something went wrong. Please try again.", () => { webApp.close() });
    }
    )
  };

  // -------------------- Arrange chatting history --------------------
  const handleAllHistory = (allHistory: any[]) => {
    const cache: DriverRequest[] = [];
    allHistory.forEach(each => {
      const newRequest: DriverRequest = {
        request: each.content,
        timestamp: each.created_at,
        sender: "driver",
      };
      cache.push(newRequest);

      if (each.replies && Array.isArray(each.replies)) {
        each.replies.forEach(item => {
          const newResponse: DriverRequest = {
            request: item.reply_content,
            timestamp: item.reply_at,
            sender: 'dispatcher',
          };
          cache.push(newResponse);
        })
      }
    });
    setRequests(cache);
  }

  // --------------------- Get Telegram UserInformation -------------
  const getTelegramUserInformation = () => {
    if (webApp) {
      const user = webApp.initDataUnsafe?.user;
      if (user) {
        setUserId(user.username);
        return user.username
      } else {
        webApp.showAlert("❌ User info not available", () => { webApp.close(); });
      }
    } else {
      webApp.showAlert("❌ Telegram WebApp not available.", () => { webApp.close(); });
    }
  }

  //---------------------- Fetch all chat history --------------------
  const getAllChatHistory = (userId) => {
    if (userId) {
      fetch(`${basicUrl}/messages?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // 'ngrok-skip-browser-warning': '69420'
        }
      })
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then(data => handleAllHistory(data))
        .catch(err => console.log(err.message));
    }

  }

  //----------------------At the first render -------------------------
  useEffect(() => {
    setIsLoading(true);
    const userId = getTelegramUserInformation();
    verifyUser(userId);
    getAllChatHistory(userId);

    //-------------------- socket connection -------------------------------------
    socketRef.current = io(`${basicUrl}`);

    //-------------------- Listen replied message --------------------------------
    if (!socketRef.current) return;
    socketRef.current.on('reply', (reply: { messageId: number, reply: string }) => {
      const newRequest: DriverRequest = {
        request: reply.reply,
        timestamp: new Date(),
        sender: "dispatcher",
      };
      setRequests(prev => [...prev, newRequest]);
      setActiveTab("status");
    });
    setIsLoading(false);

    return () => { socketRef.current.disconnect(); };
  }, []);


  //---------------------- sending request to server -----------------------------
  const handleSendRequest = (requestText: string) => {
    //-------------------- store message to chating history ----------------------
    const newRequest: DriverRequest = {
      request: requestText,
      timestamp: new Date(),
      sender: "driver",
    };

    setRequests(prev => [...prev, newRequest]);
    setActiveTab("status");

    //------------------- sending message part -----------------------------------
    if (!userId) {
      webApp.showAlert("❌ Unauthorized access.", () => { webApp.close(); });
      return;
    }
    if (!requestText) return;
    socketRef.current.emit('chat message', {
      userId,
      content: requestText,
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex flex-col">
        {/* Header Skeleton */}
        <div className="bg-gradient-primary text-primary-foreground p-4 shadow-soft flex-shrink-0">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="w-8 h-8 rounded-md" />
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col min-h-0 mx-4">
          <div className="mt-4 space-y-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>
        </div>

        {/* Bottom Input Skeleton */}
        <div className="border-t bg-card p-4 mx-4 mb-4 mt-3 rounded-lg shadow-soft flex-shrink-0">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    )
  }

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

            {/* ------------------ Chatting History ------------------ */}
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