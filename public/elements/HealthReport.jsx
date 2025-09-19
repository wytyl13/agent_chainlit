import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Clock, TrendingUp, Heart, Brain, CheckCircle, AlertTriangle } from "lucide-react"
import { useState } from "react"

export default function SleepReport() {
  const [currentTab, setCurrentTab] = useState('overview');
  
  // 张秀英的睡眠数据
  const sleepData = {
    user_name: "张秀英",
    report_date: "2025年9月19日",
    report_period: "过去7天",
    
    // 睡眠统计
    avg_sleep_duration: "7小时23分钟",
    avg_bedtime: "22:35",
    avg_wake_time: "06:28",
    sleep_efficiency: "87%",
    deep_sleep_percentage: "16%",
    rem_sleep_percentage: "22%",
    light_sleep_percentage: "62%",
    
    // 睡眠质量评分
    overall_score: 85,
    duration_score: 88,
    consistency_score: 82,
    efficiency_score: 87,
    
    // 每日详情
    daily_sleep: [
      { date: "9-13", duration: "7h 15m", quality: "良好", bedtime: "22:20", wake: "06:35" },
      { date: "9-14", duration: "7h 45m", quality: "优秀", bedtime: "22:10", wake: "06:55" },
      { date: "9-15", duration: "6h 50m", quality: "一般", bedtime: "23:15", wake: "06:05" },
      { date: "9-16", duration: "7h 30m", quality: "良好", bedtime: "22:30", wake: "06:00" },
      { date: "9-17", duration: "8h 00m", quality: "优秀", bedtime: "22:00", wake: "06:00" },
      { date: "9-18", duration: "7h 20m", quality: "良好", bedtime: "22:40", wake: "06:00" },
      { date: "9-19", duration: "7h 00m", quality: "良好", bedtime: "23:00", wake: "06:00" }
    ],
    
    // 建议
    recommendations: [
      "保持规律的作息时间，建议每天22:00-22:30入睡",
      "睡前1小时避免使用电子设备",
      "创造更安静舒适的睡眠环境",
      "适量运动但避免睡前3小时内剧烈运动"
    ],
    
    // 健康指标
    health_indicators: {
      stress_level: "低",
      heart_rate_variability: "正常",
      recovery_status: "良好"
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'green';
    if (score >= 70) return 'orange';
    return 'red';
  };

  const getQualityColor = (quality) => {
    if (quality === '优秀') return 'green';
    if (quality === '良好') return 'blue';
    return 'orange';
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      {/* 报告头部 */}
      <div style={{
        backgroundColor: 'midnightblue',
        color: 'white',
        padding: '20px',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        border: '3px solid gold'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              backgroundColor: 'darkviolet',
              padding: '12px',
              borderRadius: '50%'
            }}>
              <Moon style={{ height: '24px', width: '24px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                睡眠健康报告
              </h1>
              <p style={{ color: 'lightblue', fontSize: '14px', margin: 0 }}>
                {sleepData.report_period} • {sleepData.report_date}
              </p>
            </div>
          </div>
          <div style={{
            backgroundColor: 'gold',
            color: 'midnightblue',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            总分: {sleepData.overall_score}
          </div>
        </div>
        
        {/* 用户信息 */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: '12px',
          borderRadius: '8px',
          border: '2px solid lightblue'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>👤</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {sleepData.user_name}
            </span>
            <Badge style={{
              backgroundColor: getScoreColor(sleepData.overall_score),
              color: 'white',
              marginLeft: '12px'
            }}>
              {sleepData.overall_score >= 85 ? '优秀' : sleepData.overall_score >= 70 ? '良好' : '需改善'}
            </Badge>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div style={{
        display: 'flex',
        backgroundColor: 'lightgray',
        borderBottom: '2px solid gray'
      }}>
        {[
          { id: 'overview', label: '总览', icon: '📊' },
          { id: 'details', label: '详细数据', icon: '📈' },
          { id: 'recommendations', label: '建议', icon: '💡' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: currentTab === tab.id ? 'white' : 'transparent',
              border: 'none',
              borderBottom: currentTab === tab.id ? '3px solid blue' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              color: currentTab === tab.id ? 'blue' : 'gray'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div style={{ padding: '20px', backgroundColor: 'aliceblue' }}>
        
        {currentTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 核心指标 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '16px'
            }}>
              <div style={{
                backgroundColor: 'lightblue',
                padding: '16px',
                borderRadius: '12px',
                border: '2px solid blue',
                textAlign: 'center'
              }}>
                <Clock style={{ height: '24px', width: '24px', color: 'darkblue', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'darkblue' }}>
                  {sleepData.avg_sleep_duration}
                </div>
                <div style={{ fontSize: '11px', color: 'blue' }}>平均睡眠时长</div>
              </div>

              <div style={{
                backgroundColor: 'lightgreen',
                padding: '16px',
                borderRadius: '12px',
                border: '2px solid green',
                textAlign: 'center'
              }}>
                <TrendingUp style={{ height: '24px', width: '24px', color: 'darkgreen', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'darkgreen' }}>
                  {sleepData.sleep_efficiency}
                </div>
                <div style={{ fontSize: '11px', color: 'green' }}>睡眠效率</div>
              </div>

              <div style={{
                backgroundColor: 'lavender',
                padding: '16px',
                borderRadius: '12px',
                border: '2px solid purple',
                textAlign: 'center'
              }}>
                <Moon style={{ height: '24px', width: '24px', color: 'darkviolet', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'darkviolet' }}>
                  {sleepData.avg_bedtime}
                </div>
                <div style={{ fontSize: '11px', color: 'purple' }}>平均入睡时间</div>
              </div>

              <div style={{
                backgroundColor: 'lightyellow',
                padding: '16px',
                borderRadius: '12px',
                border: '2px solid orange',
                textAlign: 'center'
              }}>
                <Sun style={{ height: '24px', width: '24px', color: 'darkorange', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'darkorange' }}>
                  {sleepData.avg_wake_time}
                </div>
                <div style={{ fontSize: '11px', color: 'orange' }}>平均起床时间</div>
              </div>

              <div style={{
                backgroundColor: 'lightcyan',
                padding: '16px',
                borderRadius: '12px',
                border: '2px solid cyan',
                textAlign: 'center'
              }}>
                <Brain style={{ height: '24px', width: '24px', color: 'darkcyan', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'darkcyan' }}>
                  {sleepData.deep_sleep_percentage}
                </div>
                <div style={{ fontSize: '11px', color: 'cyan' }}>深度睡眠</div>
              </div>

              <div style={{
                backgroundColor: 'mistyrose',
                padding: '16px',
                borderRadius: '12px',
                border: '2px solid crimson',
                textAlign: 'center'
              }}>
                <Heart style={{ height: '24px', width: '24px', color: 'crimson', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'crimson' }}>
                  {sleepData.overall_score}
                </div>
                <div style={{ fontSize: '11px', color: 'crimson' }}>综合评分</div>
              </div>
            </div>

            {/* 睡眠阶段分析和健康指标 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}>
              {/* 睡眠阶段分析 */}
              <div style={{
                backgroundColor: 'white',
                padding: '16px',
                borderRadius: '12px',
                border: '2px solid gray'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'darkblue', marginBottom: '12px' }}>
                  🧠 睡眠阶段分析
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'darkblue' }}>
                      {sleepData.deep_sleep_percentage}
                    </div>
                    <div style={{ fontSize: '12px', color: 'blue' }}>深度睡眠</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'darkgreen' }}>
                      {sleepData.rem_sleep_percentage}
                    </div>
                    <div style={{ fontSize: '12px', color: 'green' }}>REM睡眠</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'orange' }}>
                      {sleepData.light_sleep_percentage}
                    </div>
                    <div style={{ fontSize: '12px', color: 'darkorange' }}>浅度睡眠</div>
                  </div>
                </div>
              </div>

              {/* 健康指标 */}
              <div style={{
                backgroundColor: 'mintcream',
                padding: '16px',
                borderRadius: '12px',
                border: '2px solid green'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'darkgreen', marginBottom: '12px' }}>
                  ❤️ 健康指标
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'green', marginBottom: '4px' }}>压力水平</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'darkgreen' }}>
                      {sleepData.health_indicators.stress_level}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'green', marginBottom: '4px' }}>心率变异性</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'darkgreen' }}>
                      {sleepData.health_indicators.heart_rate_variability}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'green', marginBottom: '4px' }}>恢复状态</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'darkgreen' }}>
                      {sleepData.health_indicators.recovery_status}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'darkblue' }}>
              📅 每日睡眠详情
            </h3>
            
            {/* 每日睡眠数据 - 网格布局 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '12px'
            }}>
              {sleepData.daily_sleep.map((day, index) => (
                <div key={index} style={{
                  backgroundColor: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid lightgray',
                  textAlign: 'center'
                }}>
                  <div style={{
                    backgroundColor: 'lightblue',
                    padding: '4px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}>
                    {day.date}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'darkblue', marginBottom: '4px' }}>
                    {day.duration}
                  </div>
                  <div style={{ fontSize: '10px', color: 'gray', marginBottom: '6px' }}>
                    {day.bedtime} - {day.wake}
                  </div>
                  <Badge style={{
                    backgroundColor: getQualityColor(day.quality),
                    color: 'white',
                    fontSize: '10px',
                    padding: '2px 6px'
                  }}>
                    {day.quality}
                  </Badge>
                </div>
              ))}
            </div>

            {/* 评分详情 - 横向布局 */}
            <div style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '12px',
              border: '2px solid blue'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: 'darkblue', marginBottom: '16px' }}>
                📊 详细评分
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px'
              }}>
                {[
                  { label: '睡眠时长', score: sleepData.duration_score },
                  { label: '作息规律', score: sleepData.consistency_score },
                  { label: '睡眠效率', score: sleepData.efficiency_score }
                ].map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '14px', color: 'gray', fontWeight: 'bold' }}>{item.label}</span>
                    <div style={{
                      width: '120px',
                      height: '12px',
                      backgroundColor: 'lightgray',
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${item.score}%`,
                        height: '100%',
                        backgroundColor: getScoreColor(item.score),
                        borderRadius: '6px'
                      }}></div>
                    </div>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: getScoreColor(item.score)
                    }}>
                      {item.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'recommendations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'darkgreen' }}>
              💡 个性化建议
            </h3>
            
            {/* 建议列表 - 网格布局 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              {sleepData.recommendations.map((recommendation, index) => (
                <div key={index} style={{
                  backgroundColor: 'lightgreen',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid green',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <CheckCircle style={{ height: '20px', width: '20px', color: 'darkgreen', marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', color: 'darkgreen', lineHeight: '1.4' }}>
                    {recommendation}
                  </span>
                </div>
              ))}
            </div>

            {/* 注意事项 */}
            <div style={{
              backgroundColor: 'lightyellow',
              padding: '16px',
              borderRadius: '12px',
              border: '2px solid orange'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle style={{ height: '20px', width: '20px', color: 'darkorange' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: 'darkorange', margin: 0 }}>
                  注意事项
                </h4>
              </div>
              <p style={{ fontSize: '14px', color: 'brown', lineHeight: '1.4', margin: 0 }}>
                如果持续出现失眠、打鼾或白天过度疲劳等症状，建议咨询专业医生。
                良好的睡眠习惯需要时间养成，请保持耐心和坚持。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 底部操作区 */}
      <div style={{
        backgroundColor: 'lightgray',
        padding: '16px',
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px',
        borderTop: '2px solid gray',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '12px', color: 'gray' }}>
          报告生成时间: {new Date().toLocaleString('zh-CN')}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button style={{
            backgroundColor: 'lightblue',
            color: 'darkblue',
            border: '2px solid blue',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            📧 分享报告
          </Button>
          <Button style={{
            backgroundColor: 'lightgreen',
            color: 'darkgreen',
            border: '2px solid green',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            📱 设置提醒
          </Button>
        </div>
      </div>
    </div>
  );
}