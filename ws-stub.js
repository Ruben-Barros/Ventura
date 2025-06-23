class WebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
  }

  close() {
    this.readyState = WebSocket.CLOSED;
  }

  send() {
    console.warn('WebSocket.send() called on stub implementation');
  }

  addEventListener() {
    console.warn('WebSocket.addEventListener() called on stub implementation');
  }
}

WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;

module.exports = WebSocket;