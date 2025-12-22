/**
 * Broadcast Server for Calendar Dashboard Kiosk Mode
 * Synchronizes multiple tablets/displays with the main calendar
 */

const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3001;
const CALENDAR_URL = process.env.CALENDAR_URL || 'http://localhost:3000';

// Connected clients
const clients = new Map();

// Create HTTP server
const server = http.createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      clients: clients.size,
      uptime: process.uptime(),
    }));
    return;
  }

  // Status endpoint
  if (req.url === '/status') {
    const clientList = Array.from(clients.values()).map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      resolution: c.resolution,
      theme: c.theme,
      connectedAt: c.connectedAt,
      lastPing: c.lastPing,
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      clients: clientList,
      totalClients: clients.size,
    }));
    return;
  }

  // Broadcast command endpoint
  if (req.url === '/broadcast' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const command = JSON.parse(body);
        broadcastToAll(command);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, recipients: clients.size }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Generate unique client ID
function generateClientId() {
  return `kiosk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Broadcast message to all clients
function broadcastToAll(message, excludeId = null) {
  const payload = JSON.stringify(message);
  clients.forEach((client, ws) => {
    if (client.id !== excludeId && ws.readyState === 1) {
      ws.send(payload);
    }
  });
}

// Broadcast to specific client type
function broadcastToType(type, message) {
  const payload = JSON.stringify(message);
  clients.forEach((client, ws) => {
    if (client.type === type && ws.readyState === 1) {
      ws.send(payload);
    }
  });
}

wss.on('connection', (ws, req) => {
  const clientId = generateClientId();
  const clientInfo = {
    id: clientId,
    name: `Kiosk ${clients.size + 1}`,
    type: 'tablet',
    resolution: null,
    theme: 'auto',
    connectedAt: new Date().toISOString(),
    lastPing: Date.now(),
  };

  clients.set(ws, clientInfo);
  console.log(`Client connected: ${clientId}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    clientId,
    serverTime: Date.now(),
    calendarUrl: CALENDAR_URL,
  }));

  // Notify other clients
  broadcastToAll({
    type: 'client_joined',
    clientId,
    totalClients: clients.size,
  }, clientId);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      const client = clients.get(ws);

      switch (message.type) {
        case 'register':
          // Update client info
          client.name = message.name || client.name;
          client.type = message.deviceType || client.type;
          client.resolution = message.resolution;
          client.theme = message.theme || 'auto';
          console.log(`Client registered: ${client.name} (${client.resolution?.width}x${client.resolution?.height})`);
          break;

        case 'ping':
          client.lastPing = Date.now();
          ws.send(JSON.stringify({ type: 'pong', serverTime: Date.now() }));
          break;

        case 'sync_request':
          // Request sync from all clients
          broadcastToAll({
            type: 'sync_request',
            requesterId: client.id,
            timestamp: Date.now(),
          }, client.id);
          break;

        case 'sync_response':
          // Forward sync data to requester
          const targetWs = Array.from(clients.entries())
            .find(([_, c]) => c.id === message.targetId)?.[0];
          if (targetWs && targetWs.readyState === 1) {
            targetWs.send(JSON.stringify({
              type: 'sync_data',
              from: client.id,
              data: message.data,
            }));
          }
          break;

        case 'navigate':
          // Broadcast navigation command to all kiosks
          broadcastToAll({
            type: 'navigate',
            view: message.view,
            date: message.date,
            from: client.id,
          }, client.id);
          break;

        case 'theme_change':
          // Broadcast theme change
          broadcastToAll({
            type: 'theme_change',
            theme: message.theme,
            from: client.id,
          }, client.id);
          break;

        case 'refresh':
          // Command all kiosks to refresh
          broadcastToAll({
            type: 'refresh',
            from: client.id,
          });
          break;

        case 'event_update':
          // Broadcast event changes
          broadcastToAll({
            type: 'event_update',
            action: message.action,
            event: message.event,
            from: client.id,
          }, client.id);
          break;

        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (e) {
      console.error('Error processing message:', e);
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    clients.delete(ws);
    console.log(`Client disconnected: ${client?.id}`);

    // Notify other clients
    broadcastToAll({
      type: 'client_left',
      clientId: client?.id,
      totalClients: clients.size,
    });
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${clientInfo.id}:`, error);
  });
});

// Periodic cleanup of stale connections
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 60000; // 1 minute

  clients.forEach((client, ws) => {
    if (now - client.lastPing > staleThreshold) {
      console.log(`Removing stale client: ${client.id}`);
      ws.terminate();
      clients.delete(ws);
    }
  });
}, 30000);

// Start server
server.listen(PORT, () => {
  console.log(`Broadcast server running on port ${PORT}`);
  console.log(`Calendar URL: ${CALENDAR_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down broadcast server...');
  
  // Notify all clients
  broadcastToAll({ type: 'server_shutdown' });
  
  wss.close(() => {
    server.close(() => {
      console.log('Server shut down');
      process.exit(0);
    });
  });
});
