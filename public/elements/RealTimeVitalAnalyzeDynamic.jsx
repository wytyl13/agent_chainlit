import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Wind, Activity, RefreshCw, AlertTriangle, Settings, Download, Printer, Pause, Bed, User, Zap, Wifi, WifiOff, Maximize, Minimize } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"

export default function CompactMedicalDashboard() {
  // WebSocket连接状态
  const [wsStatus, setWsStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [wsError, setWsError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  // 添加连接锁，防止重复连接
  const connectionLockRef = useRef(false);
  const cleanupTimeoutRef = useRef(null);

  // 全屏状态管理
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const [parentTheme, setParentTheme] = useState('dark'); // 检测父页面主题

  // 从props获取配置
  console.log('=== CompactMedicalDashboard 调试信息 ===');
  console.log('全局 props:', props);
  
  // 获取device_id，支持多种格式
  let deviceId = 'UART__TOPIC_SX_SLEEP_HEART_RATE_LG_02_ODATA'; // 默认值
  // 根据页面协议自动选择WebSocket协议，避免混合内容问题
  let wsUrl = typeof window !== 'undefined' && window.location.protocol === 'https:' 
    ? 'wss://ai.shunxikj.com:9036' 
    : 'ws://ai.shunxikj.com:9036';
  
  if (typeof props === 'string') {
    deviceId = props;
  } else if (props?.device_id) {
    deviceId = props.device_id;
  } else if (props?.deviceId) {
    deviceId = props.deviceId;
  }
  
  if (props?.ws_url || props?.wsUrl) {
    wsUrl = props.ws_url || props.wsUrl;
  }

  // 状态管理
  const [currentTime, setCurrentTime] = useState(new Date());
  const [vitals, setVitals] = useState({
    heartRate: 0,
    respRate: 0,
    status: '等待数据',
    lastUpdate: new Date()
  });
  const [realTimeStatus, setRealTimeStatus] = useState({
    movement: '无体动',
    bedStatus: '等待数据',
    breathing: '等待数据',
    lastUpdate: new Date()
  });
  const [ecgData, setEcgData] = useState([]);
  const [respData, setRespData] = useState([]);
  const [heartTrendData, setHeartTrendData] = useState([]);
  const [respTrendData, setRespTrendData] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [rawData, setRawData] = useState(null); // 存储最新的原始数据

  const [timeSpan] = useState(8); // 固定8秒
  const [showSettings, setShowSettings] = useState(false); // 控制设置菜单显示
  const [currentTimestamp, setCurrentTimestamp] = useState(null); // 当前时间戳

  // 固定8秒，波形图每秒25个数据点，趋势图每秒1个数据点
  const getWaveformDataPointsCount = () => 8 * 25; // 200个数据点
  const getTrendDataPointsCount = () => 8; // 8个数据点

  // 将Unix时间戳转换为上海时区时间
  const formatTimestampToShanghai = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000); // 转换为毫秒
    return date.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 生成时间轴刻度标签（每2秒一个刻度）
  const generateTimeLabels = (currentTimestamp) => {
    if (!currentTimestamp) return ['', '', '', '', ''];
    
    const labels = [];
    for (let i = 4; i >= 0; i--) {
      const timestamp = currentTimestamp - (i * 2); // 每2秒间隔
      labels.push(formatTimestampToShanghai(timestamp));
    }
    return labels;
  };

  // 患者信息 - 从props中获取
  const patientInfo = {
    name: props?.user_name || '张伟',
    id: props?.user_id || 'P202309001',
    room: props?.room || 'ICU-3床',
    doctor: props?.manager || '李华医生'
  };

  // 获取生命体征状态颜色
  const getVitalStatus = (heartRate, respRate) => {
    // 如果数值为0，表示无信号，不判断为异常
    if (heartRate === 0 && respRate === 0) return { status: '无信号', color: 'gray' };
    if (heartRate === 0) return { status: '心率无信号', color: 'gray' };
    if (respRate === 0) return { status: '呼吸无信号', color: 'gray' };
    
    const hrNormal = heartRate >= 60 && heartRate <= 90;
    const rrNormal = respRate >= 12 && respRate <= 20;
    
    if (hrNormal && rrNormal) return { status: '正常', color: 'green' };
    if (!hrNormal || !rrNormal) return { status: '警告', color: 'yellow' };
    return { status: '异常', color: 'red' };
  };

  // 处理WebSocket数据
  const processWebSocketData = useCallback((data) => {
    console.log('处理WebSocket数据:', data);
    setRawData(data);
    
    if (data.type === 'realtime_data' && data.data) {
      const wsData = data.data;
      const now = new Date();
      
      // 更新当前时间戳
      if (wsData.timestamp) {
        setCurrentTimestamp(wsData.timestamp);
      }
      
      // 更新生命体征数据
      const heartRate = Math.round(wsData.heart_bpm || 0);
      const respRate = Math.round(wsData.breath_bmp || wsData.breath_bpm || 0);
      const vitalStatus = getVitalStatus(heartRate, respRate);
      
      setVitals({
        heartRate,
        respRate,
        status: vitalStatus.status,
        lastUpdate: now
      });

      // 根据valid_bit_id映射实时状态
      const validBit = wsData.valid_bit_id !== undefined ? wsData.valid_bit_id : 0;
      
      let bedStatus = '在床';        // 默认在床
      let movement = '无体动';       // 默认无体动  
      let breathing = '正常';        // 默认正常呼吸
      
      switch (validBit) {
        case 0:
          bedStatus = '在床';
          movement = '无体动';
          breathing = '正常';
          break;
        case 1:
          bedStatus = '离床';
          movement = '无体动';
          breathing = '正常';
          break;
        case 2:
          bedStatus = '在床';
          movement = '体动';
          breathing = '正常';
          break;
        case 3:
          bedStatus = '在床';
          movement = '无体动';
          breathing = '弱呼吸';
          break;
        case 4:
          bedStatus = '在床';
          movement = '重物';
          breathing = '正常';
          break;
        case 5:
          bedStatus = '在床';
          movement = '无体动';
          breathing = '打鼾';
          break;
        default:
          // 保持默认值
          break;
      }

      setRealTimeStatus({
        movement,
        bedStatus,
        breathing,
        lastUpdate: now
      });

      setEcgData(prev => {
        // 判断是数组还是单个值
        const newValues = Array.isArray(wsData.heart_curve) 
          ? wsData.heart_curve 
          : [wsData.heart_curve || 0];
          
        // 调试信息：检查数据接收情况
        console.log(`心电数据更新: 接收${newValues.length}个新数据点, 当前队列${prev.length}个点`);
        if (newValues.length > 50) {
          console.warn(`警告: 单次接收数据点过多(${newValues.length}个)，可能不是增量数据！`);
        }
        
        const newData = [...prev, ...newValues];  // 展开数组
        const finalData = newData.slice(-getWaveformDataPointsCount()); // 保持200个数据点（8秒*25点/秒）
        
        console.log(`心电数据处理: ${prev.length} -> ${newData.length} -> ${finalData.length}`);
        return finalData;
      });

      setRespData(prev => {
        // 判断是数组还是单个值
        const newValues = Array.isArray(wsData.breath_curve) 
          ? wsData.breath_curve 
          : [wsData.breath_curve || 0];
          
        // 调试信息：检查数据接收情况
        console.log(`呼吸数据更新: 接收${newValues.length}个新数据点, 当前队列${prev.length}个点`);
        if (newValues.length > 50) {
          console.warn(`警告: 单次接收呼吸数据点过多(${newValues.length}个)，可能不是增量数据！`);
        }
        
        const newData = [...prev, ...newValues];  // 展开数组
        const finalData = newData.slice(-getWaveformDataPointsCount()); // 保持200个数据点（8秒*25点/秒）
        
        console.log(`呼吸数据处理: ${prev.length} -> ${newData.length} -> ${finalData.length}`);
        return finalData;
      });
      
      // 更新趋势数据 - 每秒一个数据点，保持8个数据点
      setHeartTrendData(prev => {
        const newData = [...prev, heartRate];
        return newData.slice(-getTrendDataPointsCount()); // 保持8个数据点（8秒*1点/秒）
      });

      setRespTrendData(prev => {
        const newData = [...prev, respRate];
        return newData.slice(-getTrendDataPointsCount()); // 保持8个数据点（8秒*1点/秒）
      });

      // 生成警报
      if (vitalStatus.status !== '正常' || breathing === '弱呼吸' || breathing === '呼吸异常' || bedStatus === '离床') {
        setAlerts(prev => {
          const newAlert = {
            id: Date.now(),
            type: vitalStatus.status,
            message: `状态: 心率 ${heartRate}, 呼吸率 ${respRate}, ${bedStatus}, ${breathing}`,
            time: now
          };
          return [newAlert, ...prev.slice(0, 4)];
        });
      }
    }
  }, []);

  // WebSocket连接函数 - 修复版，防止多重连接，添加心跳机制
  const connectWebSocket = useCallback(async () => {
    // 使用连接锁防止重复调用
    if (connectionLockRef.current) {
      console.log('连接操作正在进行中，跳过重复连接');
      return;
    }
    
    connectionLockRef.current = true;
    
    try {
      // 更严格的连接状态检查
      if (wsRef.current) {
        const currentState = wsRef.current.readyState;
        if (currentState === WebSocket.OPEN) {
          console.log('WebSocket已连接，跳过重复连接');
          return;
        } else if (currentState === WebSocket.CONNECTING) {
          console.log('WebSocket正在连接，等待连接完成');
          // 等待当前连接完成，而不是创建新连接
          return;
        } else {
          // 彻底清理旧连接
          console.log(`清理旧连接，状态: ${currentState}`);
          try {
            wsRef.current.onopen = null;
            wsRef.current.onmessage = null;
            wsRef.current.onerror = null;
            wsRef.current.onclose = null;
            wsRef.current.close();
          } catch (e) {
            console.warn('清理旧连接时出错:', e);
          }
          wsRef.current = null;
        }
      }

      setWsStatus('connecting');
      setWsError(null);
      
      console.log(`创建新的WebSocket连接: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      
      // 设置连接超时
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.log('连接超时，关闭连接');
          ws.close();
          setWsError('连接超时');
          setWsStatus('error');
        }
      }, 10000); // 10秒超时

      // ⭐ 心跳定时器引用
      let heartbeatInterval = null;

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket连接已建立');
        setWsStatus('connected');
        setReconnectAttempts(0);
        wsRef.current = ws;
        
        // ⭐ 启动心跳机制 - 每60秒发送一次心跳
        heartbeatInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const heartbeat = {
              type: "heartbeat",
              client_id: `dashboard_${Date.now()}`,
              timestamp: Date.now()
            };
            console.log('发送心跳');
            ws.send(JSON.stringify(heartbeat));
          }
        }, 60000); // 60秒发送一次心跳
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('收到WebSocket消息:', data);
          
          if (data.type === 'welcome') {
            console.log(`收到欢迎消息: ${data.message} (客户端ID: ${data.clientId})`);
            const subscribeMsg = {
              type: "subscribe",
              device_id: deviceId,
              client_id: `dashboard_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              client_type: "medical_dashboard"
            };
            console.log('发送订阅消息:', subscribeMsg);
            ws.send(JSON.stringify(subscribeMsg));
          } else if (data.type === 'subscribed') {
            console.log(`订阅成功，设备ID: ${data.device_id}`);
          } else if (data.type === 'realtime_data') {
            processWebSocketData(data);
          } else if (data.type === 'heartbeat_response' || data.type === 'pong') {
            console.log('收到心跳响应');
          }
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
        }
      };

      ws.onerror = (error) => {
        // ⭐ 清理心跳定时器
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
          console.log('心跳定时器已清理（错误）');
        }
        
        clearTimeout(connectionTimeout);
        console.error('WebSocket错误:', error);
        setWsError('连接错误');
        setWsStatus('error');
      };

      ws.onclose = (event) => {
        // ⭐ 清理心跳定时器
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
          console.log('心跳定时器已清理（关闭）');
        }
        
        clearTimeout(connectionTimeout);
        console.log('WebSocket连接已关闭:', event.code, event.reason);
        setWsStatus('disconnected');
        
        // 只有当前连接是活跃连接时才置空引用
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
        
        // 如果不是手动关闭且监控开启，尝试重连
        if (isMonitoring && reconnectAttempts < maxReconnectAttempts && event.code !== 1000) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`${delay}ms后尝试重连... (第${reconnectAttempts + 1}次)`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectWebSocket();
          }, delay);
        }
      };

    } catch (error) {
      console.error('连接WebSocket失败:', error);
      setWsError('连接失败');
      setWsStatus('error');
    } finally {
      // 延迟释放连接锁，防止快速重复调用
      setTimeout(() => {
        connectionLockRef.current = false;
      }, 1000);
    }
  }, [wsUrl, deviceId, isMonitoring, reconnectAttempts, processWebSocketData]);

  // 断开WebSocket连接 - 修复版
  const disconnectWebSocket = useCallback(() => {
    console.log('主动断开WebSocket连接');
    
    // 设置连接锁，防止在断开过程中重连
    connectionLockRef.current = true;
    
    // 清理重连定时器
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // 清理延迟清理定时器
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
    
    // 关闭WebSocket连接
    if (wsRef.current) {
      const currentState = wsRef.current.readyState;
      console.log(`断开连接，当前状态: ${currentState}`);
      
      try {
        // 移除所有事件监听器
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        
        // 主动关闭连接
        if (currentState === WebSocket.OPEN || currentState === WebSocket.CONNECTING) {
          wsRef.current.close(1000, '客户端主动断开');
        }
      } catch (error) {
        console.error('关闭连接时出错:', error);
      }
      
      wsRef.current = null;
    }
    
    setWsStatus('disconnected');
    setReconnectAttempts(0);
    
    // 延迟释放连接锁
    cleanupTimeoutRef.current = setTimeout(() => {
      connectionLockRef.current = false;
    }, 2000);
  }, []);

  // 修复后的监控控制 useEffect - 简化依赖数组
  useEffect(() => {
    if (isMonitoring) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    // 页面卸载时清理连接
    const handleBeforeUnload = () => {
      console.log('页面即将卸载，清理WebSocket连接');
      connectionLockRef.current = true; // 防止重连
      if (wsRef.current) {
        wsRef.current.close(1000, '页面卸载');
      }
    };

    // 修复后的页面可见性处理 - 移除自动重连逻辑
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('页面已隐藏');
        // 不主动断开连接，让服务端心跳处理超时
      } else {
        console.log('页面重新可见');
        // 只在连接确实断开且监控开启时才重连
        if (isMonitoring && 
            (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
          console.log('页面重新可见，检测到连接已断开，准备重连');
          // 重置重连尝试次数
          setReconnectAttempts(0);
          // 延迟重连，避免频繁切换
          setTimeout(() => {
            if (isMonitoring && !connectionLockRef.current) {
              connectWebSocket();
            }
          }, 2000);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      disconnectWebSocket();
    };
  }, [isMonitoring]); // 只依赖 isMonitoring，移除函数依赖

  // 检测父页面主题
  useEffect(() => {
    const detectParentTheme = () => {
      // 检测多种主题指标
      const body = document.body;
      const html = document.documentElement;
      
      // 检查背景色
      const bodyBg = window.getComputedStyle(body).backgroundColor;
      const htmlBg = window.getComputedStyle(html).backgroundColor;
      
      // 检查是否有主题类名
      const isDarkClass = body.classList.contains('dark') || 
                         html.classList.contains('dark') ||
                         body.classList.contains('dark-theme') ||
                         html.classList.contains('dark-theme');
      
      const isLightClass = body.classList.contains('light') || 
                          html.classList.contains('light') ||
                          body.classList.contains('light-theme') ||
                          html.classList.contains('light-theme');
      
      // 解析背景色RGB值来判断主题
      const getBrightness = (rgb) => {
        if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return null;
        const match = rgb.match(/\d+/g);
        if (!match) return null;
        const [r, g, b] = match.map(Number);
        return (r * 299 + g * 587 + b * 114) / 1000; // 亮度计算公式
      };
      
      const bodyBrightness = getBrightness(bodyBg);
      const htmlBrightness = getBrightness(htmlBg);
      
      // 判断主题
      if (isDarkClass) {
        setParentTheme('dark');
      } else if (isLightClass) {
        setParentTheme('light');  
      } else if (bodyBrightness !== null && bodyBrightness > 128) {
        setParentTheme('light');
      } else if (htmlBrightness !== null && htmlBrightness > 128) {
        setParentTheme('light');
      } else if (bodyBrightness !== null && bodyBrightness <= 128) {
        setParentTheme('dark');
      } else if (htmlBrightness !== null && htmlBrightness <= 128) {
        setParentTheme('dark');
      } else {
        // 默认判断为浅色主题（Chainlit通常是白色）
        setParentTheme('light');
      }
    };

    detectParentTheme();
    
    // 监听主题变化
    const observer = new MutationObserver(detectParentTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // 时间更新
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 全屏状态监听和键盘快捷键
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement || 
                               document.mozFullScreenElement || 
                               document.webkitFullscreenElement || 
                               document.msFullscreenElement;
      
      setIsFullscreen(!!fullscreenElement);
    };

    const handleKeyDown = (event) => {
      // ESC键退出全屏
      if (event.key === 'Escape' && isFullscreen) {
        // 直接调用退出全屏，避免函数引用
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
      // F11键切换全屏
      if (event.key === 'F11') {
        event.preventDefault();
        // 直接内联全屏逻辑
        if (isFullscreen) {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          }
        } else {
          if (containerRef.current) {
            if (containerRef.current.requestFullscreen) {
              containerRef.current.requestFullscreen();
            } else if (containerRef.current.mozRequestFullScreen) {
              containerRef.current.mozRequestFullScreen();
            } else if (containerRef.current.webkitRequestFullscreen) {
              containerRef.current.webkitRequestFullscreen();
            } else if (containerRef.current.msRequestFullscreen) {
              containerRef.current.msRequestFullscreen();
            }
          }
        }
      }
    };

    // 添加事件监听器
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    // 清理事件监听器
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]); // 只依赖isFullscreen状态

  // 纯CSS波形图组件
  const WaveformChart = ({ data, color, height = "200px", title }) => {
    if (!data || data.length === 0) {
      return (
        <div className={`w-full ${themeClasses.chart} rounded border p-3 shadow-lg relative`} style={{ height }}>
          <div className={`text-sm font-medium mb-2 ${themeClasses.textPrimary}`}>{title}</div>
          <div className={`${themeClasses.textMuted} text-xs flex items-center justify-center h-full`}>等待数据...</div>
        </div>
      );
    }

    const points = data.map((value, index) => {
      // 将-32768到32767映射到90到10（保留上下10%边距）
      const normalizedValue = (value + 35000) / 70000; // 0-1
      const yPos = 90 - (normalizedValue * 80); // 映射到90-10范围
      return `${(index / (data.length - 1)) * 100},${yPos}`;
    }).join(' ');

    // 生成基于时间戳的时间标签
    const timeLabels = generateTimeLabels(currentTimestamp);

    return (
      <div className={`w-full ${themeClasses.chart} rounded border p-3 shadow-lg relative`} style={{ height }}>
        <div className={`text-sm font-medium mb-2 ${themeClasses.textPrimary}`}>{title}</div>
        
        {/* 图表容器 */}
        <div className="ml-6 mr-2 relative" style={{ height: 'calc(100% - 4rem)' }}>
          {/* Y轴刻度标签 - 精确对应SVG位置 */}
          <div className="absolute -left-6 inset-y-0 flex flex-col justify-between pointer-events-none z-10 py-0">
            {[35000, 17500, 0, -17500, -35000].map((value, index) => {
              // 精确计算Y轴标签位置，对应SVG中的10%, 30%, 50%, 70%, 90%
              const yPercent = 10 + (index * 20); // 10, 30, 50, 70, 90
              return (
                <div 
                  key={value}
                  className={`text-xs ${themeClasses.textMuted} absolute`}
                  style={{ 
                    fontSize: '10px', 
                    lineHeight: '10px',
                    top: `${yPercent}%`,
                    transform: 'translateY(-50%)'
                  }}
                >
                  {value === 0 ? '0' : value === 17500 ? '17.5k' : value === -17500 ? '-17.5k' : `${Math.round(value/1000)}k`}
                </div>
              );
            })}
          </div>

          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* 网格线 */}
            <defs>
              <pattern id={`grid-${title}`} width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke={parentTheme === 'light' ? 'rgba(100, 116, 139, 0.3)' : 'rgba(100, 116, 139, 0.3)'} strokeWidth="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${title})`} />

            {/* 波形线 */}
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="0.1"
              points={points}
              className="animate-pulse"
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))' }}
            />
            
            {/* 渐变填充 */}
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.4 }} />
                <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.05 }} />
              </linearGradient>
            </defs>
            <polygon
              fill={`url(#gradient-${title})`}
              points={`0,100 ${points} 100,100`}
            />
          </svg>
          
          {/* X轴刻度标签 - 基于实际时间戳，每2秒间隔 */}
          <div className={`flex justify-between mt-1 text-xs ${themeClasses.textMuted}`}>
            {timeLabels.map((label, index) => (
              <span key={index} style={{ fontSize: '9px' }}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 趋势图组件
  const TrendChart = ({ data, color, height = "200px", title, fixedMin, fixedMax }) => {
    if (!data || data.length === 0) {
      return (
        <div className={`w-full ${themeClasses.chart} rounded border p-3 shadow-lg relative`} style={{ height }}>
          <div className={`text-sm font-medium mb-2 ${themeClasses.textPrimary}`}>{title}</div>
          <div className={`${themeClasses.textMuted} text-xs flex items-center justify-center h-full`}>等待数据...</div>
        </div>
      );
    }
    
    // 允许0值，因为0可能是有效的测量值
    const values = data.filter(v => v !== undefined);
    if (values.length === 0) {
      return (
        <div className={`w-full ${themeClasses.chart} rounded border p-3 shadow-lg relative`} style={{ height }}>
          <div className={`text-sm font-medium mb-2 ${themeClasses.textPrimary}`}>{title}</div>
          <div className={`${themeClasses.textMuted} text-xs flex items-center justify-center h-full`}>等待数据...</div>
        </div>
      );
    }
    
    // 使用固定范围或自动计算范围
    let min, max, range;
    if (fixedMin !== undefined && fixedMax !== undefined) {
      min = fixedMin;
      max = fixedMax;
      range = max - min;
    } else {
      min = Math.min(...values);
      max = Math.max(...values);
      range = max - min || 1;
    }

    const points = values.map((value, index) => 
      `${(index / (values.length - 1)) * 100},${100 - ((value - min) / range) * 100}`
    ).join(' ');

    // 生成Y轴刻度标签 - 从上到下
    const yLabels = [max, Math.round(max * 0.75), Math.round(max * 0.5), Math.round(max * 0.25), min];

    // 生成基于时间戳的时间标签
    const timeLabels = generateTimeLabels(currentTimestamp);

    return (
      <div className={`w-full ${themeClasses.chart} rounded border p-3 shadow-lg relative`} style={{ height }}>
        <div className={`text-sm font-medium mb-2 ${themeClasses.textPrimary}`}>
          {title} 
          <span className={`${themeClasses.textMuted} text-xs ml-2`}>
            (当前: {values[values.length - 1]}, 范围: {min}-{max})
          </span>
        </div>
        
        {/* 图表容器 */}
        <div className="ml-6 mr-2 relative" style={{ height: 'calc(100% - 4rem)' }}>
          {/* Y轴刻度标签 - 精确对应SVG位置 */}
          <div className="absolute -left-6 inset-y-0 flex flex-col justify-between pointer-events-none z-10 py-0">
            {yLabels.map((value, index) => {
              // 精确计算Y轴标签位置，对应SVG中的0%, 25%, 50%, 75%, 100%
              const yPercent = index * 25; // 0, 25, 50, 75, 100
              return (
                <div 
                  key={index}
                  className={`text-xs ${themeClasses.textMuted} absolute`}
                  style={{ 
                    fontSize: '10px', 
                    lineHeight: '10px',
                    top: `${yPercent}%`,
                    transform: 'translateY(-50%)'
                  }}
                >
                  {value}
                </div>
              );
            })}
          </div>

          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* 网格线 */}
            <defs>
              <pattern id={`trendGrid-${title}`} width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke={parentTheme === 'light' ? 'rgba(156, 163, 175, 0.4)' : 'rgba(156, 163, 175, 0.3)'} strokeWidth="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#trendGrid-${title})`} />
            
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="0.1"
              points={points}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.2))' }}
            />
            {values.map((value, index) => (
              <circle
                key={index}
                cx={(index / (values.length - 1)) * 100}
                cy={100 - ((value - min) / range) * 100}
                r="1.0"
                fill={color}
              />
            ))}
          </svg>
          
          {/* X轴刻度标签 - 基于实际时间戳，每2秒间隔 */}
          <div className={`flex justify-between mt-1 text-xs ${themeClasses.textMuted}`}>
            {timeLabels.map((label, index) => (
              <span key={index} style={{ fontSize: '9px' }}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 处理按钮点击事件
  const handlePause = () => setIsMonitoring(!isMonitoring);
  const handlePrint = () => {
    console.log('查看报告');
    // 获取 device_type，如果没有则使用默认值
    const deviceType = props?.device_type || '医疗监护设备';
    
    // 使用 Chainlit 提供的 sendUserMessage API
    if (typeof sendUserMessage === 'function') {
      sendUserMessage(`查看报告：${deviceType}`);
    }
  };
  const handleExport = () => console.log('导出数据');
  const handleSettings = () => setShowSettings(!showSettings);
  const handleReconnect = () => {
    setReconnectAttempts(0);
    connectWebSocket();
  };

  // 全屏功能 - 简化版本，避免循环依赖
  const enterFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      } else if (containerRef.current.mozRequestFullScreen) {
        await containerRef.current.mozRequestFullScreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        await containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        await containerRef.current.msRequestFullscreen();
      }
    } catch (error) {
      console.error('进入全屏失败:', error);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (error) {
      console.error('退出全屏失败:', error);
    }
  }, []);

  // 直接在事件处理器中处理逻辑，避免useCallback依赖问题
  const handleFullscreenToggle = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  // 获取连接状态图标
  const getConnectionIcon = () => {
    switch (wsStatus) {
      case 'connected':
        return <Wifi className="h-3 w-3 text-green-400" />;
      case 'connecting':
        return <RefreshCw className="h-3 w-3 text-yellow-400 animate-spin" />;
      case 'error':
      case 'disconnected':
      default:
        return <WifiOff className="h-3 w-3 text-red-400" />;
    }
  };

  const getConnectionText = () => {
    switch (wsStatus) {
      case 'connected':
        return '已连接';
      case 'connecting':
        return '连接中...';
      case 'error':
        return `连接错误${wsError ? `: ${wsError}` : ''}`;
      case 'disconnected':
      default:
        return '未连接';
    }
  };

  // 全屏样式处理 - 根据检测到的主题适配
  useEffect(() => {
    if (isFullscreen) {
      // 根据检测到的主题选择颜色
      const themeColors = parentTheme === 'light' ? {
        background: 'rgb(255, 255, 255)', // 白色背景
        cardBg: 'rgb(249, 250, 251)', // 浅灰卡片背景
        borderColor: 'rgb(229, 231, 235)', // 浅灰边框
        textPrimary: 'rgb(17, 24, 39)', // 深色文字
        textSecondary: 'rgb(75, 85, 99)' // 次要文字颜色
      } : {
        background: 'rgb(17, 24, 39)', // 深色背景
        cardBg: 'rgb(55, 65, 81)', // 深灰卡片背景
        borderColor: 'rgb(75, 85, 99)', // 深灰边框
        textPrimary: 'rgb(229, 231, 235)', // 浅色文字
        textSecondary: 'rgb(156, 163, 175)' // 次要文字颜色
      };

      // 添加全屏样式
      const style = document.createElement('style');
      style.textContent = `
        :fullscreen, :-webkit-full-screen, :-moz-full-screen, :-ms-fullscreen {
          background-color: ${themeColors.background} !important;
        }
        ::backdrop, ::-webkit-full-screen::backdrop {
          background-color: ${themeColors.background} !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        // 清理样式
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      };
    }
  }, [isFullscreen, parentTheme]);

  // 获取主题相关的样式类
  const getThemeClasses = () => {
    if (parentTheme === 'light') {
      return {
        container: 'bg-white text-gray-900',
        header: 'bg-gray-50 border-gray-200',
        card: 'bg-gray-50 border-gray-200',
        alert: 'bg-red-50 border-red-200',
        chart: 'bg-gray-100 border-gray-300',
        control: 'bg-gray-50 border-gray-200',
        debug: 'bg-gray-100 border-gray-300',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-600',
        textMuted: 'text-gray-400'
      };
    } else {
      return {
        container: 'bg-gray-900 text-gray-200',
        header: 'bg-gray-700 border-gray-600',
        card: 'bg-gray-700 border-gray-600',
        alert: 'bg-red-900/50 border-red-500',
        chart: 'bg-gray-800 border-gray-600',
        control: 'bg-gray-700 border-gray-600',
        debug: 'bg-gray-800 border-gray-500',
        textPrimary: 'text-gray-200',
        textSecondary: 'text-gray-300',
        textMuted: 'text-gray-400'
      };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div 
      ref={containerRef}
      className={`w-full ${themeClasses.container} overflow-hidden ${
        isFullscreen 
          ? 'fixed inset-0 z-50 p-4' 
          : 'p-3'
      }`}
      style={isFullscreen ? { 
        backgroundColor: parentTheme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
        minHeight: '100vh',
        minWidth: '100vw'
      } : {}}
    >
      {/* 全屏提示 */}
      {isFullscreen && (
        <div className={`absolute top-4 right-4 z-10 ${themeClasses.debug} rounded-lg p-2 text-xs ${themeClasses.textSecondary}`}>
          按 ESC 或 F11 退出全屏，当前主题: {parentTheme === 'light' ? '浅色' : '深色'}
        </div>
      )}
      {/* 顶部信息栏 */}
      <div className={`flex justify-between items-center mb-3 ${themeClasses.header} rounded-lg p-3 border shadow-lg`}>
        <div className="flex items-center gap-4">
          <div>
            <h1 className={`text-sm font-bold ${themeClasses.textPrimary}`}>
              用户: {patientInfo.name} (ID: {patientInfo.id})
            </h1>
            <p className={`${themeClasses.textSecondary} text-xs`}>
              {patientInfo.room} | 主治医师: {patientInfo.doctor}
            </p>
            <p className={`${themeClasses.textMuted} text-xs`}>
              设备ID: {deviceId}
            </p>
          </div>
        </div>
        
        <div className="text-center">
          <div className={`text-sm font-mono ${themeClasses.textPrimary}`}>
            {currentTime.toLocaleString()}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {getConnectionIcon()}
            <span className={`text-xs ${themeClasses.textPrimary}`}>{getConnectionText()}</span>
            {wsStatus === 'error' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReconnect}
                className="bg-red-600 hover:bg-red-700 text-gray-100 text-xs px-1 py-0 ml-1"
              >
                重连
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 警报区域 */}
      {alerts.length > 0 && (
        <div className={`mb-3 ${themeClasses.alert} border rounded-lg p-2`}>
          <div className={`flex items-center gap-2 ${parentTheme === 'light' ? 'text-red-600' : 'text-red-400'} font-semibold text-xs`}>
            <AlertTriangle className="h-3 w-3" />
            最新警报: {alerts[0].message} - {alerts[0].time.toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* 主要内容区域 - 3行布局 */}
      <div className="space-y-3">
        
        {/* 第一行：心率、呼吸率、实时状态 */}
        <div className="flex gap-2">
          {/* 心率卡片 */}
          <div className={`flex-1 ${themeClasses.card} border rounded-lg p-2 shadow-lg`}>
            <div className="flex items-center gap-1 mb-1">
              <Heart className="h-3 w-3 text-red-500" />
              <h3 className={`text-xs font-semibold ${themeClasses.textPrimary}`}>心率</h3>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500 font-mono">
                {vitals.heartRate !== undefined ? vitals.heartRate : '--'}
              </div>
              <div className={`text-xs ${themeClasses.textMuted}`}>bpm</div>
              <Badge 
                className={`text-xs px-1 py-0 mt-1 ${vitals.heartRate >= 60 && vitals.heartRate <= 90 
                  ? 'bg-green-600 text-gray-100' 
                  : vitals.heartRate === 0 
                  ? 'bg-orange-600 text-gray-100'
                  : 'bg-red-600 text-gray-100'
                }`}
              >
                {vitals.heartRate === 0 ? '无信号' : vitals.heartRate >= 60 && vitals.heartRate <= 90 ? '正常' : '异常'}
              </Badge>
            </div>
          </div>

          {/* 呼吸率卡片 */}
          <div className={`flex-1 ${themeClasses.card} border rounded-lg p-2 shadow-lg`}>
            <div className="flex items-center gap-1 mb-1">
              <Wind className="h-3 w-3 text-blue-500" />
              <h3 className={`text-xs font-semibold ${themeClasses.textPrimary}`}>呼吸率</h3>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500 font-mono">
                {vitals.respRate !== undefined ? vitals.respRate : '--'}
              </div>
              <div className={`text-xs ${themeClasses.textMuted}`}>次/分</div>
              <Badge 
                className={`text-xs px-1 py-0 mt-1 ${vitals.respRate >= 12 && vitals.respRate <= 20 
                  ? 'bg-green-600 text-gray-100' 
                  : vitals.respRate === 0
                  ? 'bg-orange-600 text-gray-100'
                  : 'bg-red-600 text-gray-100'
                }`}
              >
                {vitals.respRate === 0 ? '无信号' : vitals.respRate >= 12 && vitals.respRate <= 20 ? '正常' : '异常'}
              </Badge>
            </div>
          </div>

          {/* 实时状态卡片 */}
          <div className={`flex-1 ${themeClasses.card} border rounded-lg p-2 shadow-lg`}>
            <div className="flex items-center gap-1 mb-1">
              <Activity className="h-3 w-3 text-purple-500" />
              <h3 className={`text-xs font-semibold ${themeClasses.textPrimary}`}>实时状态</h3>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Zap className="h-2 w-2 text-yellow-400" />
                <Badge 
                  className={`text-xs px-1 py-0 ${
                    realTimeStatus.movement === '无体动' 
                      ? 'bg-green-600' 
                      : realTimeStatus.movement === '轻微体动'
                      ? 'bg-yellow-600'
                      : realTimeStatus.movement === '体动'
                      ? 'bg-orange-600'
                      : realTimeStatus.movement === '重物'
                      ? 'bg-red-600'
                      : 'bg-gray-600'
                  } text-gray-100`}
                >
                  {realTimeStatus.movement}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Bed className="h-2 w-2 text-blue-400" />
                <Badge 
                  className={`text-xs px-1 py-0 ${realTimeStatus.bedStatus === '在床' 
                    ? 'bg-green-600' 
                    : realTimeStatus.bedStatus === '离床'
                    ? 'bg-red-600'
                    : 'bg-gray-600'
                  } text-gray-100`}
                >
                  {realTimeStatus.bedStatus}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="h-2 w-2 text-green-400" />
                <Badge 
                  className={`text-xs px-1 py-0 ${
                    realTimeStatus.breathing === '正常' 
                      ? 'bg-green-600' 
                      : realTimeStatus.breathing === '弱呼吸'
                      ? 'bg-yellow-600'
                      : realTimeStatus.breathing === '打鼾'
                      ? 'bg-blue-600'
                      : realTimeStatus.breathing === '呼吸异常'
                      ? 'bg-red-600'
                      : 'bg-gray-600'
                  } text-gray-100`}
                >
                  {realTimeStatus.breathing}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* 第二行：实时心电图波形和心率趋势 */}
        <div className={`grid grid-cols-2 gap-3 ${isFullscreen ? 'h-64' : ''}`}>
          <WaveformChart 
            data={ecgData} 
            color="#4ade80" 
            height={isFullscreen ? "250px" : "200px"}
            title="实时心电图波形"
          />
          <TrendChart 
            data={heartTrendData} 
            color="#ef4444" 
            height={isFullscreen ? "250px" : "200px"}
            title="实时心率"
            fixedMin={0}
            fixedMax={120}
          />
        </div>

        {/* 第三行：实时呼吸波形和呼吸率趋势 */}
        <div className={`grid grid-cols-2 gap-3 ${isFullscreen ? 'h-64' : ''}`}>
          <WaveformChart 
            data={respData} 
            color="#60a5fa" 
            height={isFullscreen ? "250px" : "200px"}
            title="实时呼吸波形"
          />
          <TrendChart 
            data={respTrendData} 
            color="#3b82f6" 
            height={isFullscreen ? "250px" : "200px"}
            title="实时呼吸率"
            fixedMin={0}  // 新增固定范围
            fixedMax={40}
          />
        </div>
      </div>

      {/* 底部控制栏 */}
      <div className="mt-3 bg-gray-700 rounded-lg p-2 border border-gray-600 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-300">
            最后更新: {vitals.lastUpdate.toLocaleString()}
          </div>
          <div className="flex gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePause}
              className="bg-blue-600 hover:bg-blue-700 text-gray-100 text-xs px-2 py-1"
            >
              {isMonitoring ? <Pause className="h-3 w-3 mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              {isMonitoring ? '暂停' : '开始'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleFullscreenToggle}
              className="bg-purple-600 hover:bg-purple-700 text-gray-100 text-xs px-2 py-1"
            >
              {isFullscreen ? <Minimize className="h-3 w-3 mr-1" /> : <Maximize className="h-3 w-3 mr-1" />}
              {isFullscreen ? '退出' : '全屏'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              className="bg-gray-600 hover:bg-gray-500 text-gray-100 text-xs px-2 py-1"
            >
              <Printer className="h-3 w-3 mr-1" />
              报告
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              className="bg-gray-600 hover:bg-gray-500 text-gray-100 text-xs px-2 py-1"
            >
              <Download className="h-3 w-3 mr-1" />
              导出
            </Button>
          </div>
        </div>
      </div>

      {/* 调试信息面板（开发时可以显示） */}
      {rawData && (
        <div className="mt-3 bg-gray-800 rounded-lg p-2 border border-gray-500 text-xs">
          <div className="text-gray-300 font-semibold mb-1">调试信息:</div>
          <div className="text-gray-400 font-mono text-xs overflow-auto max-h-20">
            <div>设备ID: {rawData?.data?.device_id}</div>
            <div>时间戳: {rawData?.data?.timestamp} ({formatTimestampToShanghai(rawData?.data?.timestamp)})</div>
            <div>心率BPM: {rawData?.data?.heart_bmp}</div>
            <div>呼吸BPM: {rawData?.data?.breath_bpm || rawData?.data?.breath_bmp}</div>
            <div>心率曲线: {Array.isArray(rawData?.data?.heart_curve) ? `[${rawData.data.heart_curve.slice(0,3).join(', ')}...]` : rawData?.data?.heart_curve?.toFixed(4)}</div>
            <div>呼吸曲线: {Array.isArray(rawData?.data?.breath_curve) ? `[${rawData.data.breath_curve.slice(0,3).join(', ')}...]` : rawData?.data?.breath_curve?.toFixed(4)}</div>
            <div>Valid Bit ID: {rawData?.data?.valid_bit_id}</div>
            <div>信号强度: {rawData?.data?.signal_strength}</div>
            <div>客户端ID: {rawData?.clientId || 'N/A'}</div>
          </div>
        </div>
      )}
    </div>
  );
}