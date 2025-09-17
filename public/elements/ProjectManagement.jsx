export default function ProjectAdminCard() {
  // props 是全局注入的，不需要作为参数传递
  console.log('=== ProjectAdminCard 调试信息 ===');
  console.log('全局 props:', props);
  console.log('props 类型:', typeof props);
  
  // 使用 React hooks 管理状态
  const [selectedProject, setSelectedProject] = React.useState('');
  const [selectedUser, setSelectedUser] = React.useState('');
  const [selectedPermission, setSelectedPermission] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [notification, setNotification] = React.useState('');

  // 模拟数据
  const projects = [
    { id: 'proj_001', name: '2024 年东部城区社区养老上门服务采购' },
    { id: 'proj_002', name: '2024 年西部城区居家护理服务采购' },
    { id: 'proj_003', name: '2024 年南部城区康复护理项目' }
  ];

  const users = [
    { 
      id: 'user_001', 
      name: '张晓明', 
      role: '监管员',
      department: '社会保障局',
      status: '在职'
    },
    { 
      id: 'user_002', 
      name: '李小红', 
      role: '普通用户',
      department: '民政局',
      status: '在职'
    },
    { 
      id: 'user_003', 
      name: '王建国', 
      role: '监管员',
      department: '财政局',
      status: '在职'
    }
  ];

  const permissions = [
    { 
      id: 'full', 
      name: '全权限', 
      description: '可查看项目数据、编辑补贴规则、导出统计报表',
      color: '#4caf50'
    },
    { 
      id: 'view', 
      name: '查看权限', 
      description: '仅可查看项目数据和基础统计',
      color: '#2196f3'
    },
    { 
      id: 'limited', 
      name: '有限权限', 
      description: '可查看数据、导出报表，不可编辑规则',
      color: '#ff9800'
    }
  ];

  // 检查用户是否有监管员权限
  const canBeAdmin = (user) => {
    return user.role === '监管员' && user.status === '在职';
  };

  // 处理提交
  const handleSubmit = async () => {
    if (!selectedProject || !selectedUser || !selectedPermission) {
      alert('请完成所有必填项的选择');
      return;
    }

    const user = users.find(u => u.id === selectedUser);
    const project = projects.find(p => p.id === selectedProject);
    const permission = permissions.find(p => p.id === selectedPermission);

    if (!canBeAdmin(user)) {
      alert('所选用户不具备监管员权限，无法设置为项目管理员');
      return;
    }

    setIsSubmitting(true);

    try {
      // 模拟提交延迟
      await new Promise(resolve => setTimeout(resolve, 1500));

      const message = `${user.name}已被指定为'${project.name}'项目管理员，登录系统即可查看项目详情`;
      setNotification(message);
      setShowSuccess(true);

      // 使用 Chainlit 提供的 callAction API
      callAction({
        name: 'admin_assigned',
        payload: {
          projectId: selectedProject,
          projectName: project.name,
          userId: selectedUser,
          userName: user.name,
          permission: selectedPermission,
          permissionName: permission.name,
          notification: message
        }
      });

      // 3秒后隐藏成功消息
      setTimeout(() => {
        setShowSuccess(false);
        // 重置表单
        setSelectedProject('');
        setSelectedUser('');
        setSelectedPermission('');
      }, 3000);

    } catch (error) {
      console.error('提交失败:', error);
      alert('设置失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 如果显示成功消息
  if (showSuccess) {
    return (
      <div style={{
        maxWidth: '500px',
        margin: '20px 0',
        background: 'linear-gradient(135deg, #e8f5e8 0%, #f0fff0 100%)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* 成功状态头部 */}
        <div style={{
          background: '#4caf50',
          padding: '16px 20px',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '500'
          }}>
            项目管理员设置成功
          </h3>
        </div>

        {/* 成功消息 */}
        <div style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#333',
              lineHeight: '1.6'
            }}>
              {notification}
            </div>
          </div>
          
          <div style={{
            fontSize: '12px',
            color: '#666'
          }}>
            系统将自动返回设置页面...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '500px',
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
          fontSize: '16px',
          color: '#333',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '20px' }}>👨‍💼</span>
          项目管理员设置
        </h3>
      </div>

      {/* 卡片内容 */}
      <div style={{ padding: '20px' }}>
        {/* 项目选择 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            color: '#333',
            fontWeight: '500',
            marginBottom: '8px'
          }}>
            选择项目 <span style={{ color: '#f44336' }}>*</span>
          </label>
          <select 
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #e0e0e0',
              fontSize: '14px',
              backgroundColor: 'white',
              cursor: 'pointer',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2196f3'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          >
            <option value="">请选择项目</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* 用户选择 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            color: '#333',
            fontWeight: '500',
            marginBottom: '8px'
          }}>
            选择管理员 <span style={{ color: '#f44336' }}>*</span>
          </label>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
            仅显示具备"监管员"角色权限的用户
          </div>
          
          {users.filter(canBeAdmin).map(user => (
            <div 
              key={user.id}
              onClick={() => setSelectedUser(user.id)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: selectedUser === user.id ? '2px solid #2196f3' : '2px solid #e0e0e0',
                marginBottom: '8px',
                cursor: 'pointer',
                backgroundColor: selectedUser === user.id ? '#e3f2fd' : 'white',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  {user.name}
                </span>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500',
                  backgroundColor: '#4caf50',
                  color: 'white'
                }}>
                  {user.role}
                </span>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666'
              }}>
                {user.department} · {user.status}
              </div>
            </div>
          ))}
        </div>

        {/* 权限设置 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            color: '#333',
            fontWeight: '500',
            marginBottom: '12px'
          }}>
            管理权限 <span style={{ color: '#f44336' }}>*</span>
          </label>
          
          {permissions.map(permission => (
            <div 
              key={permission.id}
              onClick={() => setSelectedPermission(permission.id)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: selectedPermission === permission.id ? `2px solid ${permission.color}` : '2px solid #e0e0e0',
                marginBottom: '8px',
                cursor: 'pointer',
                backgroundColor: selectedPermission === permission.id ? `${permission.color}15` : 'white',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  {permission.name}
                </span>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: permission.color,
                  opacity: selectedPermission === permission.id ? 1 : 0.3
                }} />
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                lineHeight: '1.4'
              }}>
                {permission.description}
              </div>
            </div>
          ))}
        </div>

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={!selectedProject || !selectedUser || !selectedPermission || isSubmitting}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: (!selectedProject || !selectedUser || !selectedPermission || isSubmitting) ? '#ccc' : '#2196f3',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            cursor: (!selectedProject || !selectedUser || !selectedPermission || isSubmitting) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isSubmitting ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              设置中...
            </>
          ) : (
            '确认设置管理员'
          )}
        </button>

        {/* CSS 动画 */}
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
}