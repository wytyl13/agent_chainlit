import { useState, useEffect } from 'react';

export default function SubsidyPackageCreateCard() {
  // props 是全局注入的，不需要作为参数传递
  console.log('=== SubsidyPackageCreateCard 调试信息 ===');
  console.log('全局 props:', props);
  console.log('props 类型:', typeof props);
  console.log('props 是否为数组:', Array.isArray(props));

  // 数据缓存状态管理
  const [cachedData, setCachedData] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [packageData, setPackageData] = useState({});
  const [formStatus, setFormStatus] = useState('editing'); // editing, validating, creating, success, error
  const [selectedServices, setSelectedServices] = useState([]);

  // 数据加载和缓存逻辑
  useEffect(() => {
    // 尝试获取套餐创建数据
    let createData = {};
    
    if (Array.isArray(props) && props.length > 0) {
      // 如果 props 是数组，取第一个元素
      createData = props[0];
    } else if (props && typeof props === 'object' && !Array.isArray(props)) {
      // 如果 props 是对象
      if (props.data && Array.isArray(props.data) && props.data.length > 0) {
        // 如果有 data 数组，取第一个
        createData = props.data[0];
      } else if (props.packageInfo || props.projectId) {
        // 如果 props 直接包含套餐或项目信息
        createData = props;
      }
    }

    console.log('最终处理的 createData:', createData);

    // 如果有新数据，更新缓存
    if (createData && Object.keys(createData).length > 0) {
      setCachedData(createData);
      setIsDataLoaded(true);
      if (createData.packageInfo) {
        setPackageData(createData.packageInfo);
      }
    } else if (!isDataLoaded) {
      // 如果没有新数据且未加载过，使用默认数据
      const defaultData = {
        projectId: 'PRJ2024001',
        projectName: '2024年东部城区社区养老上门服务采购',
        packageInfo: {
          packageName: '',
          packageDescription: '',
          targetAgeGroup: '60岁以上',
          validityPeriod: '12个月',
          totalSubsidyAmount: 3000.00,
          personalPaymentRatio: 20,
          maxUsagePerMonth: 8,
          availableServices: [],
          regions: ['东部城区朝阳街道甲社区', '东部城区朝阳街道乙社区']
        },
        availableServiceTypes: [
          {
            id: 'bath',
            name: '上门助浴',
            icon: '🛁',
            unitPrice: 60.00,
            subsidyRatio: 80,
            description: '专业护理员上门提供助浴服务',
            frequency: ['每周1次', '每周2次', '每周3次']
          },
          {
            id: 'health',
            name: '健康体检',
            icon: '🏥',
            unitPrice: 320.00,
            subsidyRatio: 90,
            description: '社区卫生院提供全面健康体检',
            frequency: ['每月1次', '每季度1次', '每半年1次']
          },
          {
            id: 'care',
            name: '生活照料',
            icon: '🏠',
            unitPrice: 45.00,
            subsidyRatio: 75,
            description: '专业护工提供日常生活照料',
            frequency: ['每周2次', '每周3次', '每周5次']
          },
          {
            id: 'nursing',
            name: '康复护理',
            icon: '💊',
            unitPrice: 95.00,
            subsidyRatio: 85,
            description: '专业康复师提供康复护理服务',
            frequency: ['每周1次', '每周2次', '每月4次']
          }
        ],
        createdPackages: [
          {
            id: 'PKG001',
            name: '基础养老服务套餐',
            status: 'active',
            subscribers: 25
          },
          {
            id: 'PKG002', 
            name: '高级康养套餐',
            status: 'active',
            subscribers: 18
          }
        ],
        lastUpdated: new Date().toISOString()
      };
      setCachedData(defaultData);
      setPackageData(defaultData.packageInfo);
      setIsDataLoaded(true);
    }
  }, [props, isDataLoaded]);

  // 使用缓存数据或默认数据
  const createData = cachedData || {};

  // 解构数据，提供默认值
  const {
    projectId = 'PRJ2024001',
    projectName = '2024年东部城区社区养老上门服务采购',
    availableServiceTypes = [],
    createdPackages = [],
    lastUpdated = ''
  } = createData;

  // 实时计算套餐预估费用
  const calculatePackageCost = () => {
    let totalCost = 0;
    selectedServices.forEach(service => {
      const serviceType = availableServiceTypes.find(type => type.id === service.id);
      if (serviceType && service.frequency) {
        const monthlyTimes = getMonthlyTimes(service.frequency);
        totalCost += serviceType.unitPrice * monthlyTimes;
      }
    });
    return totalCost;
  };

  // 获取月度次数
  const getMonthlyTimes = (frequency) => {
    if (frequency.includes('每周')) {
      const times = parseInt(frequency.match(/\d+/)[0]);
      return times * 4; // 每月按4周计算
    } else if (frequency.includes('每月')) {
      return parseInt(frequency.match(/\d+/)[0]);
    } else if (frequency.includes('每季度')) {
      return parseInt(frequency.match(/\d+/)[0]) / 3;
    } else if (frequency.includes('每半年')) {
      return parseInt(frequency.match(/\d+/)[0]) / 6;
    }
    return 0;
  };

  console.log('解构后的数据:', { projectId, projectName, packageData });
  console.log('缓存数据:', cachedData);
  console.log('选中服务:', selectedServices);
  console.log('预估费用:', calculatePackageCost());

  // 获取服务类型样式
  const getServiceTypeStyle = (type) => {
    const styles = {
      'bath': { 
        backgroundColor: '#e3f2fd', 
        color: '#1565c0',
        icon: '🛁' 
      },
      'health': { 
        backgroundColor: '#e8f5e8', 
        color: '#2e7d32',
        icon: '🏥' 
      },
      'care': { 
        backgroundColor: '#fff3e0', 
        color: '#ef6c00',
        icon: '🏠' 
      },
      'nursing': { 
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
      'editing': { 
        backgroundColor: '#e3f2fd', 
        color: '#1565c0',
        icon: '✏️' 
      },
      'validating': { 
        backgroundColor: '#fff3e0', 
        color: '#ef6c00',
        icon: '🔍' 
      },
      'creating': { 
        backgroundColor: '#f3e5f5', 
        color: '#7b1fa2',
        icon: '⚙️' 
      },
      'success': { 
        backgroundColor: '#e8f5e8', 
        color: '#2e7d32',
        icon: '✅' 
      },
      'error': { 
        backgroundColor: '#ffebee', 
        color: '#c62828',
        icon: '❌' 
      }
    };
    return styles[status] || { backgroundColor: '#f5f5f5', color: '#666', icon: '❓' };
  };

  const handleFieldUpdate = (field, value) => {
    console.log('更新字段:', field, value);
    
    const updatedData = { ...packageData, [field]: value };
    setPackageData(updatedData);

    // 更新缓存数据
    setCachedData(prev => ({
      ...prev,
      packageInfo: updatedData,
      lastModified: new Date().toISOString()
    }));

    // 使用 Chainlit 提供的 callAction API
    callAction({
      name: 'field_updated',
      payload: {
        field,
        value,
        packageData: updatedData,
        projectId
      }
    });
  };

  const handleServiceToggle = (serviceType) => {
    console.log('切换服务:', serviceType);
    
    const existingIndex = selectedServices.findIndex(s => s.id === serviceType.id);
    let updated = [...selectedServices];
    
    if (existingIndex >= 0) {
      // 移除服务
      updated.splice(existingIndex, 1);
    } else {
      // 添加服务
      updated.push({
        id: serviceType.id,
        name: serviceType.name,
        frequency: serviceType.frequency[0], // 默认选择第一个频次
        subsidyRatio: serviceType.subsidyRatio
      });
    }
    
    setSelectedServices(updated);

    // 更新缓存中的服务列表
    setCachedData(prev => ({
      ...prev,
      packageInfo: {
        ...prev.packageInfo,
        availableServices: updated
      },
      lastModified: new Date().toISOString()
    }));

    callAction({
      name: 'service_toggled',
      payload: {
        serviceType,
        selectedServices: updated,
        projectId
      }
    });
  };

  const handleFrequencyChange = (serviceId, frequency) => {
    console.log('更改频次:', serviceId, frequency);
    
    const updated = selectedServices.map(service => 
      service.id === serviceId ? { ...service, frequency } : service
    );
    setSelectedServices(updated);

    // 更新缓存
    setCachedData(prev => ({
      ...prev,
      packageInfo: {
        ...prev.packageInfo,
        availableServices: updated
      },
      lastModified: new Date().toISOString()
    }));
  };

  const handleValidatePackage = () => {
    console.log('验证套餐');
    setFormStatus('validating');
    
    // 模拟验证过程
    setTimeout(() => {
      const isValid = packageData.packageName && selectedServices.length > 0;
      setFormStatus(isValid ? 'editing' : 'error');
      
      if (!isValid) {
        setCachedData(prev => ({
          ...prev,
          validationErrors: ['套餐名称不能为空', '至少选择一项服务'],
          lastValidated: new Date().toISOString()
        }));
      }
    }, 1500);

    callAction({
      name: 'validate_package',
      payload: {
        packageData,
        selectedServices,
        projectId
      }
    });
  };

  const handleCreatePackage = () => {
    console.log('创建套餐');
    setFormStatus('creating');

    const newPackage = {
      id: 'PKG' + Date.now(),
      name: packageData.packageName,
      description: packageData.packageDescription,
      services: selectedServices,
      totalCost: calculatePackageCost(),
      subsidyAmount: packageData.totalSubsidyAmount,
      createdAt: new Date().toISOString()
    };

    // 更新缓存数据
    setCachedData(prev => ({
      ...prev,
      createdPackages: [...(prev.createdPackages || []), newPackage],
      lastCreated: newPackage,
      lastUpdated: new Date().toISOString()
    }));

    // 模拟创建过程
    setTimeout(() => {
      setFormStatus('success');
    }, 2000);

    callAction({
      name: 'create_package',
      payload: {
        packageData,
        selectedServices,
        newPackage,
        projectId
      }
    });
  };

  const handlePreviewPackage = () => {
    console.log('预览套餐');
    callAction({
      name: 'preview_package',
      payload: {
        packageData,
        selectedServices,
        estimatedCost: calculatePackageCost(),
        projectId
      }
    });
  };

  // 详细的调试信息显示
  if (!createData || Object.keys(createData).length === 0 || !projectName) {
    return (
      <div style={{
        maxWidth: '700px',
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
          <div><strong>createData:</strong> {JSON.stringify(createData)}</div>
        </div>
        <div style={{ textAlign: 'center', color: '#666', marginTop: '10px' }}>
          暂无套餐创建数据 - 尝试加载缓存数据中...
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyle(formStatus);
  const estimatedCost = calculatePackageCost();
  const subsidyAmount = packageData.totalSubsidyAmount || 3000;
  const personalPayment = estimatedCost * (packageData.personalPaymentRatio || 20) / 100;

  return (
    <div style={{
      maxWidth: '700px',
      margin: '20px 0',
      background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
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
          <span>📦</span>
          补贴套餐创建
          <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '500',
            backgroundColor: statusStyle.backgroundColor,
            color: statusStyle.color
          }}>
            {statusStyle.icon} {formStatus === 'editing' ? '编辑中' : 
                               formStatus === 'validating' ? '验证中' :
                               formStatus === 'creating' ? '创建中' :
                               formStatus === 'success' ? '已完成' : '错误'}
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

        {/* 套餐基本信息 */}
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
          }}>套餐基本信息</h4>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* 套餐名称 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#666',
                marginBottom: '4px'
              }}>套餐名称 *</label>
              <input
                type="text"
                value={packageData.packageName || ''}
                onChange={(e) => handleFieldUpdate('packageName', e.target.value)}
                placeholder="请输入套餐名称"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            {/* 套餐描述 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#666',
                marginBottom: '4px'
              }}>套餐描述</label>
              <textarea
                value={packageData.packageDescription || ''}
                onChange={(e) => handleFieldUpdate('packageDescription', e.target.value)}
                placeholder="请输入套餐描述"
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* 基本设置行 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              {/* 适用年龄 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '4px'
                }}>适用年龄</label>
                <select
                  value={packageData.targetAgeGroup || '60岁以上'}
                  onChange={(e) => handleFieldUpdate('targetAgeGroup', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none',
                    background: 'white'
                  }}
                >
                  <option value="60岁以上">60岁以上</option>
                  <option value="65岁以上">65岁以上</option>
                  <option value="70岁以上">70岁以上</option>
                  <option value="80岁以上">80岁以上</option>
                </select>
              </div>

              {/* 有效期 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '4px'
                }}>有效期</label>
                <select
                  value={packageData.validityPeriod || '12个月'}
                  onChange={(e) => handleFieldUpdate('validityPeriod', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none',
                    background: 'white'
                  }}
                >
                  <option value="6个月">6个月</option>
                  <option value="12个月">12个月</option>
                  <option value="24个月">24个月</option>
                  <option value="36个月">36个月</option>
                </select>
              </div>
            </div>

            {/* 补贴金额和个人承担比例 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '4px'
                }}>总补贴金额 (元)</label>
                <input
                  type="number"
                  value={packageData.totalSubsidyAmount || 3000}
                  onChange={(e) => handleFieldUpdate('totalSubsidyAmount', parseFloat(e.target.value))}
                  min="0"
                  step="100"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '4px'
                }}>个人承担比例 (%)</label>
                <input
                  type="number"
                  value={packageData.personalPaymentRatio || 20}
                  onChange={(e) => handleFieldUpdate('personalPaymentRatio', parseInt(e.target.value))}
                  min="0"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 服务类型选择 */}
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
            服务类型选择 *
            <span style={{
              fontSize: '12px',
              color: '#666',
              fontWeight: 'normal',
              marginLeft: '8px'
            }}>
              已选择 {selectedServices.length} 项服务
            </span>
          </h4>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {availableServiceTypes.map((serviceType, index) => {
              const isSelected = selectedServices.some(s => s.id === serviceType.id);
              const selectedService = selectedServices.find(s => s.id === serviceType.id);
              const typeStyle = getServiceTypeStyle(serviceType.id);
              
              return (
                <div 
                  key={serviceType.id}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: isSelected ? typeStyle.backgroundColor : '#f8f9fa',
                    border: isSelected ? `2px solid ${typeStyle.color}` : '1px solid #ddd',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => handleServiceToggle(serviceType)}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: isSelected ? '12px' : '0'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span style={{ fontSize: '16px' }}>{serviceType.icon}</span>
                      <div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: isSelected ? typeStyle.color : '#333'
                        }}>
                          {serviceType.name}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#666'
                        }}>
                          {serviceType.description}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        textAlign: 'right',
                        fontSize: '12px'
                      }}>
                        <div style={{
                          color: '#333',
                          fontWeight: '500'
                        }}>
                          ¥{serviceType.unitPrice}/次
                        </div>
                        <div style={{
                          color: '#666'
                        }}>
                          补贴{serviceType.subsidyRatio}%
                        </div>
                      </div>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: isSelected ? typeStyle.color : '#ddd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px'
                      }}>
                        {isSelected ? '✓' : ''}
                      </div>
                    </div>
                  </div>

                  {/* 频次选择 */}
                  {isSelected && (
                    <div style={{
                      paddingTop: '12px',
                      borderTop: `1px solid ${typeStyle.color}30`
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        color: '#666',
                        marginBottom: '8px'
                      }}>
                        服务频次:
                      </label>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        {serviceType.frequency.map(freq => (
                          <button
                            key={freq}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFrequencyChange(serviceType.id, freq);
                            }}
                            style={{
                              padding: '4px 12px',
                              border: selectedService?.frequency === freq ? 
                                `2px solid ${typeStyle.color}` : '1px solid #ddd',
                              borderRadius: '16px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              background: selectedService?.frequency === freq ? 
                                typeStyle.color : 'white',
                              color: selectedService?.frequency === freq ? 
                                'white' : '#666',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {freq}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 费用预估 */}
        {selectedServices.length > 0 && (
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
            }}>费用预估</h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '12px',
                borderRadius: '8px',
                background: '#e3f2fd'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1565c0',
                  marginBottom: '4px'
                }}>
                  ¥{estimatedCost.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#666'
                }}>月度总费用</div>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '12px',
                borderRadius: '8px',
                background: '#e8f5e8'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#2e7d32',
                  marginBottom: '4px'
                }}>
                  ¥{(subsidyAmount / 12).toFixed(2)}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#666'
                }}>月度补贴</div>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '12px',
                borderRadius: '8px',
                background: '#fff3e0'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#ef6c00',
                  marginBottom: '4px'
                }}>
                  ¥{personalPayment.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#666'
                }}>个人承担</div>
              </div>
            </div>

            {/* 服务明细 */}
            <div style={{
              fontSize: '12px',
              color: '#666'
            }}>
              <strong>服务明细:</strong>
              <div style={{ marginTop: '8px' }}>
                {selectedServices.map((service, index) => {
                  const serviceType = availableServiceTypes.find(type => type.id === service.id);
                  const monthlyTimes = getMonthlyTimes(service.frequency);
                  const monthlyCost = serviceType.unitPrice * monthlyTimes;
                  return (
                    <div key={service.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '4px 0'
                    }}>
                      <span>{service.name} ({service.frequency})</span>
                      <span>¥{monthlyCost.toFixed(2)}/月</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 成功状态显示 */}
        {formStatus === 'success' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            borderLeft: '4px solid #4caf50'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>✅</span>
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#2e7d32'
              }}>
                套餐创建成功！
              </span>
            </div>
            <div style={{
              fontSize: '12px',
              color: '#666'
            }}>
              套餐 "{packageData.packageName}" 已成功创建，套餐ID: {cachedData?.lastCreated?.id}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={handleValidatePackage}
            disabled={formStatus === 'validating' || formStatus === 'creating'}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: formStatus === 'validating' ? 
                'linear-gradient(135deg, #ccc 0%, #999 100%)' :
                'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: formStatus === 'validating' ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (formStatus !== 'validating' && formStatus !== 'creating') {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (formStatus !== 'validating' && formStatus !== 'creating') {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {formStatus === 'validating' ? '🔍 验证中...' : '🔍 验证套餐'}
          </button>

          <button
            onClick={handlePreviewPackage}
            disabled={formStatus === 'creating' || selectedServices.length === 0}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: selectedServices.length === 0 ? 
                'linear-gradient(135deg, #ccc 0%, #999 100%)' :
                'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: selectedServices.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (selectedServices.length > 0 && formStatus !== 'creating') {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(108, 92, 231, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedServices.length > 0 && formStatus !== 'creating') {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            👁️ 预览套餐
          </button>

          <button
            onClick={handleCreatePackage}
            disabled={formStatus === 'creating' || !packageData.packageName || selectedServices.length === 0}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: (formStatus === 'creating' || !packageData.packageName || selectedServices.length === 0) ? 
                'linear-gradient(135deg, #ccc 0%, #999 100%)' :
                'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: (formStatus === 'creating' || !packageData.packageName || selectedServices.length === 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (formStatus !== 'creating' && packageData.packageName && selectedServices.length > 0) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (formStatus !== 'creating' && packageData.packageName && selectedServices.length > 0) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {formStatus === 'creating' ? '⚙️ 创建中...' : '🚀 创建套餐'}
          </button>
        </div>
      </div>
    </div>
  );