import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Brain, Moon, Activity, Clock, Zap, AlertCircle, CheckCircle, Info, ZoomIn, Printer, X } from "lucide-react"
import { useState, useEffect, useMemo } from "react"

export default function SleepReport() {
  const [selectedSleepIndex, setSelectedSleepIndex] = useState(0);
  const [sleepData, setSleepData] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);

  console.log('=== SleepReport 调试信息 ===');
  console.log('全局 props:', props);

  // 从props.data中获取睡眠数据
  useEffect(() => {
    console.log('开始处理睡眠数据');
    
    if (props?.data && Array.isArray(props.data)) {
      console.log('从props.data获取数据:', props.data);
      setSleepData(props.data);
    } else if (Array.isArray(props)) {
      console.log('props直接是数组:', props);
      setSleepData(props);
    } else {
      console.log('未找到有效的睡眠数据');
      setSleepData([]);
    }
  }, []);

  // 阻止模态框打开时的滚动
  useEffect(() => {
    if (showDetailModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDetailModal]);

  // 当前选中的睡眠数据
  const currentSleep = sleepData[selectedSleepIndex] || {};

  // Markdown格式化函数
  const formatMarkdown = (text) => {
    if (!text) return '';
    
    return text
      // 处理标题
      .replace(/### (.*?)(?=\n|$)/g, '<h3 class="text-lg font-bold text-gray-800 mt-4 mb-2 border-b border-gray-200 pb-1">$1</h3>')
      // 处理加粗文本
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      // 处理列表项
      .replace(/^- (.*?)(?=\n|$)/gm, '<div class="flex items-start mb-1"><span class="text-blue-500 mr-2">•</span><span class="flex-1">$1</span></div>')
      // 处理换行
      .replace(/\n\n/g, '</div><div class="mb-3">')
      .replace(/\n/g, '<br/>');
  };

  // 格式化时间显示
  const formatDateTime = (timeString) => {
    if (!timeString) return '--';
    const date = new Date(timeString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化日期用于下拉选择
  const formatSelectDate = (timeString) => {
    if (!timeString) return '--';
    const date = new Date(timeString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 解析健康报告中的建议部分
  const parseHealthAdvice = (healthReport) => {
    if (!healthReport) return '';
    
    // 查找综合评估部分
    const adviceMatch = healthReport.match(/### 综合评估\n([\s\S]*?)(?=\n###|$)/);
    if (adviceMatch) {
      return adviceMatch[1].trim();
    }
    
    // 如果没有找到综合评估，返回最后一段
    const sections = healthReport.split('### ');
    if (sections.length > 0) {
      return sections[sections.length - 1].replace(/^\w+\n/, '').trim();
    }
    
    return healthReport.substring(0, 200) + '...';
  };

  // 获取睡眠质量等级和颜色
  const getSleepQuality = (healthReport) => {
    if (!healthReport) return { level: '未知', color: 'bg-gray-500' };
    
    if (healthReport.includes('极差') || healthReport.includes('很差')) {
      return { level: '极差', color: 'bg-red-600' };
    } else if (healthReport.includes('较差') || healthReport.includes('不佳')) {
      return { level: '较差', color: 'bg-red-500' };
    } else if (healthReport.includes('一般') || healthReport.includes('中等')) {
      return { level: '一般', color: 'bg-yellow-500' };
    } else if (healthReport.includes('良好') || healthReport.includes('较好')) {
      return { level: '良好', color: 'bg-green-500' };
    } else if (healthReport.includes('优秀') || healthReport.includes('很好')) {
      return { level: '优秀', color: 'bg-green-600' };
    }
    
    return { level: '一般', color: 'bg-blue-500' };
  };

  // 判断睡眠类型
  const getSleepType = (healthReport) => {
    if (!healthReport) return '夜间睡眠';
    if (healthReport.includes('午睡')) return '午睡';
    if (healthReport.includes('小憩')) return '小憩';
    return '夜间睡眠';
  };

  // 改进的打印功能
  const handlePrint = () => {
    const quality = getSleepQuality(currentSleep.health_report);
    const sleepType = getSleepType(currentSleep.health_report);
    const advice = parseHealthAdvice(currentSleep.health_report);
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>睡眠报告 - ${formatSelectDate(currentSleep.bed_time)}</title>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif; 
            padding: 20px; 
            line-height: 1.6;
            color: #333;
          }
          .print-header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
          }
          .print-header h1 { 
            color: #1f2937; 
            margin-bottom: 10px; 
            font-size: 28px;
          }
          .print-header h2 { 
            color: #6b7280; 
            font-size: 18px;
            font-weight: normal;
          }
          .section { 
            margin: 25px 0; 
            break-inside: avoid;
          }
          .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            margin: 20px 0 15px 0; 
            border-left: 4px solid #3b82f6;
            padding-left: 12px;
            color: #1f2937;
          }
          .advice-section {
            background: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
            margin: 20px 0;
          }
          .data-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin: 20px 0; 
          }
          .data-card { 
            border: 1px solid #e5e7eb; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center;
            background: #f9fafb;
          }
          .data-value { 
            font-size: 22px; 
            font-weight: bold; 
            color: #1f2937; 
            margin-bottom: 5px;
          }
          .data-label { 
            font-size: 13px; 
            color: #6b7280; 
          }
          .quality-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 16px;
            color: white;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
          }
          .quality-poor { background-color: #dc2626; }
          .quality-fair { background-color: #f59e0b; }
          .quality-good { background-color: #10b981; }
          .quality-excellent { background-color: #059669; }
          .health-report { 
            background: #f9fafb; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 15px 0; 
            border: 1px solid #e5e7eb;
          }
          .health-report h3 {
            color: #1f2937;
            font-size: 16px;
            margin: 15px 0 10px 0;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
          }
          .health-report strong {
            color: #1f2937;
          }
          .device-info {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          @media print { 
            body { -webkit-print-color-adjust: exact; color-adjust: exact; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>睡眠健康报告</h1>
          <h2>${formatSelectDate(currentSleep.bed_time)} (${sleepType})
            <span class="quality-badge quality-${quality.level === '极差' ? 'poor' : quality.level === '较差' ? 'poor' : quality.level === '一般' ? 'fair' : quality.level === '良好' ? 'good' : 'excellent'}">${quality.level}</span>
          </h2>
        </div>
        
        <div class="section">
          <div class="section-title">睡眠建议</div>
          <div class="advice-section">
            ${advice.replace(/\n/g, '<br>')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">睡眠概况</div>
          <div class="data-grid">
            <div class="data-card">
              <div class="data-value">${currentSleep.total_duration || '--'}</div>
              <div class="data-label">总睡眠时长</div>
            </div>
            <div class="data-card">
              <div class="data-value">${currentSleep.in_bed_duration || '--'}</div>
              <div class="data-label">在床时长</div>
            </div>
            <div class="data-card">
              <div class="data-value">${formatDateTime(currentSleep.bed_time)}</div>
              <div class="data-label">上床时间</div>
            </div>
            <div class="data-card">
              <div class="data-value">${formatDateTime(currentSleep.wake_time)}</div>
              <div class="data-label">醒来时间</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">生理指标</div>
          <div class="data-grid">
            <div class="data-card">
              <div class="data-value">${currentSleep.avg_heart_rate || '--'} ${currentSleep.avg_heart_rate ? '次/分' : ''}</div>
              <div class="data-label">平均心率</div>
            </div>
            <div class="data-card">
              <div class="data-value">${currentSleep.avg_breath_rate || '--'} ${currentSleep.avg_breath_rate ? '次/分' : ''}</div>
              <div class="data-label">平均呼吸率</div>
            </div>
            <div class="data-card">
              <div class="data-value">${currentSleep.heart_rate_variability ? (currentSleep.heart_rate_variability * 1000).toFixed(0) + 'ms' : '--'}</div>
              <div class="data-label">心率变异性</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">睡眠结构</div>
          <div class="data-grid">
            <div class="data-card">
              <div class="data-value">${currentSleep.deep_sleep_duration || '--'}</div>
              <div class="data-label">深睡眠时长</div>
            </div>
            <div class="data-card">
              <div class="data-value">${currentSleep.light_sleep_duration || '--'}</div>
              <div class="data-label">浅睡眠时长</div>
            </div>
            <div class="data-card">
              <div class="data-value">${currentSleep.awake_duration || '--'}</div>
              <div class="data-label">清醒时长</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">行为表现</div>
          <div class="data-grid">
            <div class="data-card">
              <div class="data-value">${currentSleep.body_movement_count || 0}</div>
              <div class="data-label">体动次数</div>
            </div>
            <div class="data-card">
              <div class="data-value">${currentSleep.rapid_breathing_count || 0}</div>
              <div class="data-label">呼吸急促次数</div>
            </div>
            <div class="data-card">
              <div class="data-value">${currentSleep.apnea_count || 0}</div>
              <div class="data-label">呼吸暂停次数</div>
            </div>
            <div class="data-card">
              <div class="data-value">${currentSleep.leave_bed_count || 0}</div>
              <div class="data-label">离床次数</div>
            </div>
          </div>
        </div>

        ${currentSleep.health_report ? `
        <div class="section">
          <div class="section-title">详细健康报告</div>
          <div class="health-report">
            ${formatMarkdown(currentSleep.health_report)}
          </div>
        </div>
        ` : ''}

        <div class="device-info">
          ${currentSleep.device_sn ? `设备序列号: ${currentSleep.device_sn}` : ''}
          ${currentSleep.create_time ? ` | 记录时间: ${formatDateTime(currentSleep.create_time)}` : ''}
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // 等待内容加载完成后再打印
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // 无数据状态
  if (!sleepData.length) {
    return (
      <div className="p-4 border-2 border-yellow-300 bg-yellow-50 rounded-lg">
        <div className="text-yellow-600 font-bold mb-2">📭 暂无睡眠数据</div>
        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          <strong>🔧 调试信息:</strong>
          <div className="mt-1">
            <div><strong>Props:</strong> <pre className="text-xs bg-white p-1 rounded mt-1 overflow-auto max-h-32">{JSON.stringify(props, null, 2)}</pre></div>
          </div>
        </div>
      </div>
    );
  }

  const quality = getSleepQuality(currentSleep.health_report);
  const sleepType = getSleepType(currentSleep.health_report);
  const advice = parseHealthAdvice(currentSleep.health_report);

  return (
    <div className="space-y-3 p-2 max-w-full">
      {/* 操作栏 */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-blue-600" />
          <Select value={selectedSleepIndex.toString()} onValueChange={(value) => setSelectedSleepIndex(parseInt(value))}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sleepData.map((sleep, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {formatSelectDate(sleep.bed_time)} ({getSleepType(sleep.health_report)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetailModal(true)}
            className="flex items-center gap-1"
          >
            <ZoomIn className="h-4 w-4" />
            详细报告
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1"
          >
            <Printer className="h-4 w-4" />
            打印
          </Button>
        </div>
      </div>

      <div id="sleep-report-content">
        {/* 睡眠建议 */}
        <Card className="w-full border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-blue-700 text-base">
              <Info className="h-4 w-4" />
              睡眠建议
              <Badge className={`${quality.color} text-white text-xs`}>
                {quality.level}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {advice || '暂无具体建议'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 核心数据概览 - 更宽的布局 */}
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Moon className="h-4 w-4 text-purple-600" />
              睡眠概况
              <Badge variant="outline" className="text-xs">
                {sleepType}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="text-center bg-purple-50 p-3 rounded-lg">
                <div className="text-xl font-bold text-purple-600">{currentSleep.total_duration || '--'}</div>
                <div className="text-xs text-gray-500">总时长</div>
              </div>
              <div className="text-center bg-green-50 p-3 rounded-lg">
                <div className="text-xl font-bold text-green-600">{currentSleep.in_bed_duration || '--'}</div>
                <div className="text-xs text-gray-500">在床时长</div>
              </div>
              <div className="text-center bg-blue-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{formatDateTime(currentSleep.bed_time)}</div>
                <div className="text-xs text-gray-500">上床时间</div>
              </div>
              <div className="text-center bg-orange-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-orange-600">{formatDateTime(currentSleep.wake_time)}</div>
                <div className="text-xs text-gray-500">醒来时间</div>
              </div>
              <div className="text-center bg-red-50 p-3 rounded-lg">
                <div className="text-xl font-bold text-red-600">
                  {currentSleep.avg_heart_rate || '--'} 
                  {currentSleep.avg_heart_rate && <span className="text-sm">次/分</span>}
                </div>
                <div className="text-xs text-gray-500">平均心率</div>
              </div>
              <div className="text-center bg-cyan-50 p-3 rounded-lg">
                <div className="text-xl font-bold text-cyan-600">
                  {currentSleep.avg_breath_rate || '--'} 
                  {currentSleep.avg_breath_rate && <span className="text-sm">次/分</span>}
                </div>
                <div className="text-xs text-gray-500">呼吸率</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 睡眠结构 + 行为表现 合并 */}
        <div className="grid md:grid-cols-2 gap-3">
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-4 w-4 text-indigo-600" />
                睡眠结构
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-indigo-50 rounded-lg">
                  <div className="text-lg font-bold text-indigo-600">{currentSleep.deep_sleep_duration || '--'}</div>
                  <div className="text-xs text-gray-500">深睡眠</div>
                </div>
                <div className="text-center p-2 bg-cyan-50 rounded-lg">
                  <div className="text-lg font-bold text-cyan-600">{currentSleep.light_sleep_duration || '--'}</div>
                  <div className="text-xs text-gray-500">浅睡眠</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">{currentSleep.awake_duration || '--'}</div>
                  <div className="text-xs text-gray-500">清醒时长</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-green-600" />
                行为表现
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-600">{currentSleep.body_movement_count || 0}</div>
                  <div className="text-xs text-gray-500">体动次数</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">{currentSleep.rapid_breathing_count || 0}</div>
                  <div className="text-xs text-gray-500">呼吸异常</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-center p-2 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{currentSleep.apnea_count || 0}</div>
                  <div className="text-xs text-gray-500">呼吸暂停</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{currentSleep.leave_bed_count || 0}</div>
                  <div className="text-xs text-gray-500">离床次数</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 设备信息 */}
        {(currentSleep.device_sn || currentSleep.device_type) && (
          <div className="text-center text-xs text-gray-500 p-2 bg-gray-50 rounded-lg">
            {currentSleep.device_sn && <span>设备: {currentSleep.device_sn}</span>}
            {currentSleep.device_type && <span className="ml-4">类型: {currentSleep.device_type}</span>}
            {currentSleep.create_time && <span className="ml-4">记录: {formatDateTime(currentSleep.create_time)}</span>}
          </div>
        )}
      </div>

      {/* 修复后的详细报告模态框 */}
      {showDetailModal && currentSleep.health_report && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            style={{ 
              zIndex: 10000,
              backgroundColor: 'white',
              opacity: 1
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 模态框头部 */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-gray-800">详细健康报告</h3>
                <Badge className={`${quality.color} text-white text-xs`}>
                  {quality.level}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* 模态框内容 */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              <div 
                className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: `<div class="mb-3">${formatMarkdown(currentSleep.health_report)}</div>`
                }}
              />
            </div>
            
            {/* 模态框底部 */}
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                打印报告
              </Button>
              <Button size="sm" onClick={() => setShowDetailModal(false)}>
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}