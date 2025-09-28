import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Wind, Activity, RefreshCw, AlertTriangle, Settings, Download, Printer, Pause, Bed, User, Zap } from "lucide-react"
import { useState, useEffect, useCallback } from "react"

export default function CompactMedicalDashboard() {
  // 状态管理
  const [currentTime, setCurrentTime] = useState(new Date());
  const [vitals, setVitals] = useState({
    heartRate: 75,
    respRate: 16,
    status: '正常',
    lastUpdate: new Date()
  });
  const [realTimeStatus, setRealTimeStatus] = useState({
    movement: '无体动', // 体动、无体动
    bedStatus: '在床',   // 在床、离床
    breathing: '正常',   // 正常、呼吸异常
    lastUpdate: new Date()
  });
  const [ecgData, setEcgData] = useState([]);
  const [respData, setRespData] = useState([]);
  const [heartTrendData, setHeartTrendData] = useState([]);
  const [respTrendData, setRespTrendData] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [alerts, setAlerts] = useState([]);

  // 患者信息
  const patientInfo = {
    name: '张伟',
    id: 'P202309001',
    room: 'ICU-3床',
    doctor: '李华医生'
  };

  // 生成模拟ECG数据
  const generateECGData = useCallback(() => {
    const data = [];
    for (let i = 0; i < 150; i++) {
      const t = i / 15;
      const value = 50 + 40 * (0.7 * Math.sin(t * 5) + 
                   0.3 * Math.sin(t * 20) + 
                   0.1 * Math.sin(t * 60) +
                   (Math.random() - 0.5) * 0.3);
      data.push(Math.max(10, Math.min(90, value)));
    }
    return data;
  }, []);

  // 生成模拟呼吸数据
  const generateRespData = useCallback(() => {
    const data = [];
    for (let i = 0; i < 150; i++) {
      const t = i / 30;
      const value = 50 + 30 * (Math.sin(t) + (Math.random() - 0.5) * 0.2);
      data.push(Math.max(20, Math.min(80, value)));
    }
    return data;
  }, []);

  // 获取生命体征状态颜色
  const getVitalStatus = (heartRate, respRate) => {
    const hrNormal = heartRate >= 60 && heartRate <= 90;
    const rrNormal = respRate >= 12 && respRate <= 20;
    
    if (hrNormal && rrNormal) return { status: '正常', color: 'green' };
    if (!hrNormal || !rrNormal) return { status: '警告', color: 'yellow' };
    return { status: '异常', color: 'red' };
  };

  // 获取实时状态
  const generateRealTimeStatus = () => {
    const movements = ['无体动', '轻微体动', '体动'];
    const bedStates = ['在床', '离床'];
    const breathingStates = ['正常', '呼吸异常'];
    
    return {
      movement: movements[Math.floor(Math.random() * movements.length)],
      bedStatus: bedStates[Math.floor(Math.random() * bedStates.length)],
      breathing: breathingStates[Math.floor(Math.random() * breathingStates.length)],
      lastUpdate: new Date()
    };
  };

  // 纯CSS波形图组件
  const WaveformChart = ({ data, color, height = "200px", title }) => {
    const points = data.map((value, index) => 
      `${(index / (data.length - 1)) * 100},${100 - value}`
    ).join(' ');

    return (
      <div className="w-full bg-gray-800 rounded border border-gray-600 p-3 shadow-lg" style={{ height }}>
        <div className="text-sm font-medium mb-2 text-gray-200">{title}</div>
        <svg width="100%" height="calc(100% - 2rem)" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* 网格线 */}
          <defs>
            <pattern id={`grid-${title}`} width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(100, 116, 139, 0.3)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${title})`} />
          
          {/* 波形线 */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            points={points}
            className="animate-pulse"
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
      </div>
    );
  };

  // 趋势图组件
  const TrendChart = ({ data, color, height = "200px", title }) => {
    if (!data || data.length === 0) {
      return (
        <div className="w-full bg-gray-800 rounded border border-gray-600 p-3 shadow-lg" style={{ height }}>
          <div className="text-sm font-medium mb-2 text-gray-200">{title}</div>
          <div className="text-gray-400 text-xs flex items-center justify-center h-full">暂无数据</div>
        </div>
      );
    }
    
    const values = data.filter(v => v !== undefined);
    if (values.length === 0) {
      return (
        <div className="w-full bg-gray-800 rounded border border-gray-600 p-3 shadow-lg" style={{ height }}>
          <div className="text-sm font-medium mb-2 text-gray-200">{title}</div>
          <div className="text-gray-400 text-xs flex items-center justify-center h-full">暂无数据</div>
        </div>
      );
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values.map((value, index) => 
      `${(index / (values.length - 1)) * 100},${100 - ((value - min) / range) * 100}`
    ).join(' ');

    return (
      <div className="w-full bg-gray-800 rounded border border-gray-600 p-3 shadow-lg" style={{ height }}>
        <div className="text-sm font-medium mb-2 text-gray-200">{title}</div>
        <svg width="100%" height="calc(100% - 2rem)" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* 网格线 */}
          <defs>
            <pattern id={`trendGrid-${title}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(156, 163, 175, 0.3)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#trendGrid-${title})`} />
          
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={points}
          />
          {values.map((value, index) => (
            <circle
              key={index}
              cx={(index / (values.length - 1)) * 100}
              cy={100 - ((value - min) / range) * 100}
              r="1.5"
              fill={color}
            />
          ))}
        </svg>
      </div>
    );
  };

  // 主要数据更新逻辑
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const newTime = new Date();
      setCurrentTime(newTime);
      
      // 生成新的生命体征数据
      const newHeartRate = 65 + Math.floor(Math.random() * 25); // 65-90
      const newRespRate = 12 + Math.floor(Math.random() * 8);   // 12-20
      const vitalStatus = getVitalStatus(newHeartRate, newRespRate);
      
      setVitals({
        heartRate: newHeartRate,
        respRate: newRespRate,
        status: vitalStatus.status,
        lastUpdate: newTime
      });

      // 更新实时状态
      if (Math.random() < 0.3) { // 30%概率更新状态
        setRealTimeStatus(generateRealTimeStatus());
      }

      // 更新波形数据
      setEcgData(generateECGData());
      setRespData(generateRespData());
      
      // 更新心率趋势数据
      setHeartTrendData(prev => {
        const newData = [...prev, newHeartRate];
        return newData.slice(-20); // 保留最近20个点
      });

      // 更新呼吸率趋势数据
      setRespTrendData(prev => {
        const newData = [...prev, newRespRate];
        return newData.slice(-20); // 保留最近20个点
      });

      // 生成警报
      if (vitalStatus.status !== '正常' || realTimeStatus.breathing === '呼吸异常' || realTimeStatus.bedStatus === '离床') {
        setAlerts(prev => {
          const newAlert = {
            id: Date.now(),
            type: vitalStatus.status,
            message: `异常状态: 心率 ${newHeartRate}, 呼吸率 ${newRespRate}, ${realTimeStatus.bedStatus}, ${realTimeStatus.breathing}`,
            time: newTime
          };
          return [newAlert, ...prev.slice(0, 4)]; // 保留最近5条警报
        });
      }
    }, 2000); // 每2秒更新一次

    return () => clearInterval(interval);
  }, [isMonitoring, generateECGData, generateRespData, realTimeStatus.breathing, realTimeStatus.bedStatus]);

  // 处理按钮点击事件
  const handlePause = () => setIsMonitoring(!isMonitoring);
  const handlePrint = () => console.log('打印报告');
  const handleExport = () => console.log('导出数据');
  const handleSettings = () => console.log('系统设置');

  return (
    <div className="w-full bg-gray-900 text-gray-200 p-3 overflow-hidden">
      {/* 顶部信息栏 */}
      <div className="flex justify-between items-center mb-3 bg-gray-700 rounded-lg p-3 border border-gray-600 shadow-lg">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-sm font-bold text-gray-200">
              患者: {patientInfo.name} (ID: {patientInfo.id})
            </h1>
            <p className="text-gray-300 text-xs">
              {patientInfo.room} | 主治医师: {patientInfo.doctor}
            </p>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm font-mono text-gray-200">
            {currentTime.toLocaleString()}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-200">系统状态: 在线</span>
          </div>
        </div>
      </div>

      {/* 警报区域 */}
      {alerts.length > 0 && (
        <div className="mb-3 bg-red-900/50 border border-red-500 rounded-lg p-2">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-xs">
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
          <div className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-2 shadow-lg">
            <div className="flex items-center gap-1 mb-1">
              <Heart className="h-3 w-3 text-red-500" />
              <h3 className="text-xs font-semibold text-gray-200">心率</h3>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500 font-mono">
                {vitals.heartRate}
              </div>
              <div className="text-xs text-gray-400">bpm</div>
              <Badge 
                className={`text-xs px-1 py-0 mt-1 ${vitals.heartRate >= 60 && vitals.heartRate <= 90 
                  ? 'bg-green-600 text-gray-100' 
                  : 'bg-red-600 text-gray-100'
                }`}
              >
                {vitals.heartRate >= 60 && vitals.heartRate <= 90 ? '正常' : '异常'}
              </Badge>
            </div>
          </div>

          {/* 呼吸率卡片 */}
          <div className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-2 shadow-lg">
            <div className="flex items-center gap-1 mb-1">
              <Wind className="h-3 w-3 text-blue-500" />
              <h3 className="text-xs font-semibold text-gray-200">呼吸率</h3>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500 font-mono">
                {vitals.respRate}
              </div>
              <div className="text-xs text-gray-400">次/分</div>
              <Badge 
                className={`text-xs px-1 py-0 mt-1 ${vitals.respRate >= 12 && vitals.respRate <= 20 
                  ? 'bg-green-600 text-gray-100' 
                  : 'bg-red-600 text-gray-100'
                }`}
              >
                {vitals.respRate >= 12 && vitals.respRate <= 20 ? '正常' : '异常'}
              </Badge>
            </div>
          </div>

          {/* 实时状态卡片 */}
          <div className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-2 shadow-lg">
            <div className="flex items-center gap-1 mb-1">
              <Activity className="h-3 w-3 text-purple-500" />
              <h3 className="text-xs font-semibold text-gray-200">实时状态</h3>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Zap className="h-2 w-2 text-yellow-400" />
                <Badge 
                  className={`text-xs px-1 py-0 ${realTimeStatus.movement === '无体动' 
                    ? 'bg-green-600' 
                    : realTimeStatus.movement === '轻微体动'
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
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
                    : 'bg-red-600'
                  } text-gray-100`}
                >
                  {realTimeStatus.bedStatus}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="h-2 w-2 text-green-400" />
                <Badge 
                  className={`text-xs px-1 py-0 ${realTimeStatus.breathing === '正常' 
                    ? 'bg-green-600' 
                    : 'bg-red-600'
                  } text-gray-100`}
                >
                  {realTimeStatus.breathing}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* 第二行：实时心电图波形和心率趋势 */}
        <div className="grid grid-cols-2 gap-3">
          <WaveformChart 
            data={ecgData} 
            color="#4ade80" 
            height="200px" 
            title="实时心电图波形"
          />
          <TrendChart 
            data={heartTrendData} 
            color="#ef4444" 
            height="200px"
            title="心率趋势"
          />
        </div>

        {/* 第三行：实时呼吸波形和呼吸率趋势 */}
        <div className="grid grid-cols-2 gap-3">
          <WaveformChart 
            data={respData} 
            color="#60a5fa" 
            height="200px" 
            title="实时呼吸波形"
          />
          <TrendChart 
            data={respTrendData} 
            color="#3b82f6" 
            height="200px"
            title="呼吸率趋势"
          />
        </div>
      </div>

      {/* 底部控制栏 */}
      <div className="mt-3 bg-gray-700 rounded-lg p-2 border border-gray-600 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-300">
            最后更新: {currentTime.toLocaleString()}
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
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSettings}
              className="bg-gray-600 hover:bg-gray-500 text-gray-100 text-xs px-2 py-1"
            >
              <Settings className="h-3 w-3 mr-1" />
              设置
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}