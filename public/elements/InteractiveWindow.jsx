import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Phone, Clock, MapPin, DollarSign, Package, AlertTriangle } from "lucide-react"
import { useState } from "react"

export default function NewOrderPopup() {
  const [isOpen, setIsOpen] = useState(true);
  
  // 模拟新订单数据
  const newOrder = {
    order_id: 7,
    order_no: "O202412190001",
    customer_name: "陈小明",
    customer_phone: "13988889999",
    merchant_name: "健康美食工坊",
    dish_items: "麻辣香锅 1份, 酸梅汤 2杯, 米饭 1份",
    total_amount: 68,
    actual_amount: 65,
    meal_time: "2024-12-19 12:00",
    delivery_address: "北京市朝阳区建国路SOHO现代城B座2108室",
    delivery_person: "",
    delivery_phone: "",
    order_status: "待处理",
    payment_status: "已支付",
    create_time: "2024-12-19 10:45",
    remarks: "请尽快配送，公司午餐时间有限",
    is_urgent: true,
    is_new: true
  };

  const handleCancel = () => {
    setIsOpen(false);
    console.log('取消处理新订单:', newOrder.order_no);
  };

  const handleProcess = () => {
    setIsOpen(false);
    console.log('开始处理新订单:', newOrder.order_no);
  };

  if (!isOpen) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        background: 'linear-gradient(135deg, #e879f9, #f472b6, #60a5fa)',
        borderRadius: '12px',
        border: '4px solid #3b82f6',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '24px',
          background: 'linear-gradient(45deg, #fef3c7, #fed7aa)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          border: '4px solid #10b981'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '8px' }}>✅</div>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#7c3aed', 
            marginBottom: '12px' 
          }}>
            弹窗已关闭
          </h3>
          <Button 
            onClick={() => setIsOpen(true)}
            style={{
              background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
              color: 'white',
              padding: '8px 24px',
              fontWeight: 'bold',
              border: '2px solid #1d4ed8',
              borderRadius: '8px'
            }}
          >
            🔄 重新打开
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '8px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        width: '320px',
        maxWidth: '90%',
        margin: '0 auto',
        transform: 'scale(1)',
        transition: 'all 0.3s ease'
      }}>
        {/* 弹窗头部 */}
        <div style={{
          background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)',
          color: 'white',
          padding: '12px',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          position: 'relative',
          overflow: 'hidden',
          border: '4px solid #fbbf24'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(45deg, rgba(239,68,68,0.3), rgba(249,115,22,0.3))',
            animation: 'pulse 2s infinite'
          }}></div>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                backgroundColor: '#fbbf24',
                padding: '6px',
                borderRadius: '50%'
              }}>
                <Package style={{ height: '16px', width: '16px', color: '#1e40af' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>🎯 新订单</h2>
                <p style={{ color: '#fef3c7', fontSize: '12px', margin: 0 }}>需要立即处理</p>
              </div>
            </div>
            <div style={{
              background: 'linear-gradient(45deg, #f97316, #ef4444)',
              borderRadius: '20px',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              animation: 'bounce 1s infinite',
              border: '2px solid white'
            }}>
              🔥 HOT
            </div>
          </div>
        </div>

        {/* 弹窗内容 */}
        <div style={{
          padding: '12px',
          background: 'linear-gradient(135deg, #fef3c7, #fed7aa)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 订单号和时间 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px',
              background: 'linear-gradient(45deg, #bfdbfe, #c4b5fd)',
              borderRadius: '8px',
              border: '2px solid #3b82f6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>📋</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '14px' }}>
                    {newOrder.order_no}
                  </div>
                  <Badge style={{
                    background: 'linear-gradient(45deg, #10b981, #059669)',
                    color: 'white',
                    fontSize: '12px',
                    border: '2px solid #047857'
                  }}>
                    {newOrder.payment_status}
                  </Badge>
                </div>
              </div>
              <div style={{
                textAlign: 'right',
                fontSize: '12px',
                color: '#3730a3',
                fontWeight: '600'
              }}>
                <div>{newOrder.create_time}</div>
              </div>
            </div>

            {/* 客户信息 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px',
                background: 'linear-gradient(45deg, #bbf7d0, #86efac)',
                borderRadius: '8px',
                border: '2px solid #10b981'
              }}>
                <span style={{ fontSize: '14px' }}>👤</span>
                <div>
                  <div style={{ fontSize: '12px', color: '#065f46', fontWeight: 'bold' }}>客户</div>
                  <div style={{ fontWeight: 'bold', color: '#064e3b', fontSize: '12px' }}>
                    {newOrder.customer_name}
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px',
                background: 'linear-gradient(45deg, #e9d5ff, #f3e8ff)',
                borderRadius: '8px',
                border: '2px solid #8b5cf6'
              }}>
                <span style={{ fontSize: '14px' }}>📞</span>
                <div>
                  <div style={{ fontSize: '12px', color: '#581c87', fontWeight: 'bold' }}>电话</div>
                  <div style={{ fontWeight: 'bold', color: '#4c1d95', fontSize: '12px' }}>
                    {newOrder.customer_phone}
                  </div>
                </div>
              </div>
            </div>

            {/* 商家信息 */}
            <div style={{
              padding: '8px',
              background: 'linear-gradient(45deg, #fed7aa, #fdba74)',
              borderRadius: '8px',
              border: '2px solid #f97316'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>🏪</span>
                <div>
                  <div style={{ fontSize: '12px', color: '#9a3412', fontWeight: 'bold' }}>商家</div>
                  <div style={{ fontWeight: 'bold', color: '#7c2d12', fontSize: '12px' }}>
                    {newOrder.merchant_name}
                  </div>
                </div>
              </div>
            </div>

            {/* 菜品信息 */}
            <div style={{
              padding: '10px',
              background: 'linear-gradient(45deg, #fef3c7, #fde68a)',
              borderRadius: '8px',
              border: '2px solid #eab308'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>🍽️</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#92400e', marginBottom: '4px' }}>
                    菜品详情
                  </div>
                  <div style={{ color: '#78350f', fontSize: '12px', fontWeight: 'bold' }}>
                    {newOrder.dish_items}
                  </div>
                </div>
              </div>
            </div>

            {/* 配送信息 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                padding: '8px',
                background: 'linear-gradient(45deg, #fecaca, #fca5a5)',
                borderRadius: '8px',
                border: '2px solid #ef4444'
              }}>
                <span style={{ fontSize: '14px' }}>📍</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '2px', fontWeight: 'bold' }}>
                    配送地址
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f1d1d', fontWeight: 'bold', lineHeight: '1.2' }}>
                    {newOrder.delivery_address}
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px',
                background: 'linear-gradient(45deg, #a5f3fc, #67e8f9)',
                borderRadius: '8px',
                border: '2px solid #06b6d4'
              }}>
                <span style={{ fontSize: '14px' }}>⏰</span>
                <div>
                  <div style={{ fontSize: '12px', color: '#164e63', fontWeight: 'bold' }}>用餐时间</div>
                  <div style={{ fontWeight: 'bold', color: '#155e75', fontSize: '12px' }}>
                    {newOrder.meal_time}
                  </div>
                </div>
              </div>
            </div>

            {/* 备注信息 */}
            {newOrder.remarks && (
              <div style={{
                padding: '10px',
                background: 'linear-gradient(45deg, #c7d2fe, #a5b4fc)',
                borderRadius: '8px',
                border: '2px solid #6366f1'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>💭</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#312e81', marginBottom: '2px' }}>
                      客户备注
                    </div>
                    <div style={{ color: '#1e1b4b', fontSize: '12px', fontWeight: 'bold' }}>
                      {newOrder.remarks}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 金额信息 */}
            <div style={{
              padding: '10px',
              background: 'linear-gradient(45deg, #a7f3d0, #6ee7b7)',
              borderRadius: '8px',
              border: '2px solid #10b981'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>💰</span>
                  <span style={{ fontWeight: 'bold', color: '#064e3b', fontSize: '12px' }}>
                    订单金额
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#065f46' }}>
                    ¥{newOrder.actual_amount}
                  </div>
                  {newOrder.total_amount !== newOrder.actual_amount && (
                    <div style={{
                      fontSize: '12px',
                      color: '#047857',
                      textDecoration: 'line-through',
                      fontWeight: '600'
                    }}>
                      ¥{newOrder.total_amount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 弹窗底部按钮 */}
        <div style={{
          background: 'linear-gradient(45deg, #fed7aa, #fdba74)',
          padding: '12px',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
          borderTop: '4px solid #8b5cf6'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px'
          }}>
            {/* 左下角取消按钮 */}
            <Button
              variant="outline"
              onClick={handleCancel}
              style={{
                padding: '6px 16px',
                fontSize: '14px',
                background: 'linear-gradient(45deg, #fecaca, #fca5a5)',
                border: '2px solid #ef4444',
                color: '#991b1b',
                fontWeight: 'bold',
                borderRadius: '8px'
              }}
            >
              ❌ 取消
            </Button>
            
            {/* 右下角处理按钮 */}
            <Button
              onClick={handleProcess}
              style={{
                padding: '6px 16px',
                fontSize: '14px',
                background: 'linear-gradient(45deg, #10b981, #059669)',
                color: 'white',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transform: 'scale(1)',
                transition: 'all 0.2s ease',
                border: '2px solid #047857',
                borderRadius: '8px'
              }}
            >
              🚀 立即处理
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}