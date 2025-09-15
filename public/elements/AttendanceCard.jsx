export default function AttendanceCard() {
  // props 是全局注入的，不需要作为参数传递
  console.log('=== AttendanceCard 调试信息 ===');
  console.log('全局 props:', props);
  console.log('props 类型:', typeof props);
  console.log('props 是否为数组:', Array.isArray(props));
  
  // 尝试获取出勤数据
  let attendanceData = {};
  
  if (Array.isArray(props) && props.length > 0) {
    // 如果 props 是数组，取第一个元素
    attendanceData = props[0];
  } else if (props && typeof props === 'object' && !Array.isArray(props)) {
    // 如果 props 是对象
    if (props.data && Array.isArray(props.data) && props.data.length > 0) {
      // 如果有 data 数组，取第一个
      attendanceData = props.data[0];
    } else if (props.studentId || props.studentName) {
      // 如果 props 直接包含学生信息
      attendanceData = props;
    }
  }

  console.log('最终处理的 attendanceData:', attendanceData);
  
  // 解构数据，提供默认值
  const {
    studentId = '未知',
    courseId = '未知',
    studentName = '未知学员',
    month = '未知月份',
    stats = [{ present: 0, late: 0, absent: 0 }],
    records = []
  } = attendanceData;

  console.log('解构后的数据:', { studentId, courseId, studentName, month, stats, records });

  // 获取统计数据（stats是数组，取第一个元素）
  const statsData = Array.isArray(stats) && stats.length > 0 ? stats[0] : { present: 0, late: 0, absent: 0 };
  console.log('statsData:', statsData);

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
    console.log('点击记录:', record);
    // 使用 Chainlit 提供的 callAction API
    callAction({
      name: 'record_clicked',
      payload: {
        record,
        studentId,
        courseId
      }
    });
  };

  const handleStatsClick = (statType, value) => {
    console.log('点击统计:', statType, value);
    // 使用 Chainlit 提供的 callAction API
    callAction({
      name: 'stats_clicked',
      payload: {
        statType,
        value,
        studentId,
        month
      }
    });
  };

  // 详细的调试信息显示
  if (!attendanceData || Object.keys(attendanceData).length === 0 || !studentName || studentName === '未知学员') {
    return (
      <div style={{
        maxWidth: '400px',
        margin: '20px 0',
        padding: '20px',
        background: '#fff3cd',
        borderRadius: '16px',
        border: '2px solid #ffeaa7'
      }}>
        <div style={{ color: '#d63031', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
          🐛 调试信息：
        </div>
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '10px', fontFamily: 'monospace', background: '#f8f9fa', padding: '8px', borderRadius: '4px' }}>
          <div><strong>全局 props:</strong></div>
          <pre>{JSON.stringify(props, null, 2)}</pre>
        </div>
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '10px', fontFamily: 'monospace' }}>
          <div><strong>props 类型:</strong> {typeof props}</div>
          <div><strong>props 是否为数组:</strong> {Array.isArray(props).toString()}</div>
          <div><strong>attendanceData:</strong> {JSON.stringify(attendanceData)}</div>
        </div>
        <div style={{ textAlign: 'center', color: '#666', marginTop: '10px' }}>
          暂无出勤数据
        </div>
      </div>
    );
  }

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
      {/* 成功状态的调试信息 */}
      <div style={{
        background: '#d4edda',
        padding: '8px 16px',
        fontSize: '11px',
        color: '#155724',
        borderBottom: '1px solid #c3e6cb'
      }}>
        <strong>✅ 成功:</strong> 学员 {studentName}, 统计 {JSON.stringify(statsData)}, 记录 {records.length} 条
      </div>

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
              onClick={() => handleStatsClick('present', statsData.present)}
            >
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '4px',
                color: '#4caf50'
              }}>
                {statsData.present}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666'
              }}>已签到</div>
            </div>
            <div 
              style={{ flex: 1, cursor: 'pointer' }}
              onClick={() => handleStatsClick('late', statsData.late)}
            >
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '4px',
                color: '#ff9800'
              }}>
                {statsData.late}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666'
              }}>迟到</div>
            </div>
            <div 
              style={{ flex: 1, cursor: 'pointer' }}
              onClick={() => handleStatsClick('absent', statsData.absent)}
            >
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '4px',
                color: '#f44336'
              }}>
                {statsData.absent}
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
                    transition: 'all 0.2s ease'
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
}