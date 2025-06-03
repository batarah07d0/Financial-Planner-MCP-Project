// Mock untuk paket ws
// Ini adalah implementasi sederhana yang menggantikan fungsionalitas ws
// yang membutuhkan modul Node.js yang tidak tersedia di React Native

class WebSocket {
  constructor(url, protocols) {
    this.url = url;
    this.protocols = protocols;
    this.readyState = 0; // CONNECTING
    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSING = 2;
    this.CLOSED = 3;

    // Event handlers - definisikan sebagai properties
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    
    // Gunakan WebSocket native jika tersedia
    if (typeof window !== 'undefined' && window.WebSocket) {
      try {
        this._ws = new window.WebSocket(url, protocols);
        this._bindEvents();
      } catch (e) {
        console.error('Error creating WebSocket:', e);
        this._triggerError(e);
      }
    } else {
      console.warn('WebSocket tidak tersedia di lingkungan ini');
      setTimeout(() => this._triggerError(new Error('WebSocket tidak tersedia')), 0);
    }
  }
  
  _bindEvents() {
    if (!this._ws) return;
    
    this._ws.onopen = (event) => {
      this.readyState = this.OPEN;
      if (typeof this.onopen === 'function') {
        this.onopen(event);
      }
    };
    
    this._ws.onclose = (event) => {
      this.readyState = this.CLOSED;
      if (typeof this.onclose === 'function') {
        this.onclose(event);
      }
    };
    
    this._ws.onerror = (event) => {
      if (typeof this.onerror === 'function') {
        this.onerror(event);
      }
    };
    
    this._ws.onmessage = (event) => {
      if (typeof this.onmessage === 'function') {
        this.onmessage(event);
      }
    };
  }
  
  _triggerError(error) {
    if (typeof this.onerror === 'function') {
      this.onerror({ error });
    }
  }
  
  send(data) {
    if (this._ws && this.readyState === this.OPEN) {
      this._ws.send(data);
    } else {
      throw new Error('WebSocket tidak dalam keadaan OPEN');
    }
  }
  
  close(code, reason) {
    if (this._ws) {
      this.readyState = this.CLOSING;
      this._ws.close(code, reason);
    }
  }
}

// Export mock untuk ws
module.exports = {
  WebSocket,
  createWebSocketStream: () => {
    throw new Error('createWebSocketStream tidak diimplementasikan di mock ini');
  },
  Server: function() {
    throw new Error('WebSocketServer tidak diimplementasikan di mock ini');
  }
};
