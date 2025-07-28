export {};

declare global {
  interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
      user?: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
        language_code?: string;
      };
    };
    ready(): void;
    sendData(data: string): void;
    close(): void;

    // ✅ Add missing methods like showAlert here:
    showAlert(message: string, callback?: () => void): void;
  }

  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
}
