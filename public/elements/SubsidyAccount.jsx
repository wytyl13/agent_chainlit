import { useState, useEffect } from 'react';

export default function SubsidyAccountCard() {
  // props 是全局注入的，不需要作为参数传递
  console.log('=== SubsidyAccountCard 调试信息 ===');
  console.log('全局 props:', props);
  console.log('props 类型:', typeof props);
  console.log('props 是否为数组:', Array.isArray(props));

  // 数据缓存状态管理
  const [cachedData, setCachedData] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 数据加载和缓存逻辑
  useEffect(() => {
    // 尝试获取补贴账户数据
    let accountData = {};
    
    if (Array.isArray(props) && props.length > 0) {
      // 如果 props 是数组，取第一个元素
      accountData = props[0];
    } else if (props && typeof props === 'object' && !Array.isArray(props)) {
      // 如果 props 是对象
      if (props.data && Array.isArray(props.data) && props.data.length > 0) {
        // 如果有 data 数组，取第一个
        accountData = props.data[0];
      } else if (props.serviceTargetId || props.targetName) {
        // 如果 props 直接包含服务对象信息
        accountData = props;
      } else if (props.selectedTarget) {
        // 如果从服务对象列表页面传来选中的对象
        accountData = {
          serviceTargetId: props.selectedTarget.id,
          targetName: props.selectedTarget.name,
          idCard: props.selectedTarget.idCard,
          community: props.selectedTarget.community,
          fromCache: true
        };
      }
    }

    console.log('最终处理的 accountData:', accountData);

    // 如果有新数据，更新缓存
    if (accountData && Object.keys(accountData).length > 0) {
      // 如果是从其他页面缓存来的数据，需要补充账户信息
      if (accountData.fromCache || !accountData.accountInfo) {
        accountData = {
          ...accountData,
          accountInfo: generateAccountInfo(accountData.serviceTargetId || 'ST2024001'),
          subsidyRecords: generateSubsidyRecords(accountData.targetName || '王秀英'),
          consumptionRecords: generateConsumptionRecords(accountData.serviceTargetId || 'ST2024001'),
          monthlyStats: generateMonthlyStats(),
          lastUpdated: new Date().toISOString()
        };
      }
      setCachedData(accountData);
      setIsDataLoaded(true);
    } else if (!isDataLoaded) {
      // 如果没有新数据且未加载过，使用默认数据
      const defaultData = generateDefaultData();
      setCachedData(defaultData);
      setIsDataLoaded(true);
    }
  }, [props, isDataLoaded]);

  // 生成账户信息的辅助函数
  const generateAccountInfo = (targetId) => {
    const baseAmount = targetId === 'ST2024001' ? 2850 : 
                     targetId === 'ST2024002' ? 3200 :
                     targetId === 'ST2024003' ? 1980 : 2500;
    return {
      accountNumber: `ACC${targetId.slice(2)}`,
      currentBalance: baseAmount,
      totalSubsidy: baseAmount + 2000,
      totalConsumption: baseAmount - 1000,
      freezeAmount: 0.00,
      accountStatus: 'active'
    };
  };

  // 生成补贴记录的辅助函数
  const generateSubsidyRecords = (targetName) => [
    {
      id: 'SUB001',
      date: '2024-01-15',
      type: '月度补贴',
      amount: 1500.00,
      source: '政府补贴',
      status: 'completed',
      description: `2024年1月${targetName}养老服务补贴`
    },
    {
      id: 'SUB002',
      date: '2024-02-15', 
      type: '月度补贴',
      amount: 1500.00,
      source: '政府补贴',
      status: 'completed',
      description: `2024年2月${targetName}养老服务补贴`
    },
    {
      id: 'SUB003',
      date: '2024-03-15',
      type: '专项补贴',
      amount: 2000.00,
      source: '特殊补贴',
      status: 'completed',
      description: '春节特别关爱补贴'
    }
  ];

  // 生成消费记录的辅助函数
  const generateConsumptionRecords = (targetId) => [
    {
      id: 'CON001',
      date: '2024-01-18',
      serviceType: '上门助浴',
      amount: 180.00,
      provider: '阳光养老服务中心',
      status: 'paid',
      description: '上门助浴服务 3次'
    },
    {
      id: 'CON002',
      date: '2024-01-25',
      serviceType: '健康体检',
      amount: 320.00,
      provider: '朝阳社区卫生院',
      status: 'paid',
      description: '全面健康体检'
    },
    {
      id: 'CON003',
      date: '2024-02-08',
      serviceType: '上门助浴',
      amount: 180.00,
      provider: '阳光养老服务中心',
      status: 'paid',
      description: '上门助浴服务 3次'
    },
    {
      id: 'CON004',
      date: '2024-02-20',
      serviceType: '生活照料',
      amount: 450.00,
      provider: '温馨家政服务',
      status: 'paid',
      description: '生活照料服务 6次'
    },
    {
      id: 'CON005',
      date: '2024-03-05',
      serviceType: '上门助浴',
      amount: 180.00,
      provider: '阳光养老服务中心',
      status: 'paid',
      description: '上门助浴服务 3次'
    },
    {
      id: 'CON006',
      date: '2024-03-18',
      serviceType: '康复护理',
      amount: 380.00,
      provider: '专业康复中心',
      status: 'pending',
      description: '康复护理服务 4次'
    },
    {
      id: 'CON007',
      date: '2024-03-22',
      serviceType: '健康体检',
      amount: 320.00,
      provider: '朝阳社区卫生院',
      status: 'pending',
      description: '季度健康体检'
    },
    {
      id: 'CON008',
      date: '2024-03-25',
      serviceType: '上门助浴',
      amount: 180.00,
      provider: '阳光养老服务中心',
      status: 'processing',
      description: '上门助浴服务 3次'
    }
  ];

  // 生成月度统计的辅助函数
  const generateMonthlyStats = () => ({
    'January': { subsidy: 1500.00, consumption: 500.00, balance: 1000.00 },
    'February': { subsidy: 1500.00, consumption: 630.00, balance: 1870.00 },
    'March': { subsidy: 2000.00, consumption: 1020.00, balance: 2850.00 }
  });

  // 生成默认数据的辅助函数
  const generateDefaultData = () => ({
    serviceTargetId: 'ST2024001',
    targetName: '王秀英',
    idCard: '1101051958XXXXXX',
    community: '东部城区朝阳街道甲社区',
    accountInfo: generateAccountInfo('ST2024001'),
    subsidyRecords: generateSubsidyRecords('王秀英'),
    consumptionRecords: generateConsumptionRecords('ST2024001'),
    monthlyStats: generateMonthlyStats(),
    lastUpdated: new Date().toISOString()
  });

  // 使用缓存数据或默认数据
  const accountData = cachedData || {};

  // 解构数据，提供默认值
  const {
    serviceTargetId = 'ST2024001',
    targetName = '王秀英',
    idCard = '1101051958XXXXXX',
    community = '东部城区朝阳街道甲社区',
    accountInfo = {},
    subsidyRecords = [],
    consumptionRecords = [],
    monthlyStats = {},
    lastUpdated = ''
  } = accountData;

  console.log('解构后的数据:', { serviceTargetId, targetName, accountInfo });
  console.log('缓存数据:', cachedData);
  console.log('数据来源:', cachedData?.fromCache ? '页面缓存' : '默认数据');
  console.log('消费记录:', consumptionRecords);

  // 获取服务类型样式
  const getServiceTypeStyle = (type) => {
    const styles = {
      '上门助浴': { 
        backgroundColor: '#e3f2fd', 
        color: '#1565c0',
        icon: '🛁' 
      },
      '健康体检': { 
        backgroundColor: '#e8f5e8', 
        color: '#2e7d32',
        icon: '🏥' 
      },
      '生活照料': { 
        backgroundColor: '#fff3e0', 
        color: '#ef6c00',
        icon: '🏠' 
      },
      '康复护理': { 
        backgroundColor: '#f3e5f5', 
        color: '#7b1fa2',
        icon: '💊' 
      }
    };
    return styles[type] || { backgroundColor: '#f5f5f5', color: '#666', icon: '📋' };
  };

  // 获取状态样式
  const getStatusStyle = (status) => {
    const styles = {
      'completed': { 
        backgroundColor: '#e8f5e8', 
        color: '#2e7d32',
        icon: '✅' 
      },
      'paid': { 
        backgroundColor: '#e8f5e8', 
        color: '#2e7d32',
        icon: '✅' 
      },
      'pending': { 
        backgroundColor: '#fff3e0', 
        color: '#ef6c00',
        icon: '⏳' 
      },
      'processing': { 
        backgroundColor: '#e3f2fd', 
        color: '#1565c0',
        icon: '🔄' 
      },
      'active': { 
        backgroundColor: '#e8f5e8', 
        color: '#2e7d32',
        icon: '✅' 
      }
    };
    return styles[status] || { backgroundColor: '#f5f5f5', color: '#666', icon: '❓' };
  };

  const handleAccountClick = () => {
    console.log('点击账户信息');
    callAction({
      name: 'account_clicked',
      payload: {
        serviceTargetId,
        targetName,
        accountInfo
      }
    });
  };

  const handleTransactionClick = (transaction) => {
    console.log('点击交易记录:', transaction);
    callAction({
      name: 'transaction_clicked',
      payload: {
        transaction,
        serviceTargetId,
        targetName
      }
    });
  };

  // 详细的调试信息显示
  if (!accountData || Object.keys(accountData).length === 0 || !targetName) {
    return (
      <div style={{
        maxWidth: '600px',
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
          <div><strong>缓存数据:</strong></div>
          <pre>{JSON.stringify(cachedData, null, 2)}</pre>
        </div>
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '10px', fontFamily: 'monospace' }}>
          <div><strong>props 类型:</strong> {typeof props}</div>
          <div><strong>props 是否为数组:</strong> {Array.isArray(props).toString()}</div>
          <div><strong>数据已加载:</strong> {isDataLoaded.toString()}</div>
          <div><strong>来源:</strong> {cachedData?.fromCache ? '页面缓存' : '默认数据'}</div>
          <div><strong>accountData:</strong> {JSON.stringify(accountData)}</div>
        </div>
        <div style={{ textAlign: 'center', color: '#666', marginTop: '10px' }}>
          暂无补贴账户数据 - 尝试加载缓存数据中...
        </div>
      </div>
    );
  }

  const accountStatusStyle = getStatusStyle(accountInfo.accountStatus);

  return (
    <div style={{
      maxWidth: '600px',
      margin: '20px 0',
      background: 'linear-gradient(135deg, #fff8e1 0%, #f3e5f5 100%)',
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
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>💰</span>
          补贴账户查询
          <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '500',
            backgroundColor: accountStatusStyle.backgroundColor,
            color: accountStatusStyle.color
          }}>
            {accountStatusStyle.icon} 账户正常
          </span>
          {cachedData && cachedData.fromCache && (
            <span style={{
              padding: '2px 6px',
              borderRadius: '8px',
              fontSize: '10px',
              fontWeight: '500',
              backgroundColor: '#fff3cd',
              color: '#856404',
              border: '1px solid #ffeaa7',
              marginLeft: '8px'
            }}>
              📄 来自页面缓存
            </span>
          )}
          {cachedData && (
            <span style={{
              padding: '2px 6px',
              borderRadius: '8px',
              fontSize: '10px',
              fontWeight: '500',
              backgroundColor: '#e3f2fd',
              color: '#1565c0',
              border: '1px solid #90caf9',
              marginLeft: 'auto'
            }}>
              💾 已缓存
            </span>
          )}
        </h3>
      </div>

      {/* 卡片内容 */}
      <div style={{ padding: '20px' }}>
        {/* 服务对象信息 */}
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
            <span style={{ fontSize: '13px', color: '#666', minWidth: '70px' }}>服务对象:</span>
            <span style={{ fontSize: '13px', color: '#333', fontWeight: '500' }}>{targetName}</span>
            <span style={{ fontSize: '13px', color: '#666', minWidth: '70px' }}>编号:</span>
            <span style={{ fontSize: '13px', color: '#333', fontWeight: '500' }}>{serviceTargetId}</span>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', color: '#666', minWidth: '70px' }}>身份证:</span>
            <span style={{ fontSize: '13px', color: '#333', fontWeight: '500' }}>{idCard}</span>
          </div>
        </div>

        {/* 账户总览 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onClick={handleAccountClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
        }}
        >
          <h4 style={{
            margin: '0 0 16px 0',
            fontSize: '14px',
            color: '#333',
            fontWeight: '500'
          }}>账户概览</h4>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px'
          }}>
            {/* 当前余额 */}
            <div style={{
              textAlign: 'center',
              padding: '16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
              border: '2px solid #4caf50'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '4px',
                color: '#2e7d32'
              }}>
                ¥{accountInfo.currentBalance?.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) || '0.00'}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666'
              }}>当前余额</div>
            </div>

            {/* 累计补贴 */}
            <div style={{
              textAlign: 'center',
              padding: '16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              border: '2px solid #2196f3'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '4px',
                color: '#1565c0'
              }}>
                ¥{accountInfo.totalSubsidy?.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) || '0.00'}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666'
              }}>累计补贴</div>
            </div>

            {/* 累计消费 */}
            <div style={{
              textAlign: 'center',
              padding: '16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)',
              border: '2px solid #ff9800'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '4px',
                color: '#ef6c00'
              }}>
                ¥{accountInfo.totalConsumption?.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) || '0.00'}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666'
              }}>累计消费</div>
            </div>

            {/* 账户状态 */}
            <div style={{
              textAlign: 'center',
              padding: '16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
              border: '2px solid #9c27b0'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '4px',
                color: '#7b1fa2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}>
                <span>{accountStatusStyle.icon}</span>
                <span>正常</span>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666'
              }}>账户状态</div>
            </div>
          </div>

          <div style={{
            marginTop: '12px',
            fontSize: '11px',
            color: '#666',
            textAlign: 'center'
          }}>
            账户编号: {accountInfo.accountNumber}
          </div>
        </div>

        {/* 消费记录 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <h4 style={{
            margin: '0 0 16px 0',
            fontSize: '14px',
            color: '#333',
            fontWeight: '500'
          }}>
            消费记录 ({consumptionRecords.length}条)
            <span style={{
              fontSize: '12px',
              color: '#666',
              fontWeight: 'normal',
              marginLeft: '8px'
            }}>
              合计: ¥{consumptionRecords.reduce((sum, t) => sum + t.amount, 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </span>
          </h4>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {consumptionRecords.map((transaction, index) => {
              const typeStyle = getServiceTypeStyle(transaction.serviceType);
              const statusStyle = getStatusStyle(transaction.status);
              return (
                <div 
                  key={transaction.id}
                  onClick={() => handleTransactionClick(transaction)}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: '#f8f9fa',
                    borderLeft: `4px solid ${typeStyle.color}`,
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
                  {/* 第一行：服务类型和金额 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '16px' }}>{typeStyle.icon}</span>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#333'
                      }}>
                        {transaction.serviceType}
                      </span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: '500',
                        backgroundColor: statusStyle.backgroundColor,
                        color: statusStyle.color
                      }}>
                        {statusStyle.icon} {transaction.status === 'paid' ? '已支付' : 
                                              transaction.status === 'pending' ? '待支付' : 
                                              transaction.status === 'processing' ? '处理中' : '未知'}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#e74c3c'
                    }}>
                      -¥{transaction.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* 第二行：服务机构 */}
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '4px'
                  }}>
                    🏢 {transaction.provider}
                  </div>

                  {/* 第三行：服务描述 */}
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '8px'
                  }}>
                    📝 {transaction.description}
                  </div>

                  {/* 第四行：日期和编号 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#999'
                  }}>
                    <span>📅 {transaction.date}</span>
                    <span>#{transaction.id}</span>
                  </div>
                </div>
              );
            })}

            {consumptionRecords.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: '#666',
                padding: '20px',
                fontSize: '14px'
              }}>
                暂无消费记录
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}