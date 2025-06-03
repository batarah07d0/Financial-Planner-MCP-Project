/**
 * Type declarations untuk react-native-tcp-socket
 * Ini mengatasi masalah Flow type annotations yang tidak kompatibel dengan TypeScript
 */

declare module 'react-native-tcp-socket' {
  import { EventEmitter } from 'events';

  export interface TcpSocketOptions {
    port?: number;
    host?: string;
    localAddress?: string;
    localPort?: number;
    family?: number;
    allowHalfOpen?: boolean;
  }

  export interface AddressInfo {
    port: number;
    address: string;
    family: string;
  }

  export class TcpSocket extends EventEmitter {
    constructor(options?: TcpSocketOptions);
    
    connect(port: number, host?: string, callback?: () => void): this;
    connect(options: TcpSocketOptions, callback?: () => void): this;
    
    write(data: string | Buffer, encoding?: string, callback?: (error?: Error) => void): boolean;
    end(data?: string | Buffer, encoding?: string, callback?: () => void): void;
    destroy(): void;
    
    address(): AddressInfo | null;
    
    readonly readyState: 'opening' | 'open' | 'readOnly' | 'writeOnly' | 'closed';
    readonly destroyed: boolean;
    readonly connecting: boolean;
    
    // Events
    on(event: 'connect', listener: () => void): this;
    on(event: 'data', listener: (data: Buffer) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'close', listener: (hadError: boolean) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }

  export class TcpServer extends EventEmitter {
    constructor(connectionListener?: (socket: TcpSocket) => void);
    
    listen(port?: number, host?: string, callback?: () => void): this;
    listen(options: { port?: number; host?: string }, callback?: () => void): this;
    
    close(callback?: () => void): void;
    address(): AddressInfo | null;
    getConnections(callback: (error: Error | null, count: number) => void): void;
    
    // Events
    on(event: 'listening', listener: () => void): this;
    on(event: 'connection', listener: (socket: TcpSocket) => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }

  export function createServer(connectionListener?: (socket: TcpSocket) => void): TcpServer;
  export function createConnection(port: number, host?: string, callback?: () => void): TcpSocket;
  export function createConnection(options: TcpSocketOptions, callback?: () => void): TcpSocket;

  // Default exports
  const tcp: {
    createServer: typeof createServer;
    createConnection: typeof createConnection;
    TcpSocket: typeof TcpSocket;
    TcpServer: typeof TcpServer;
  };

  export default tcp;
}
