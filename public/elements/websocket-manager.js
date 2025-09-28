class WebSocketManager {
  constructor() {
    // 单例模式实现
    if (WebSocketManager.instance) {
      return WebSocketManager.instance;
    }
    WebSocketManager.instance = this;
    
    this.connection = null; // WebSocket连接实例
    this.isConnecting = false; // 连接状态标记
    this.callbacks = new Set(); // 消息回调集合
    this.deviceId = null; // 当前订阅的设备ID
  }

  /**
   * 建立WebSocket连接
   * @param {string} url - WebSocket服务器地址
   * @param {string} deviceId - 要订阅的设备ID
   * @returns {Promise} - 连接成功的Promise
   */
  connect(url, deviceId) {
    // 如果已连接且设备ID相同，则直接返回现有连接
    if (this.connection && this.deviceId === deviceId) {
      return Promise.resolve(this.connection);
    }
    
    // 如果正在连接中，等待连接完成
    if (this.isConnecting) {
      return new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (!this.isConnecting && this.connection) {
            clearInterval(checkConnection);
            resolve(this.connection);
          }
        }, 100);
      });
    }

    this.isConnecting = true;
    this.deviceId = deviceId;
    
    return new Promise((resolve, reject) => {
      // 关闭现有连接
      if (this.connection) {
        try {
          this.connection.close();
        } catch (e) {
          console.warn('关闭现有连接失败:', e);
        }
      }

      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('WebSocket连接已建立');
        this.isConnecting = false;
        this.connection = ws;
        
        // 发送订阅消息
        ws.send(JSON.stringify({
          type: "subscribe",
          device_id: deviceId,
          client_id: `dashboard_${Date.now()}`,
          client_type: "medical_dashboard"
        }));
        
        resolve(ws);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // 通知所有注册的回调
          this.callbacks.forEach(callback => callback(data));
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
        this.isConnecting = false;
        reject(error);
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket连接已关闭:', event.code, event.reason);
        this.isConnecting = false;
        this.connection = null;
      };
    });
  }

  /**
   * 注册消息回调
   * @param {Function} callback - 消息处理函数
   * @returns {Function} - 用于移除回调的函数
   */
  addCallback(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * 断开WebSocket连接
   */
  disconnect() {
    if (this.connection) {
      try {
        this.connection.close(1000, '客户端主动断开');
      } catch (e) {
        console.warn('关闭连接失败:', e);
      }
      this.connection = null;
      this.isConnecting = false;
    }
  }

  /**
   * 检查连接是否活跃
   * @returns {boolean} - 连接状态
   */
  isConnected() {
    return this.connection && this.connection.readyState === WebSocket.OPEN;
  }
}

// 导出单例实例
export const websocketManager = new WebSocketManager();
