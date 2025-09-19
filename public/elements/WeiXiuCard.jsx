import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, X, ZoomIn, Clock, Phone, User, MapPin, Wrench, AlertCircle, Calendar } from "lucide-react"
import { useState } from "react"

export default function RepairOrderCard() {
  const [selectedImage, setSelectedImage] = useState(null);
  
  // 维修工单数据
  const repairOrder = {
    order_id: "WX202412190001",
    repair_item: "客厅吸顶灯维修",
    problem_description: "客厅主灯不亮",
    issue_type: "照明设备故障",
    urgency_level: "普通",
    status: "已派单",
    customer_name: "张秀英",
    customer_phone: "138****5678",
    address: "北京市朝阳区建国路88号华贸中心A座2101室",
    appointment_date: "2025年9月19日",
    appointment_time: "上午 09:00-11:00",
    repair_person: "李师傅",
    repair_phone: "139****1234",
    repair_experience: "8年维修经验",
    repair_rating: "4.9",
    estimated_duration: "30-60分钟",
    estimated_cost: "¥50-150",
    created_time: "2025-9-19 14:30",
    repair_description: "专业电工上门检修，排查线路问题，更换损坏的灯具配件。提供质量保证，维修后提供3个月保修服务。",
    tools_needed: "万用表、螺丝刀、电工胶带、LED灯珠",
    safety_notice: "维修过程中会断电操作，请提前准备好照明设备",
    url: "https://b0.bdstatic.com/ugc/VdIcWUgg6v5x1rGVITJzOgf3e302f42b97abf40d8e2892f08bc598.jpg",
    service_items: ["故障检测", "线路维修", "配件更换", "功能测试"],
    warranty: "3个月保修"
  };

  const handleConfirm = () => {
    console.log('确认维修工单:', repairOrder.order_id);
    alert(`✅ 已确认维修工单 ${repairOrder.order_id}\n\n维修师傅 ${repairOrder.repair_person} 将于 ${repairOrder.appointment_date} ${repairOrder.appointment_time} 上门服务\n\n如有问题请联系：${repairOrder.repair_phone}`);
  };

  const handleCancel = () => {
    console.log('取消维修工单:', repairOrder.order_id);
    if (confirm(`❌ 确定要取消维修工单 ${repairOrder.order_id} 吗？\n\n取消后需要重新预约维修时间`)) {
      alert('工单已取消，如需重新预约请联系客服');
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      '已派单': 'bg-blue-500',
      '进行中': 'bg-orange-500',
      '已完成': 'bg-green-500',
      '已取消': 'bg-red-500'
    };
    return statusColors[status] || 'bg-gray-500';
  };

  const getUrgencyColor = (urgency) => {
    const urgencyColors = {
      '紧急': 'bg-red-500',
      '普通': 'bg-blue-500',
      '低优先级': 'bg-gray-500'
    };
    return urgencyColors[urgency] || 'bg-gray-500';
  };

  // 处理图片加载错误
  const handleImageError = (e) => {
    e.target.src = "https://b0.bdstatic.com/ugc/VdIcWUgg6v5x1rGVITJzOgf3e302f42b97abf40d8e2892f08bc598.jpg";
  };

  // 处理图片点击放大
  const handleImageClick = (imageUrl, itemName) => {
    setSelectedImage({ url: imageUrl, name: itemName });
  };

  // 关闭图片放大视图
  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* 页面标题 */}
      <div style={{
        backgroundColor: '#1e40af',
        color: 'white',
        padding: '16px',
        borderRadius: '12px 12px 0 0',
        marginBottom: '0',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
          🔧 维修服务工单
        </h1>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
          专业维修团队 • 快速响应 • 质量保证
        </p>
      </div>

      {/* 工单状态信息 */}
      <div style={{
        padding: '8px 12px',
        backgroundColor: '#dcfce7',
        color: '#15803d',
        fontSize: '12px',
        borderLeft: '3px solid #22c55e',
        marginBottom: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div>
          <strong>✅ 工单状态：</strong> {repairOrder.status} - 工单号：{repairOrder.order_id}
        </div>
        <div style={{ fontSize: '11px', opacity: 0.8 }}>
          创建时间：{repairOrder.created_time}
        </div>
      </div>
      
      <div style={{ padding: '4px' }}>
        <Card style={{
          border: '2px solid #e5e5e5',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '220px 1fr',
            gap: '12px',
            padding: '12px'
          }}>
            {/* 左侧图片区域 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* 主图片 */}
              <div 
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '140px',
                  overflow: 'hidden',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: '1px solid #ddd'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageClick(repairOrder.url, repairOrder.repair_item);
                }}
              >
                <img 
                  src={repairOrder.url} 
                  alt={repairOrder.repair_item}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={handleImageError}
                />
                {/* 放大图标 */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = 1}
                onMouseLeave={(e) => e.target.style.opacity = 0}
                >
                  <ZoomIn style={{ height: '20px', width: '20px', color: 'white' }} />
                </div>
                
                {/* 紧急程度和状态标签合并 */}
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  left: '4px',
                  right: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '4px'
                }}>
                  <div style={{
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    <AlertCircle style={{ height: '10px', width: '10px' }} />
                    {repairOrder.urgency_level}
                  </div>
                  <div style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '10px'
                  }}>
                    {repairOrder.status}
                  </div>
                </div>
              </div>

              {/* 服务项目标识 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                {repairOrder.service_items.map((item, i) => (
                  <Badge key={i} style={{
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    fontSize: '9px',
                    padding: '1px 4px'
                  }}>
                    <Wrench style={{ height: '8px', width: '8px', marginRight: '1px' }} />
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* 右侧信息区域 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* 标题行：包含标题、类型、工单号和基本信息 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '6px',
                backgroundColor: '#f8fafc',
                borderRadius: '4px'
              }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#1e40af',
                    margin: '0 0 4px 0',
                    lineHeight: '1.1'
                  }}>
                    {repairOrder.repair_item}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'gray' }}>
                    <span><strong>工单号：</strong>{repairOrder.order_id}</span>
                    <span><strong>预计：</strong>{repairOrder.estimated_duration}</span>
                    <span><strong>费用：</strong>{repairOrder.estimated_cost}</span>
                  </div>
                </div>
                <Badge style={{
                  backgroundColor: '#1e40af',
                  color: 'white',
                  fontSize: '11px',
                  flexShrink: 0
                }}>
                  {repairOrder.issue_type}
                </Badge>
              </div>
              
              {/* 故障描述 - 更紧凑 */}
              <div style={{
                fontSize: '12px',
                color: 'gray',
                lineHeight: '1.4',
                backgroundColor: '#fef2f2',
                padding: '6px',
                borderRadius: '4px',
                borderLeft: '2px solid #ef4444'
              }}>
                <strong>故障：</strong>{repairOrder.repair_description}
              </div>
              
              {/* 人员信息、预约时间、工具整合到一行 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '6px',
                fontSize: '11px'
              }}>
                {/* 客户信息 */}
                <div style={{ padding: '6px', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
                  <div style={{ color: '#1e40af', fontWeight: 'bold', marginBottom: '2px', fontSize: '10px' }}>
                    <User style={{ height: '10px', width: '10px', display: 'inline', marginRight: '2px' }} />
                    客户
                  </div>
                  <div style={{ color: '#1e3a8a', fontSize: '11px' }}>{repairOrder.customer_name}</div>
                  <div style={{ color: '#1e3a8a', fontSize: '10px' }}>
                    <Phone style={{ height: '8px', width: '8px', display: 'inline', marginRight: '1px' }} />
                    {repairOrder.customer_phone}
                  </div>
                </div>
                
                {/* 维修师傅 */}
                <div style={{ padding: '6px', backgroundColor: '#f0fdf4', borderRadius: '4px' }}>
                  <div style={{ color: '#15803d', fontWeight: 'bold', marginBottom: '2px', fontSize: '10px' }}>
                    <Wrench style={{ height: '10px', width: '10px', display: 'inline', marginRight: '2px' }} />
                    师傅
                  </div>
                  <div style={{ color: '#14532d', fontSize: '11px' }}>{repairOrder.repair_person}</div>
                  <div style={{ color: '#14532d', fontSize: '10px' }}>
                    <Phone style={{ height: '8px', width: '8px', display: 'inline', marginRight: '1px' }} />
                    {repairOrder.repair_phone}
                  </div>
                  <div style={{ color: '#14532d', fontSize: '9px' }}>⭐ {repairOrder.repair_rating} • {repairOrder.repair_experience}</div>
                </div>

                {/* 工具和保修 */}
                <div style={{ padding: '6px', backgroundColor: '#fefce8', borderRadius: '4px' }}>
                  <div style={{ color: '#ca8a04', fontWeight: 'bold', marginBottom: '2px', fontSize: '10px' }}>
                    🔧 工具保修
                  </div>
                  <div style={{ color: '#a16207', fontSize: '10px', lineHeight: '1.2' }}>
                    {repairOrder.tools_needed.split('、').slice(0,2).join('、')}等
                  </div>
                  <div style={{ color: '#a16207', fontSize: '9px' }}>🛡️ {repairOrder.warranty}</div>
                </div>
              </div>

              {/* 预约时间和地址 - 水平布局 */}
              <div style={{
                display: 'flex',
                gap: '8px',
                padding: '8px',
                backgroundColor: '#fffbeb',
                borderRadius: '6px',
                border: '1px solid #fbbf24'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Calendar style={{ height: '12px', width: '12px', color: '#d97706' }} />
                    <span style={{ fontWeight: 'bold', color: '#92400e', fontSize: '12px' }}>预约时间</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#d97706' }}>
                    {repairOrder.appointment_date} {repairOrder.appointment_time}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <MapPin style={{ height: '12px', width: '12px', color: '#d97706' }} />
                    <span style={{ fontWeight: 'bold', color: '#92400e', fontSize: '12px' }}>服务地址</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#92400e', lineHeight: '1.3' }}>
                    {repairOrder.address}
                  </div>
                </div>
              </div>

              {/* 重要提醒 - 更紧凑 */}
              <div style={{
                padding: '6px',
                backgroundColor: '#fef3c7',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#92400e',
                border: '1px solid #fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <AlertCircle style={{ height: '10px', width: '10px', flexShrink: 0 }} />
                <span><strong>提醒：</strong>{repairOrder.safety_notice}</span>
              </div>
              
              {/* 底部操作区域 - 价格和按钮水平排列 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                marginTop: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#059669'
                  }}>
                    {repairOrder.estimated_cost}
                  </span>
                  <Badge style={{
                    backgroundColor: '#059669',
                    color: 'white',
                    fontSize: '10px'
                  }}>
                    {repairOrder.warranty}
                  </Badge>
                  <div style={{ fontSize: '11px', color: 'gray' }}>
                    📦 库存充足 | 🚚 上门服务 | ⭐ {repairOrder.repair_rating}分好评
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button
                    onClick={handleCancel}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <X style={{ height: '12px', width: '12px', marginRight: '2px' }} />
                    取消
                  </Button>
                  
                  <Button
                    onClick={handleConfirm}
                    style={{
                      backgroundColor: '#22c55e',
                      color: 'white',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle style={{ height: '12px', width: '12px', marginRight: '2px' }} />
                    确认
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 图片放大模态框 */}
      {selectedImage && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px'
          }}
          onClick={closeImageModal}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            {/* 关闭按钮 */}
            <button
              onClick={closeImageModal}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                color: 'white',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              <X style={{ height: '32px', width: '32px' }} />
            </button>
            
            {/* 放大的图片 */}
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 10px 50px rgba(0,0,0,0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* 图片标题 */}
            {selectedImage.name && (
              <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '12px',
                borderBottomLeftRadius: '8px',
                borderBottomRightRadius: '8px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  margin: 0
                }}>
                  {selectedImage.name}
                </h3>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}