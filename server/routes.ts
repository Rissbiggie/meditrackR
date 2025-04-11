import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import setupRoutes from "./routes/index";
import { WebSocketServer, WebSocket } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Set up all application routes
  setupRoutes(app);

  // Create HTTP server instance
  const httpServer = createServer(app);
  
  // Add WebSocket server on a distinct path to avoid conflicts with Vite's HMR websocket
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to MediTrack Emergency WebSocket Server'
    }));
    
    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'emergency':
            // Broadcast emergency to all connected clients
            broadcastMessage({
              type: 'emergency_alert',
              data: data.data
            }, ws);
            break;
          
          case 'location_update':
            // Broadcast location update to all connected clients
            broadcastMessage({
              type: 'location_updated',
              data: data.data
            }, ws);
            break;
            
          default:
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Unknown message type'
            }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });
  
  // Function to broadcast messages to all connected clients
  function broadcastMessage(message: any, sender?: WebSocket) {
    wss.clients.forEach((client) => {
      // Check if client is not the sender and connection is open
      if ((!sender || client !== sender) && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  return httpServer;
}
