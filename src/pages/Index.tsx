import { useState, useEffect, useRef } from "react";
import { io, Socket } from 'socket.io-client';

import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RequestStatus } from "@/components/MessageHistory";
import { TemplateMessages } from "@/components/TemplateMessages";
import { CustomMessageInput } from "@/components/CustomMessageInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DriverRequest } from "@/types";
import driverAvatar from '@/assets/driver-avatar.png';
import { Activity, Truck } from "lucide-react";

// =============================================================================
const Index = () => {
  const socketRef = useRef<Socket | null>(null);
  const basicUrl = "https://hos-miniapp-backend-181509438418.us-central1.run.app";
  const webApp = window.Telegram?.WebApp as any || null;

  const [activeTab, setActiveTab] = useState("templates");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [requests, setRequests] = useState<DriverRequest[]>([]);

  // -------------------- Verify Telegram User --------------------
  const verifyUser = async (username: string) => {
    try {
      const res = await fetch(`${basicUrl}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: username }),
      });

      if (!res.ok) {
        webApp.showAlert("❌ Unauthorized access.", () => webApp.close());
      }
    } catch (err) {
      console.error("Error verifying user:", err);
      webApp.showAlert("❌ Something went wrong. Please try again.", () => webApp.close());
    }
  };

  // -------------------- Format Chat History --------------------
  const handleAllHistory = (allHistory: any[]) => {
    const cache: DriverRequest[] = [];

    allHistory.forEach(entry => {
      cache.push({
        request: entry.content,
        timestamp: entry.created_at,
        sender: "driver",
      });

      entry.replies?.forEach((item: any) => {
        cache.push({
          request: item.reply_content,
          timestamp: item.reply_at,
          sender: 'dispatcher',
        });
      });
    });

    setRequests(cache);
  };

  // -------------------- Convert UTCString To LocalString --------------------
  const formatTime = (utcString: string) => {
    const isoUtcString = utcString.replace(' ', 'T') + 'Z';
    return new Date(isoUtcString);
    // return new Date(utcString).toLocaleString('en-US', {
    //   hour: '2-digit',
    //   minute: '2-digit',
    //   second: '2-digit',
    //   hour12: true
    // });
  };

  // -------------------- Load Chat History --------------------
  const getAllChatHistory = async (username: string) => {
    try {
      const res = await fetch(`${basicUrl}/messages?userId=${username}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      handleAllHistory(data);
    } catch (err) {
      console.error("Error fetching chat history:", err);
    }
  };

  // -------------------- Initial App Load --------------------
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      if (!window.Telegram?.WebApp) {
        alert("❌ Telegram WebApp not available.");
        return;
      }

      window.Telegram.WebApp.ready();

      const username = window.Telegram.WebApp.initDataUnsafe?.user?.username;
      if (!username) {
        window.Telegram.WebApp.showAlert("❌ User info not available", () => window.Telegram.WebApp.close());
        return;
      }

      try {
        await verifyUser(username);
      } catch (err) {
        console.error("❌ User verification failed:", err);
        window.Telegram.WebApp.showAlert("❌ You are not authorized", () => window.Telegram.WebApp.close());
        return;
      }

      const socket = io(basicUrl, {
        transports: ['websocket'],
        withCredentials: true,
      });

      socketRef.current = socket;

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      try {
        await Promise.race([
          new Promise<void>((resolve) => {
            socket.on("connect", () => {
              console.log("✅ Socket connected:", socket.id);
              socket.emit('socket register', { userId: username });
              resolve();
            });
          }),
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error("⏱️ Socket connection timed out")), 60000)
          ),
        ]);
      } catch (err) {
        console.error(err.message || err);
        window.Telegram.WebApp.showAlert("❌ Failed to connect to server. Try again later.", () => window.Telegram.WebApp.close());
        return;
      }

      try {
        await getAllChatHistory(username);
      } catch (err) {
        console.error("❌ User verification failed:", err);
        window.Telegram.WebApp.showAlert("❌ You are not authorized", () => window.Telegram.WebApp.close());
        return;
      }

      socket.on('reply', (reply: { messageId: number; reply: string; currentTime: string }) => {
        const newRequest: DriverRequest = {
          request: reply.reply,
          timestamp: formatTime(reply.currentTime),
          sender: "dispatcher",
        };
        setRequests((prev) => [...prev, newRequest]);
        setActiveTab("status");
      });

      setIsLoading(false);
    };

    init();

    // Cleanup function to disconnect socket when component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        console.log("🧹 Socket disconnected on cleanup");
      }
    };
  }, []);


  // -------------------- Send Message --------------------
  const handleSendRequest = (requestText: string) => {
    const username = window.Telegram?.WebApp?.initDataUnsafe?.user?.username;

    if (!username || !requestText) {
      window.Telegram?.WebApp?.showAlert("❌ Cannot send empty message or missing user.", () => window.Telegram?.WebApp?.close());
      return;
    }

    if (!socketRef.current?.connected) {
      window.Telegram.WebApp.showAlert("❌ Socket is not connected. Try again.");
      return;
    }

    socketRef.current.emit('chat message', {
      userId: username,
      content: requestText,
    }, (response) => {
      if (response.success) {
        const newRequest: DriverRequest = {
          request: response.request,
          timestamp: formatTime(response.timestamp),
          sender: "driver",
        };
        setRequests(prev => [...prev, newRequest]);
        setActiveTab("status");
      } else {
        console.log("Error:", response.error);
      }
    }
    );
  };

  // -------------------- Loading UI --------------------
  if (isLoading) {
    return (
      <div className="h-screen bg-background flex flex-col">
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

        <div className="flex-1 flex flex-col min-h-0 mx-4 mt-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>

        <div className="border-t bg-card p-4 mx-4 mb-4 mt-3 rounded-lg shadow-soft flex-shrink-0">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    );
  }

  // -------------------- Main UI --------------------
  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-900">
      <div className="h-full min-w-[350px] max-w-[800px] w-full bg-background flex flex-col relative overflow-y-hidden">
        {/* Header */}
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

        {/* Main */}
        <div className="flex-1 flex flex-col mx-4 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
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

            <TabsContent value="templates" className="data-[state=active]:flex-1 mt-0 overflow-hidden min-h-0">
              <TemplateMessages onSendMessage={handleSendRequest} />
            </TabsContent>

            <TabsContent value="status" className="data-[state=active]:flex-1 flex flex-col mt-2 min-h-0">
              <RequestStatus requests={requests} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Input */}
        <div className="border bg-card p-4 mx-4 mb-4 mt-2 rounded-lg shadow-soft flex-shrink-0 z-50">
          <CustomMessageInput onSendMessage={handleSendRequest} />
        </div>
      </div>
    </div>
  );
};

export default Index;
