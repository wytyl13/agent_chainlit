import { useState, useEffect } from 'react';

export default function ServiceTargetListCard() {
  // props 是全局注入的，不需要作为参数传递
  console.log('=== ServiceTargetListCard 调试信息 ===');
  console.log('全局 props:', props);
  console.log('props 类型:', typeof props);
  console.log('props 是否为数组:', Array.isArray(props));

  // 数据缓存状态管理
  const [cachedData, setCachedData] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, 助浴, 体检, 照料, 护理
  const [sortBy, setSortBy] = useState('name'); // name, age, community, serviceType

  // 数据加载和缓存逻辑
  useEffect(() => {
    // 尝试获取服务对象列表数据
    let listData = {};
    
    if (Array.isArray(props) && props.length > 0) {
      // 如果 props 是数组，取第一个元素
      listData = props[0];
    } else if (props && typeof props === 'object' && !Array.isArray(props)) {
      // 如果 props 是对象
      if (props.data && Array.isArray(props.data) && props.data.length > 0) {
        // 如果有 data 数组，取第一个
        listData = props.data[0];
      } else if (props.projectId || props.projectName) {
        // 如果 props 直接包含项目信息
        listData = props;
      }
    }

    console.log('最终处理的 listData:', listData);

    // 如果有新数据，更新缓存
    if (listData && Object.keys(listData).length > 0) {
      setCachedData(listData);
      setIsDataLoaded(true);
    } else if (!isDataLoaded) {
      // 如果没有新数据且未加载过，使用默认数据
      const defaultData = {
        projectId: 'PRJ2024001',
        projectName: '2024年东部城区社区养老上门服务采购',
        totalCount: 8,
        activeCount: 7,
        serviceTargets: [
          {
            id: 'ST2024001',
            name: '王秀英',
            idCard: '1101051958XXXXXX',
            age: 66,
            community: '东部城区朝阳街道甲社区',
            serviceNeeds: '每周3次上门助浴 + 每月1次健康体检',
            phone: '138****5678',
            status: 'active',
            addedDate: '2024-01-15',
            emergencyContact: '王小明(儿子) 136****1234'
          },
          {
            id: 'ST2024002',
            name: '李大爷',
            idCard: '1101051955XXXXXX',
            age: 69,
            community: '东部城区朝阳街道乙社区',
            serviceNeeds: '每周2次生活照料 + 每月1次健康体检',
            phone: '139****9876',
            status: 'active',
            addedDate: '2024-01-16',
            emergencyContact: '李小华(女儿) 137****5678'
          },
          {
            id: 'ST2024003',
            name: '张奶奶',
            idCard: '1101051960XXXXXX',
            age: 64,
            community: '东部城区朝阳街道甲社区',
            serviceNeeds: '每周1次上门助浴 + 每周2次康复护理',
            phone: '135****1234',
            status: 'active',
            addedDate: '2024-01-17',
            emergencyContact: '张明(儿子) 138****9999'
          },
          {
            id: 'ST2024004',
            name: '刘师傅',
            idCard: '1101051952XXXXXX',
            age: 72,
            community: '东部城区朝阳街道丙社区',
            serviceNeeds: '每周3次生活照料',
            phone: '136****5555',
            status: 'active',
            addedDate: '2024-01-18',
            emergencyContact: '刘芳(女儿) 139****3333'
          },
          {
            id: 'ST2024005',
            name: '陈大娘',
            idCard: '1101051957XXXXXX',
            age: 67,
            community: '东部城区朝阳街道乙社区',
            serviceNeeds: '每月2次健康体检',
            phone: '137****7777',
            status: 'active',
            addedDate: '2024-01-19',
            emergencyContact: '陈伟(儿子) 135****8888'
          },
          {
            id: 'ST2024006',
            name: '马老太',
            idCard: '1101051959XXXXXX',
            age: 65,
            community: '东部城区朝阳街道甲社区',
            serviceNeeds: '每周2次上门助浴 + 每周1次生活照料',
            phone: '138****2222',
            status: 'active',
            addedDate: '2024-01-20',
            emergencyContact: '马强(儿子) 139****4444'
          },
          {
            id: 'ST2024007',
            name: '孙大叔',
            idCard: '1101051953XXXXXX',
            age: 71,
            community: '东部城区朝阳街道丁社区',
            serviceNeeds: '每周1次康复护理 + 每月1次健康体检',
            phone: '139****6666',
            status: 'active',
            addedDate: '2024-01-21',
            emergencyContact: '孙丽(女儿) 137****1111'
          },
          {
            id: 'ST2024008',
            name: '赵老师',
            idCard: '1101051956XXXXXX',
            age: 68,
            community: '东部城区朝阳街道乙社区',
            serviceNeeds: '每周1次上门助浴',
            phone: '135****9999',
            status: 'inactive',
            addedDate: '2024-01-22',
            emergencyContact: '赵军(儿子) 138****7777'
          }
        ],
        stats: {
          助浴: 5,
          体检: 4,
          照料: 3,
          护理: 2
        },
        lastUpdated: new Date().toISOString()
      };
      setCachedData(defaultData);
      setIsDataLoaded(true);
    }
  }, [props, isDataLoaded]);

  // 使用缓存数据或默认数据
  const listData = cachedData || {};

  // 解构数据，提供默认值
  const {
    projectId = 'PRJ2024001',
    projectName = '2024年东部城区社区养老上门服务采购',
    totalCount = 0,
    activeCount = 0,
    serviceTargets = [],
    stats = {},
    lastUpdated = ''
  } = listData;

  // 数据筛选和排序逻辑
  useEffect(() => {
    let filtered = [...serviceTargets];

    // 搜索筛选
    if (searchTerm) {
      filtered = filtered.filter(target => 
        target.name.includes(searchTerm) ||
        target.community.includes(searchTerm) ||
        target.serviceNeeds.includes(searchTerm)
      );
    }

    // 服务类型筛选
    if (filterType !== 'all') {
      filtered = filtered.filter(target => 
        target.serviceNeeds.includes(filterType)
      );
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'age':
          return b.age - a.age;
        case 'community':
          return a.community.localeCompare(b.community);
        case 'addedDate':
          return new Date(b.addedDate) - new Date(a.addedDate);
        default:
          return 0;
      }
    });

    setFilteredData(filtered);

    // 更新缓存的筛选状态
    setCachedData(prev => ({
      ...prev,
      filterState: {
        searchTerm,
        filterType,
        sortBy,
        filteredCount: filtered.length
      },
      lastFiltered: new Date().toISOString()
    }));

  }, [serviceTargets, searchTerm, filterType, sortBy]);

  console.log('解构后的数据:', { projectId, projectName, totalCount, activeCount, serviceTargets });
  console.log('缓存数据:', cachedData);
  console.log('筛选后数据:', filteredData);

  // 获取服务类型样式
  const getServiceTypeStyle = (type) => {
    const styles = {
      '助浴': { 
        backgroundColor: '#e3f2fd', 
        color: '#1565c0',
        icon: '🛁' 
      },
      '体检': { 
        backgroundColor: '#e8f5e8', 
        color: '#2e7d32',
        icon: '🏥' 
      },
      '照料': { 
        backgroundColor: '#fff3e0', 
        color: '#ef6c00',
        icon: '🏠' 
      },
      '护理': { 
        backgroundColor: '#f3e5f5', 
        color: '#7b1fa2',
        icon: '💊' 
      }
    };
    return styles[type] || { backgroundColor: '#f5f5f5', color: '#666', icon: '📋' };
  };

  // 解析服务需求
  const parseServiceNeeds = (needs) => {
    if (!needs) return [];
    const parts = needs.split(' + ');
    return parts.map(part => {
      if (part.includes('助浴')) return { type: '助浴', detail: part };
      if (part.includes('体检')) return { type: '体检', detail: part };
      if (part.includes('照料')) return { type: '照料', detail: part };
      if (part.includes('护理')) return { type: '护理', detail: part };
      return { type: '其他', detail: part };
    });
  };

  const handleTargetClick = (target) => {
    console.log('点击服务对象:', target);
    // 使用 Chainlit 提供的 callAction API
    callAction({
      name: 'target_clicked',
      payload: {
        target,
        projectId,
        projectName
      }
    });
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
    console.log('搜索词变更:', term);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    console.log('筛选类型变更:', type);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    console.log('排序方式变更:', sort);
  };

  const handleAddNew = () => {
    console.log('添加新服务对象');
    callAction({
      name: 'add_new_target',
      payload: {
        projectId,
        projectName,
        currentCount: totalCount
      }
    });
  };

  const handleStatsClick = (statType, count) => {
    console.log('点击统计:', statType, count);
    setFilterType(statType === '全部' ? 'all' : statType);
    callAction({
      name: 'stats_clicked',
      payload: {
        statType,
        count,
        projectId
      }
    });
  };

  // 详细的调试信息显示
  if (!listData || Object.keys(listData).length === 0 || !projectName) {
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
          <div><strong>listData:</strong> {JSON.stringify(listData)}</div>
        </div>
        <div style={{ textAlign: 'center', color: '#666', marginTop: '10px' }}>
          暂无服务对象列表数据 - 尝试加载缓存数据中...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '20px 0',
      background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
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
          <span>👥</span>
          服务对象列表
          <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '500',
            backgroundColor: '#e8f5e8',
            color: '#2e7d32'
          }}>
            {activeCount}/{totalCount} 活跃
          </span>
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
        {/* 项目信息 */}
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
            <span style={{ fontSize: '13px', color: '#666', minWidth: '70px' }}>项目编号:</span>
            <span style={{ fontSize: '13px', color: '#333', fontWeight: '500' }}>{projectId}</span>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <span style={{ fontSize: '13px', color: '#666', minWidth: '70px' }}>项目名称:</span>
            <span style={{ fontSize: '13px', color: '#333', fontWeight: '500', lineHeight: '1.4' }}>{projectName}</span>
          </div>
        </div>

        {/* 统计信息 */}
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
          }}>服务类型统计</h4>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div 
              style={{
                flex: '1',
                minWidth: '80px',
                textAlign: 'center',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                background: filterType === 'all' ? '#e3f2fd' : '#f8f9fa',
                border: filterType === 'all' ? '2px solid #1565c0' : '1px solid #ddd'
              }}
              onClick={() => handleStatsClick('全部', totalCount)}
            >
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '4px',
                color: '#333'
              }}>
                {totalCount}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#666'
              }}>全部</div>
            </div>
            {Object.entries(stats).map(([type, count]) => {
              const typeStyle = getServiceTypeStyle(type);
              const isActive = filterType === type;
              return (
                <div 
                  key={type}
                  style={{
                    flex: '1',
                    minWidth: '80px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    background: isActive ? typeStyle.backgroundColor : '#f8f9fa',
                    border: isActive ? `2px solid ${typeStyle.color}` : '1px solid #ddd'
                  }}
                  onClick={() => handleStatsClick(type, count)}
                >
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    color: isActive ? typeStyle.color : '#333'
                  }}>
                    {count}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px'
                  }}>
                    <span>{typeStyle.icon}</span>
                    <span>{type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>



        {/* 服务对象列表 */}
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
          }}>
            服务对象详情 ({filteredData.length})
          </h4>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {filteredData.map((target, index) => {
              const parsedNeeds = parseServiceNeeds(target.serviceNeeds);
              return (
                <div 
                  key={target.id}
                  onClick={() => handleTargetClick(target)}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: '#f8f9fa',
                    borderLeft: `4px solid ${target.status === 'active' ? '#28a745' : '#dc3545'}`,
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
                  {/* 基本信息行 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#333'
                      }}>
                        {target.name}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        {target.age}岁
                      </span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: '500',
                        backgroundColor: target.status === 'active' ? '#e8f5e8' : '#ffebee',
                        color: target.status === 'active' ? '#2e7d32' : '#c62828'
                      }}>
                        {target.status === 'active' ? '活跃' : '暂停'}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      color: '#666'
                    }}>
                      {target.id}
                    </span>
                  </div>

                  {/* 社区信息 */}
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>🏘️</span>
                    <span>{target.community}</span>
                  </div>

                  {/* 服务需求标签 */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginBottom: '8px'
                  }}>
                    {parsedNeeds.map((need, needIndex) => {
                      const typeStyle = getServiceTypeStyle(need.type);
                      return (
                        <span
                          key={needIndex}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: '500',
                            backgroundColor: typeStyle.backgroundColor,
                            color: typeStyle.color,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          <span>{typeStyle.icon}</span>
                          <span>{need.type}</span>
                        </span>
                      );
                    })}
                  </div>

                  {/* 联系信息 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#666'
                  }}>
                    <span>📞 {target.phone}</span>
                    <span>📅 {target.addedDate}</span>
                  </div>
                </div>
              );
            })}

            {filteredData.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: '#666',
                padding: '20px',
                fontSize: '14px'
              }}>
                {searchTerm || filterType !== 'all' ? 
                  '没有找到符合条件的服务对象' : 
                  '暂无服务对象数据'
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}