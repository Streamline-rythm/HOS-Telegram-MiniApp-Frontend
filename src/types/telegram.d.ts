export {};
declare global {
    interface Window {
      Telegram: {
        WebApp: {
          initData: string;
          initDataUnsafe: {
            user?: {
              id: number;
              first_name: string;
              last_name?: string;
              username?: string;
              language_code?: string;
            };
            // ... other possible fields
          };
          ready(): void;
          sendData(data: string): void;
          close(): void;
          // You can add more methods if needed
        };
      };
    }
  }
  