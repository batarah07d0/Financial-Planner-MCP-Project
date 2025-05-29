// Mock untuk modul dgram
// Ini adalah implementasi sederhana yang tidak melakukan apa-apa

class Socket {
  constructor(type) {
    this.type = type;
    this.eventHandlers = {};
  }

  bind(port, address, callback) {
    if (typeof callback === 'function') {
      setTimeout(callback, 0);
    }
    return this;
  }

  on(event, handler) {
    this.eventHandlers[event] = handler;
    return this;
  }

  once(event, handler) {
    const onceHandler = (...args) => {
      this.removeListener(event, onceHandler);
      handler(...args);
    };
    return this.on(event, onceHandler);
  }

  removeListener(event, handler) {
    if (this.eventHandlers[event] === handler) {
      delete this.eventHandlers[event];
    }
    return this;
  }

  send(msg, offset, length, port, address, callback) {
    if (typeof offset === 'number' && typeof length === 'number') {
      // Bentuk lengkap
    } else if (typeof offset === 'number' && typeof length === 'function') {
      // offset adalah port, length adalah callback
      callback = length;
      address = port;
      port = offset;
      offset = 0;
      length = msg.length;
    } else if (typeof offset === 'function') {
      // offset adalah callback
      callback = offset;
      offset = 0;
      length = msg.length;
      port = 0;
      address = '0.0.0.0';
    }

    if (typeof callback === 'function') {
      setTimeout(() => callback(null), 0);
    }
    return this;
  }

  close(callback) {
    if (typeof callback === 'function') {
      setTimeout(callback, 0);
    }
    return this;
  }

  address() {
    return {
      address: '0.0.0.0',
      family: 'IPv4',
      port: 0
    };
  }

  setBroadcast(flag) {
    return this;
  }

  setTTL(ttl) {
    return this;
  }

  setMulticastTTL(ttl) {
    return this;
  }

  setMulticastInterface(interfaceAddress) {
    return this;
  }

  addMembership(multicastAddress, interfaceAddress) {
    return this;
  }

  dropMembership(multicastAddress, interfaceAddress) {
    return this;
  }

  ref() {
    return this;
  }

  unref() {
    return this;
  }
}

function createSocket(options, callback) {
  if (typeof options === 'string') {
    options = { type: options };
  }
  
  const socket = new Socket(options.type);
  
  if (typeof callback === 'function') {
    socket.on('message', callback);
  }
  
  return socket;
}

module.exports = {
  createSocket,
  Socket
};
