import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, X, ZoomIn, Clock, Phone, User, MapPin, Palette, AlertCircle, Calendar } from "lucide-react"
import { useState } from "react"

export default function SeniorPaintingCourse() {
  const [selectedImage, setSelectedImage] = useState(null);
  
  // 老年绘画课程数据
  const paintingCourse = {
    course_id: "HH202509190001",
    course_name: "夕阳红水彩花卉绘画班",
    course_description: "零基础水彩花卉绘画",
    course_type: "艺术兴趣课程",
    difficulty_level: "初级",
    enrollment_status: "待报名",
    student_name: "张秀英",
    student_phone: "138****5678",
    class_location: "北京市西城区文化宫老年活动中心3楼绘画教室",
    class_date: "2025年9月20日",
    class_time: "上午 09:30-11:30",
    instructor_name: "刘老师",
    instructor_phone: "139****1234",
    teaching_experience: "15年绘画教学经验",
    instructor_rating: "4.9",
    class_duration: "2小时/节",
    course_fee: "¥380/月",
    enrollment_time: "2025-9-19 14:30",
    course_content: "专业美术老师授课，从基础色彩搭配开始，学习水彩技法，绘制美丽花卉作品。小班教学，耐心指导，让您在轻松愉快的氛围中享受绘画乐趣。",
    materials_needed: "水彩颜料、水彩纸、画笔、调色盘",
    class_notice: "请穿着不怕弄脏的衣服，教室提供围裙和饮用水",
    url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop",
    course_modules: ["色彩基础", "花卉构图", "水彩技法", "作品完成"],
    course_guarantee: "满意保障"
  };

  const handleConfirm = () => {
    console.log('确认课程报名:', paintingCourse.course_id);
    alert(`✅ 已确认课程报名 ${paintingCourse.course_id}\n\n${paintingCourse.instructor_name} 将于 ${paintingCourse.class_date} ${paintingCourse.class_time} 开课\n\n如有问题请联系：${paintingCourse.instructor_phone}`);
  };

  const handleCancel = () => {
    console.log('取消课程报名:', paintingCourse.course_id);
    if (confirm(`❌ 确定要取消课程报名 ${paintingCourse.course_id} 吗？\n\n取消后需要重新报名`)) {
      alert('课程报名已取消，如需重新报名请联系客服');
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      '已报名': 'bg-blue-500',
      '进行中': 'bg-orange-500',
      '已完成': 'bg-green-500',
      '已取消': 'bg-red-500'
    };
    return statusColors[status] || 'bg-gray-500';
  };

  const getDifficultyColor = (difficulty) => {
    const difficultyColors = {
      '高级': 'bg-red-500',
      '中级': 'bg-orange-500',
      '初级': 'bg-green-500'
    };
    return difficultyColors[difficulty] || 'bg-gray-500';
  };

  // 处理图片加载错误
  const handleImageError = (e) => {
    e.target.src = "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop";
  };

  // 处理图片点击放大
  const handleImageClick = (imageUrl, courseName) => {
    setSelectedImage({ url: imageUrl, name: courseName });
  };

  // 关闭图片放大视图
  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* 页面标题 */}
      <div style={{
        backgroundColor: '#7c3aed',
        color: 'white',
        padding: '16px',
        borderRadius: '12px 12px 0 0',
        marginBottom: '0',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
          🎨 老年绘画课程
        </h1>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
          专业美术教学 • 小班授课 • 零基础友好
        </p>
      </div>

      {/* 课程状态信息 */}
      <div style={{
        padding: '8px 12px',
        backgroundColor: '#ecfdf5',
        color: '#059669',
        fontSize: '12px',
        borderLeft: '3px solid #10b981',
        marginBottom: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div>
          <strong>📝 课程状态：</strong> {paintingCourse.enrollment_status} - 课程编号：{paintingCourse.course_id}
        </div>
        <div style={{ fontSize: '11px', opacity: 0.8 }}>
          报名时间：{paintingCourse.enrollment_time}
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
                  handleImageClick(paintingCourse.url, paintingCourse.course_name);
                }}
              >
                <img 
                  src={paintingCourse.url} 
                  alt={paintingCourse.course_name}
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
                
                {/* 难度等级和状态标签合并 */}
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
                    {paintingCourse.difficulty_level}
                  </div>
                  <div style={{
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '10px'
                  }}>
                    {paintingCourse.enrollment_status}
                  </div>
                </div>
              </div>

              {/* 课程模块标识 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                {paintingCourse.course_modules.map((module, i) => (
                  <Badge key={i} style={{
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    fontSize: '9px',
                    padding: '1px 4px'
                  }}>
                    <Palette style={{ height: '8px', width: '8px', marginRight: '1px' }} />
                    {module}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* 右侧信息区域 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* 标题行：包含标题、类型、课程编号和基本信息 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '6px',
                backgroundColor: '#faf5ff',
                borderRadius: '4px'
              }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#7c3aed',
                    margin: '0 0 4px 0',
                    lineHeight: '1.1'
                  }}>
                    {paintingCourse.course_name}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'gray' }}>
                    <span><strong>课程号：</strong>{paintingCourse.course_id}</span>
                    <span><strong>时长：</strong>{paintingCourse.class_duration}</span>
                    <span><strong>费用：</strong>{paintingCourse.course_fee}</span>
                  </div>
                </div>
                <Badge style={{
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  fontSize: '11px',
                  flexShrink: 0
                }}>
                  {paintingCourse.course_type}
                </Badge>
              </div>
              
              {/* 课程内容描述 - 更紧凑 */}
              <div style={{
                fontSize: '12px',
                color: 'gray',
                lineHeight: '1.4',
                backgroundColor: '#f0f9ff',
                padding: '6px',
                borderRadius: '4px',
                borderLeft: '2px solid #3b82f6'
              }}>
                <strong>课程内容：</strong>{paintingCourse.course_content}
              </div>
              
              {/* 学员信息、老师信息、材料整合到一行 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '6px',
                fontSize: '11px'
              }}>
                {/* 学员信息 */}
                <div style={{ padding: '6px', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
                  <div style={{ color: '#1e40af', fontWeight: 'bold', marginBottom: '2px', fontSize: '10px' }}>
                    <User style={{ height: '10px', width: '10px', display: 'inline', marginRight: '2px' }} />
                    学员
                  </div>
                  <div style={{ color: '#1e3a8a', fontSize: '11px' }}>{paintingCourse.student_name}</div>
                  <div style={{ color: '#1e3a8a', fontSize: '10px' }}>
                    <Phone style={{ height: '8px', width: '8px', display: 'inline', marginRight: '1px' }} />
                    {paintingCourse.student_phone}
                  </div>
                </div>
                
                {/* 授课老师 */}
                <div style={{ padding: '6px', backgroundColor: '#f0fdf4', borderRadius: '4px' }}>
                  <div style={{ color: '#15803d', fontWeight: 'bold', marginBottom: '2px', fontSize: '10px' }}>
                    <Palette style={{ height: '10px', width: '10px', display: 'inline', marginRight: '2px' }} />
                    老师
                  </div>
                  <div style={{ color: '#14532d', fontSize: '11px' }}>{paintingCourse.instructor_name}</div>
                  <div style={{ color: '#14532d', fontSize: '10px' }}>
                    <Phone style={{ height: '8px', width: '8px', display: 'inline', marginRight: '1px' }} />
                    {paintingCourse.instructor_phone}
                  </div>
                  <div style={{ color: '#14532d', fontSize: '9px' }}>⭐ {paintingCourse.instructor_rating} • {paintingCourse.teaching_experience}</div>
                </div>

                {/* 材料和保障 */}
                <div style={{ padding: '6px', backgroundColor: '#fefce8', borderRadius: '4px' }}>
                  <div style={{ color: '#ca8a04', fontWeight: 'bold', marginBottom: '2px', fontSize: '10px' }}>
                    🎨 材料保障
                  </div>
                  <div style={{ color: '#a16207', fontSize: '10px', lineHeight: '1.2' }}>
                    {paintingCourse.materials_needed.split('、').slice(0,2).join('、')}等
                  </div>
                  <div style={{ color: '#a16207', fontSize: '9px' }}>🛡️ {paintingCourse.course_guarantee}</div>
                </div>
              </div>

              {/* 上课时间和地址 - 水平布局 */}
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
                    <span style={{ fontWeight: 'bold', color: '#92400e', fontSize: '12px' }}>上课时间</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#d97706' }}>
                    {paintingCourse.class_date} {paintingCourse.class_time}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <MapPin style={{ height: '12px', width: '12px', color: '#d97706' }} />
                    <span style={{ fontWeight: 'bold', color: '#92400e', fontSize: '12px' }}>上课地址</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#92400e', lineHeight: '1.3' }}>
                    {paintingCourse.class_location}
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
                <span><strong>提醒：</strong>{paintingCourse.class_notice}</span>
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
                    color: '#7c3aed'
                  }}>
                    {paintingCourse.course_fee}
                  </span>
                  <Badge style={{
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    fontSize: '10px'
                  }}>
                    {paintingCourse.course_guarantee}
                  </Badge>
                  <div style={{ fontSize: '11px', color: 'gray' }}>
                    🎨 小班教学 | 👥 8-12人班 | ⭐ {paintingCourse.instructor_rating}分好评
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
                    取消报名
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
                    确认报名
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