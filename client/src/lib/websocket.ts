/**
 * WebSocket service for real-time communication
 * Handles emergency alerts and location updates
 */

export type WebSocketData = {
  type: string;
  message?: string;
  data?: any;
};

export type LocationData = {
  userId: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
};

export type EmergencyData = {
  userId: number;
  location: LocationData;
  description?: string;
  timestamp: string;
};

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private connectionPromise: Promise<WebSocket> | null = null;

  /**
   * Initialize WebSocket connection
   */
  public connect(): Promise<WebSocket> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        console.log(`Connecting to WebSocket at ${wsUrl}`);
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log("WebSocket connection established");
          this.socket = socket;
          this.reconnectAttempts = 0;
          resolve(socket);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("WebSocket message received:", data);
            this.notifyListeners(data.type, data);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        socket.onclose = (event) => {
          console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
          this.socket = null;
          this.connectionPromise = null;

          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const backoffDelay = Math.min(
              1000 * Math.pow(1.5, this.reconnectAttempts),
              15000
            );

            console.log(`Attempting to reconnect in ${backoffDelay/1000}s...`);
            this.reconnectAttempts++;

            if (this.reconnectTimeout) {
              clearTimeout(this.reconnectTimeout);
            }

            this.reconnectTimeout = setTimeout(() => {
              this.connect().catch(console.error);
            }, backoffDelay);
          } else {
            console.error("Maximum reconnection attempts reached");
            reject(new Error("Maximum reconnection attempts reached"));
          }
        };

        socket.onerror = (error) => {
          console.error("WebSocket error:", error);
          if (!this.socket) {
            reject(error);
          }
        };
      } catch (error) {
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect WebSocket
   */
  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
      this.socket = null;
    }

    this.connectionPromise = null;
    this.listeners.clear();
  }

  /**
   * Send emergency alert
   */
  public async sendEmergency(emergencyData: EmergencyData): Promise<void> {
    await this.sendMessage({
      type: 'emergency',
      data: emergencyData
    });
  }

  /**
   * Send location update
   */
  public async sendLocationUpdate(locationData: LocationData): Promise<void> {
    await this.sendMessage({
      type: 'location_update',
      data: locationData
    });
  }

  /**
   * Send custom message
   */
  public async sendMessage(data: WebSocketData): Promise<void> {
    try {
      const socket = await this.connect();

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
      } else {
        throw new Error("WebSocket is not open");
      }
    } catch (error) {
      console.error("Error sending WebSocket message:", error);
      throw error;
    }
  }

  /**
   * Add event listener
   */
  public addEventListener(type: string, callback: (data: any) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type)?.add(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(type: string, callback: (data: any) => void): void {
    const listeners = this.listeners.get(type);

    if (listeners) {
      listeners.delete(callback);

      if (listeners.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  /**
   * Notify all listeners of an event
   */
  private notifyListeners(type: string, data: any): void {
    const listeners = this.listeners.get(type);

    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket listener for '${type}':`, error);
        }
      });
    }
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Hook for React components to use WebSocket
export function useWebSocket() {
  return websocketService;
}