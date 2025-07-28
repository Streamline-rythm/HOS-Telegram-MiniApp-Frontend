import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from 'socket.io-client';

import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RequestStatus } from "@/components/MessageHistory";
import { TemplateMessages } from "@/components/TemplateMessages";
import { CustomMessageInput } from "@/components/CustomMessageInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import { DriverRequest } from "@/types";
import driverAvatar from '@/assets/driver-avatar.png';
import { Activity, Truck, AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";

// =============================================================================
const Index = () => {
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const basicUrl = process.env.REACT_APP_API_URL || "https://hos-miniapp-backend-181509438418.us-central1.run.app";
  const webApp = window.Telegram?.WebApp as any || null;

  const [activeTab, setActiveTab] = useState("templates");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [requests, setRequests] = useState<DriverRequest[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // -------------------- Enhanced Error Handling --------------------
  const showError = useCallback((message: string, callback?: () => void) => {
    if (webApp) {
      webApp.showAlert(message, callback);
    } else {
      console.error(message);
      alert(message);
    }
  }, [webApp]);

  const showSuccess = useCallback((message: string) => {
    if (webApp) {
      webApp.showAlert(message);
    } else {
      console.log(message);
    }
  }, [webApp]);

  // -------------------- Fetch Telegram User Info --------------------
  const getTelegramUserInformation = useCallback((): string | undefined => {
    if (!webApp) {
      showError("❌ Telegram WebApp not available.");
      return;
    }

    const user = webApp.initDataUnsafe?.user;
    if (user?.username) {
      return user.username;
    } else {
      showError("❌ User info not available");
      return;
    }
  }, [webApp, showError]);

  // -------------------- Enhanced User Verification --------------------
  const verifyUser = useCallback(async (username: string): Promise<boolean> => {
    try {
      setConnectionError(null);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(`${basicUrl}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: username }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      showSuccess("✅ User verified successfully");
      return true;
    } catch (err: any) {
      const errorMessage = err.name === 'AbortError' 
        ? "❌ Verification timeout. Please check your connection."
        : `❌ Verification failed: ${err.message}`;
      
      setConnectionError(errorMessage);
      showError(errorMessage);
      return false;
    }
  }, [basicUrl, showError, showSuccess]);

  // -------------------- Enhanced Chat History Loading --------------------
  const getAllChatHistory = useCallback(async (username: string): Promise<boolean> => {
    try {
      setConnectionError(null);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch(`${basicUrl}/messages?userId=${username}&limit=50`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      handleAllHistory(data.messages || data);
      return true;
    } catch (err: any) {
      const errorMessage = err.name === 'AbortError' 
        ? "❌ History loading timeout. Please check your connection."
        : `❌ Failed to load chat history: ${err.message}`;
      
      setConnectionError(errorMessage);
      console.error("Error fetching chat history:", err);
      return false;
    }
  }, [basicUrl]);

  // -------------------- Enhanced Socket Connection --------------------
  const connectSocket = useCallback((username: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }

    setIsConnecting(true);
    setConnectionError(null);

    socketRef.current = io(basicUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected:", socketRef.current?.id);
      setIsOnline(true);
      setIsConnecting(false);
      setConnectionError(null);
      setRetryCount(0);
      
      socketRef.current?.emit('socket register', { userId: username });
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      setIsOnline(false);
      setIsConnecting(false);
      setConnectionError("❌ Connection failed. Please check your internet.");
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setIsOnline(false);
      setIsConnecting(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        setTimeout(() => {
          if (username) connectSocket(username);
        }, 2000);
      }
    });

    socketRef.current.on('reply', (reply: { messageId: number; reply: string; timestamp?: string }) => {
      const newRequest: DriverRequest = {
        request: reply.reply,
        timestamp: reply.timestamp ? new Date(reply.timestamp) : new Date(),
        sender: "dispatcher",
      };
      setRequests(prev => [...prev, newRequest]);
      setActiveTab("status");
      showSuccess("📨 New reply received!");
    });

    socketRef.current.on('error', (error: any) => {
      console.error("Socket error:", error);
      setConnectionError(`Socket error: ${error.message}`);
    });

    socketRef.current.on('registered', (data: any) => {
      console.log("✅ Socket registered:", data);
    });

    socketRef.current.on('message sent', (data: any) => {
      console.log("✅ Message sent successfully:", data);
    });

    return socketRef.current;
  }, [basicUrl, showSuccess]);

  // -------------------- Retry Connection --------------------
  const retryConnection = useCallback(async () => {
    if (!username) return;
    
    setRetryCount(prev => prev + 1);
    setIsConnecting(true);
    setConnectionError(null);

    try {
      const verified = await verifyUser(username);
      if (verified) {
        await getAllChatHistory(username);
        connectSocket(username);
      }
    } catch (error) {
      console.error("Retry failed:", error);
      setConnectionError("❌ Retry failed. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  }, [username, verifyUser, getAllChatHistory, connectSocket]);

  // -------------------- Format Chat History --------------------
  const handleAllHistory = useCallback((allHistory: any[]) => {
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
  }, []);

  // -------------------- Enhanced Initial App Load --------------------
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setConnectionError(null);

      try {
        const user = getTelegramUserInformation();
        if (!user) {
          setIsLoading(false);
          return;
        }

        setUsername(user);
        const verified = await verifyUser(user);
        
        if (!verified) {
          setIsLoading(false);
          return;
        }

        const historyLoaded = await getAllChatHistory(user);
        if (!historyLoaded) {
          setIsLoading(false);
          return;
        }

        connectSocket(user);
      } catch (error) {
        console.error("Initialization error:", error);
        setConnectionError("❌ Failed to initialize app");
      } finally {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        console.log("🔌 Disconnecting socket...");
        socketRef.current.disconnect();
      }
    };
  }, [getTelegramUserInformation, verifyUser, getAllChatHistory, connectSocket]);

  // -------------------- Enhanced Send Message --------------------
  const handleSendRequest = useCallback((requestText: string) => {
    if (!username || !requestText.trim()) {
      showError("❌ Cannot send empty message or missing user.");
      return;
    }

    if (!isOnline) {
      showError("❌ You are offline. Please check your connection.");
      return;
    }

    const newRequest: DriverRequest = {
      request: requestText,
      timestamp: new Date(),
      sender: "driver",
    };

    setRequests(prev => [...prev, newRequest]);
    setActiveTab("status");

    socketRef.current?.emit('chat message', {
      userId: username,
      content: requestText,
    });

    showSuccess("📤 Message sent!");
  }, [username, isOnline, showError, showSuccess]);

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

  // -------------------- Connection Status Component --------------------
  const ConnectionStatus = () => {
    if (connectionError) {
      return (
        <Alert className="mx-4 mt-2 border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{connectionError}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={retryConnection}
              disabled={isConnecting}
              className="ml-2"
            >
              {isConnecting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="mx-4 mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm text-muted-foreground">
            {isOnline ? "Connected" : "Disconnected"}
          </span>
        </div>
        {isConnecting && (
          <Badge variant="secondary" className="text-xs">
            Connecting...
          </Badge>
        )}
      </div>
    );
  };

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
                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-primary-border ${
                  isOnline ? 'bg-success' : 'bg-destructive'
                }`}></div>
              </div>
              <div>
                <h1 className="font-bold text-lg">HOS support</h1>
                <p className="text-sm opacity-85">Smart AI Communication</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Connection Status */}
        <ConnectionStatus />

        {/* Main */}
        <div className="flex-1 flex flex-col mx-4 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 mt-2 flex-shrink-0">
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <Truck size={20} />
                Driver Requests
                {requests.filter(r => r.sender === 'driver').length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {requests.filter(r => r.sender === 'driver').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="status" className="flex items-center gap-2">
                <Activity size={20} />
                Status
                {requests.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {requests.length}
                  </Badge>
                )}
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
          <CustomMessageInput onSendMessage={handleSendRequest} disabled={!isOnline} />
        </div>
      </div>
    </div>
  );
};

export default Index;
