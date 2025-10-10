import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Phone, Clock, MapPin, Edit, Trash2, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, DollarSign, Truck, Package } from "lucide-react"
import { useState } from "react"

export default function OrderCards() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all'); // 状态筛选
  const itemsPerPage = 3;
  
  // 订单数据
  const orders = [
    {
      order_id: 1,
      order_no: "O202412180001",
      customer_name: "李四",
      customer_phone: "13900139000",
      merchant_name: "鲜果园供应商",
      dish_items: "红烧狮子头 2份, 小米汤 1份",
      total_amount: 45,
      actual_amount: 40,
      meal_time: "2024-12-18 12:30",
      delivery_address: "北京市朝阳区果园路88号",
      delivery_person: "张师傅",
      delivery_phone: "13700137000",
      order_status: "已完成",
      payment_status: "已支付",
      create_time: "2024-12-18 10:30",
      remarks: "不要太咸",
      is_urgent: false
    },
    {
      order_id: 2,
      order_no: "O202412180002", 
      customer_name: "王五",
      customer_phone: "13800138000",
      merchant_name: "绿色蔬菜基地",
      dish_items: "小米汤 1份, 时令蔬菜 1份",
      total_amount: 25,
      actual_amount: 20,
      meal_time: "2024-12-18 18:00",
      delivery_address: "河北省承德市农业园区12号",
      delivery_person: "李师傅", 
      delivery_phone: "13600136000",
      order_status: "配送中",
      payment_status: "已支付",
      create_time: "2024-12-18 11:00",
      remarks: "",
      is_urgent: true, // 配送延误
      delay_reason: "交通拥堵，预计延误30分钟"
    },
    {
      order_id: 3,
      order_no: "O202412180003",
      customer_name: "赵六", 
      customer_phone: "13600136000",
      merchant_name: "海鲜批发市场",
      dish_items: "海鲜套餐 1份",
      total_amount: 88,
      actual_amount: 88,
      meal_time: "2024-12-18 19:00",
      delivery_address: "天津市滨海新区海港路66号",
      delivery_person: "",
      delivery_phone: "",
      order_status: "待支付",
      payment_status: "未支付", 
      create_time: "2024-12-18 09:00",
      remarks: "需要发票",
      is_urgent: true, // 超时未支付
      timeout_hours: 3
    },
    {
      order_id: 4,
      order_no: "O202412180004",
      customer_name: "钱七",
      customer_phone: "13500135000", 
      merchant_name: "优质肉类供应",
      dish_items: "红烧肉 1份, 米饭 2份",
      total_amount: 35,
      actual_amount: 35,
      meal_time: "2024-12-18 12:00",
      delivery_address: "山东省青岛市畜牧产业园8号",
      delivery_person: "",
      delivery_phone: "",
      order_status: "已取消",
      payment_status: "已支付",
      create_time: "2024-12-18 10:00", 
      remarks: "客户临时有事",
      is_urgent: false
    },
    {
      order_id: 5,
      order_no: "O202412180005",
      customer_name: "孙八",
      customer_phone: "13400134000",
      merchant_name: "鲜果园供应商", 
      dish_items: "蔬菜沙拉 1份",
      total_amount: 18,
      actual_amount: 18,
      meal_time: "2024-12-18 13:00",
      delivery_address: "北京市海淀区科技园5号",
      delivery_person: "",
      delivery_phone: "",
      order_status: "退款中",
      payment_status: "退款处理",
      create_time: "2024-12-18 11:30",
      remarks: "食品质量问题",
      is_urgent: true, // 需要紧急处理退款
      refund_reason: "客户投诉食品质量"
    },
    {
      order_id: 6,
      order_no: "O202412180006", 
      customer_name: "周九",
      customer_phone: "13300133000",
      merchant_name: "绿色蔬菜基地",
      dish_items: "有机蔬菜套餐 1份",
      total_amount: 42,
      actual_amount: 38,
      meal_time: "2024-12-18 17:30",
      delivery_address: "上海市浦东新区张江路99号",
      delivery_person: "",
      delivery_phone: "",
      order_status: "已支付",
      payment_status: "已支付",
      create_time: "2024-12-18 12:00",
      remarks: "",
      is_urgent: false
    }
  ];

  // 状态筛选逻辑
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => {
        if (statusFilter === 'urgent') return order.is_urgent;
        return order.order_status === statusFilter;
      });

  // 分页计算  
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // 重置到第一页当筛选条件改变时
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleEdit = (orderId, orderNo) => {
    console.log('编辑订单:', orderNo);
    if (typeof sendUserMessage === 'function') {
      sendUserMessage(`修改订单 ${orderNo} 的信息`);
    }
  };

  const handleCancel = (orderId, orderNo) => {
    console.log('取消订单:', orderNo);
    if (typeof sendUserMessage === 'function') {
      sendUserMessage(`取消订单 ${orderNo}`);
    }
  };

  const getStatusColor = (status, isUrgent = false) => {
    const baseColors = {
      '待支付': isUrgent ? 'bg-red-100 text-red-800 border-red-300' : 'bg-yellow-100 text-yellow-800 border-yellow-300',
      '已支付': 'bg-blue-100 text-blue-800 border-blue-300',
      '配送中': isUrgent ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-indigo-100 text-indigo-800 border-indigo-300', 
      '已完成': 'bg-green-100 text-green-800 border-green-300',
      '已取消': 'bg-gray-100 text-gray-800 border-gray-300',
      '退款中': 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return baseColors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getUrgentIcon = (order) => {
    if (!order.is_urgent) return null;
    
    return (
      <div className="flex items-center space-x-1 text-red-600">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-xs font-medium">
          {order.timeout_hours && `超时${order.timeout_hours}小时`}
          {order.delay_reason && '配送延误'}
          {order.refund_reason && '紧急退款'}
        </span>
      </div>
    );
  };

  // 分页控制函数
  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // 统计数据
  const stats = {
    total: orders.length,
    urgent: orders.filter(o => o.is_urgent).length,
    completed: orders.filter(o => o.order_status === '已完成').length,
    pending: orders.filter(o => o.order_status === '待支付').length
  };

  return (
    <div>
      {/* 状态筛选器 */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('all')}
            className="text-xs"
          >
            全部 ({orders.length})
          </Button>
          <Button
            variant={statusFilter === 'urgent' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => handleStatusFilter('urgent')}
            className="text-xs bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            紧急关注 ({stats.urgent})
          </Button>
          <Button
            variant={statusFilter === '待支付' ? 'default' : 'outline'}
            size="sm" 
            onClick={() => handleStatusFilter('待支付')}
            className="text-xs"
          >
            待支付 ({stats.pending})
          </Button>
          <Button
            variant={statusFilter === '配送中' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('配送中')}
            className="text-xs"
          >
            配送中 ({orders.filter(o => o.order_status === '配送中').length})
          </Button>
          <Button
            variant={statusFilter === '已完成' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('已完成')}  
            className="text-xs"
          >
            已完成 ({stats.completed})
          </Button>
          <Button
            variant={statusFilter === '退款中' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('退款中')}
            className="text-xs"
          >
            退款中 ({orders.filter(o => o.order_status === '退款中').length})
          </Button>
        </div>
      </div>

      {/* 成功状态提示 */}
      <div className="p-3 bg-green-100 text-sm text-green-800 mb-4 rounded-lg border border-green-200">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4" />
          <strong>查询成功:</strong> 
          <span>找到 {filteredOrders.length} 个订单</span>
          {filteredOrders.length > itemsPerPage && (
            <span className="ml-2">
              (第 {currentPage}/{totalPages} 页，每页显示 {itemsPerPage} 条)
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-4 p-2 max-w-full">
        {currentOrders.map((order, index) => (
          <Card key={order.order_id} className={`relative overflow-hidden w-full shadow-lg hover:shadow-xl transition-shadow duration-300 ${
            order.is_urgent ? 'ring-2 ring-red-300 bg-red-50/30' : ''
          }`}>
            {/* 紧急标识条 */}
            {order.is_urgent && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
            )}
            
            <div className="flex items-start p-4 gap-4">
              {/* 订单状态指示器 */}
              <div className="flex-shrink-0 w-20 sm:w-24 text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.order_status, order.is_urgent)}`}>
                  {order.order_status}
                </div>
                {order.is_urgent && (
                  <div className="mt-2 text-red-600">
                    <AlertTriangle className="h-5 w-5 mx-auto" />
                    <div className="text-xs font-medium mt-1">紧急</div>
                  </div>
                )}
              </div>
              
              {/* 主要内容区域 */}
              <div className="flex-1 min-w-0">
                {/* 订单号和创建时间 */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-bold text-gray-800">
                      {order.order_no}
                    </h3>
                  </div>
                  <div className="text-xs text-gray-500">
                    创建时间：{order.create_time}
                  </div>
                </div>
                
                {/* 紧急提醒信息 */}
                {order.is_urgent && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                    {getUrgentIcon(order)}
                    {order.delay_reason && (
                      <div className="text-xs text-red-600 mt-1">{order.delay_reason}</div>
                    )}
                    {order.refund_reason && (
                      <div className="text-xs text-red-600 mt-1">退款原因：{order.refund_reason}</div>
                    )}
                  </div>
                )}
                
                {/* 客户和商家信息 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4 text-green-500" />
                    <span className="font-medium">用餐人：</span>
                    <span className="text-blue-600 font-semibold">{order.customer_name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">电话：</span>
                    <span className="text-indigo-600 font-semibold">{order.customer_phone}</span>
                  </div>
                </div>
                
                {/* 商家信息 */}
                <div className="text-sm text-gray-600 mb-2">
                  <span className="inline-block mr-1">🏢</span>
                  <span className="font-medium">商家：</span>
                  <span className="text-orange-600">{order.merchant_name}</span>
                </div>
                
                {/* 菜品信息 */}
                <div className="text-sm text-gray-600 mb-2 bg-gray-50 p-2 rounded-lg">
                  <span className="font-medium">菜品：</span>
                  <span>{order.dish_items}</span>
                </div>
                
                {/* 配送信息 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">配送地址：</span>
                      <span className="text-gray-700">{order.delivery_address}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">用餐时间：</span>
                    <span className="text-gray-700">{order.meal_time}</span>
                  </div>
                </div>
                
                {/* 配送员信息 */}
                {order.delivery_person && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <Truck className="h-4 w-4 text-green-500" />
                    <span className="font-medium">配送员：</span>
                    <span className="text-green-600">{order.delivery_person} ({order.delivery_phone})</span>
                  </div>
                )}
                
                {/* 备注信息 */}
                {order.remarks && (
                  <div className="text-sm text-gray-600 mb-3 bg-yellow-50 p-2 rounded-lg border border-yellow-200">
                    <span className="font-medium">备注：</span>
                    <span>{order.remarks}</span>
                  </div>
                )}
                
                {/* 底部信息：金额和操作按钮 */}
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="text-lg font-bold text-green-600">¥{order.actual_amount}</span>
                      {order.total_amount !== order.actual_amount && (
                        <span className="text-sm text-gray-500 line-through">¥{order.total_amount}</span>
                      )}
                    </div>
                    
                    <Badge className={`text-xs ${
                      order.payment_status === '已支付' ? 'bg-green-100 text-green-800' : 
                      order.payment_status === '未支付' ? 'bg-red-100 text-red-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {order.payment_status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* 编辑按钮 */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(order.order_id, order.order_no)}
                      className="bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-700 hover:text-yellow-800 text-xs px-3 py-1.5"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      修改订单
                    </Button>
                    
                    {/* 取消按钮 */}
                    {order.order_status !== '已完成' && order.order_status !== '已取消' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(order.order_id, order.order_no)}
                        className="bg-red-50 hover:bg-red-100 border-red-300 text-red-700 hover:text-red-800 text-xs px-3 py-1.5"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        取消订单
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 分页控件 */}
      {filteredOrders.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-3 mt-8 pb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevious}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2"
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(page)}
                className={`min-w-[44px] h-9 ${
                  currentPage === page 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2"
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 页面底部统计信息 */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-600">总订单数</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
            <div className="text-xs text-gray-600">紧急关注</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-gray-600">已完成</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-gray-600">待支付</div>
          </div>
        </div>
      </div>
    </div>
  );
}