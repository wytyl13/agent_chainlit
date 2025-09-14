// public/elements/AttendanceCard.jsx
import React from 'react';

const AttendanceCard = ({ studentId, courseId, studentName, month, stats, records }) => {
  // 获取状态样式
  const getStatusStyle = (status) => {
    const styles = {
      '已签到': { 
        backgroundColor: '#e8f5e8', 
        color: '#2e7d32',
        border: '4px solid #4caf50' 
      },
      '迟到': { 
        backgroundColor: '#fff3e0', 
        color: '#ef6c00',
        border: '4px solid #ff9800' 
      },
      '缺勤': { 
        backgroundColor: '#ffebee', 
        color: '#c62828',
        border: '4px solid #f44336' 
      }
    };
    return styles[status] || { backgroundColor: '#f5f5f5', color: '#666', border: '4px solid #ccc' };
  };

  const handleRecordClick = (record) => {
    // 发送点击事件到后端
    window.chainlit.emit('record_clicked', {
      record,
      studentId,
      courseId
    });
  };

  const handleStatsClick = (statType, value) => {
    // 发送统计数据点击事件
    window.chainlit.emit('stats_clicked', {
      statType,
      value,
      studentId,
      month
    });
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '20px 0',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f4ff 100%)',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 卡片头部 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '14px',
          color: '#333',
          fontWeight: '500'
        }}>
          好的，已为您查询本月课程出勤情况:
        </h3>
      </div>

      {/* 卡片内容 */}
      <div style={{ padding: '20px' }}>
        {/* 学员信息 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '13px', color: '#666', minWidth: '70px' }}>学员编号:</span>
            <span style={{ fontSize: '13px', color: '#333', fontWeight: '500' }}>{studentId}</span>
            <span style={{ fontSize: '13px', color: '#666', minWidth: '70px' }}>课程编号:</span>
            <span style={{ fontSize: '13px', color: '#333', fontWeight: '500' }}>{courseId}</span>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', color: '#666', minWidth: '70px' }}>姓名:</span>
            <span style={{ fontSize: '13px', color: '#333', fontWeight: '500' }}>{studentName}</span>
          </div>
        </div>

        {/* 月度统计 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h4 style={{
              margin: 0,
              fontSize: '14px',
              color: '#333',
              fontWeight: '500'
            }}>本月出勤统计</h4>
            <span style={{
              fontSize: '12px',
              color: '#666'
            }}>{month}</span>
          </div>

          {/* 统计数字 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            textAlign: 'center'
          }}>
            <div 
              style={{ flex: 1, cursor: 'pointer' }}
              onClick={() => handleStatsClick('present', stats.present)}
            >
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '4px',
                color: '#4caf50'
              }}>
                {stats.present}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666'
              }}>已签到</div>
            </div>
            <div 
              style={{ flex: 1, cursor: 'pointer' }}
              onClick={() => handleStatsClick('late', stats.late)}
            >
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '4px',
                color: '#ff9800'
              }}>
                {stats.late}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666'
              }}>迟到</div>
            </div>
            <div 
              style={{ flex: 1, cursor: 'pointer' }}
              onClick={() => handleStatsClick('absent', stats.absent)}
            >
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '4px',
                color: '#f44336'
              }}>
                {stats.absent}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666'
              }}>缺勤</div>
            </div>
          </div>
        </div>

        {/* 出勤记录 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <h4 style={{
            margin: '0 0 16px 0',
            fontSize: '14px',
            color: '#333',
            fontWeight: '500'
          }}>出勤记录详情</h4>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {records.map((record, index) => {
              const statusStyle = getStatusStyle(record.status);
              return (
                <div 
                  key={index}
                  onClick={() => handleRecordClick(record)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#f8f9fa',
                    borderLeft: statusStyle.border,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    ':hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#333'
                    }}>
                      {record.courseName}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500',
                      backgroundColor: statusStyle.backgroundColor,
                      color: statusStyle.color
                    }}>
                      {record.status}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#666'
                  }}>
                    <span>{record.date} {record.day}</span>
                    {record.time && (
                      <span>
                        🕐 签到时间: {record.time}
                      </span>
                    )}
                    {!record.time && record.status === '缺勤' && (
                      <span>未签到</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCard;