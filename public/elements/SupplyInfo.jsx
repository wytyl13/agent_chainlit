import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Phone, Star, Building, Edit, Trash2, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"
import { useState } from "react"

export default function SupplierCards() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3; // 每页显示3条数据
  
  // props 是全局注入的，不需要作为参数传递
  console.log('=== SupplierCards 调试信息 ===');
  console.log('全局 props:', props);
  console.log('props 类型:', typeof props);
  console.log('props 是否为数组:', Array.isArray(props));
  
  // 写死的供应商数据
  const suppliers = [
    {
      supplier_id: 1,
      supplier_name: "鲜果园供应商",
      contact_person: "李四",
      phone: "13900139000",
      category: "水果蔬菜",
      status: "启用",
      rating: "4.8",
      description: "专业果蔬供应，品质保证，新鲜直达",
      address: "北京市朝阳区果园路88号",
      business_scope: "水果、蔬菜、有机食品",
      cooperation_time: "2024年1月",
      url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=200&fit=crop"
    },
    {
      supplier_id: 2,
      supplier_name: "绿色蔬菜基地",
      contact_person: "王五",
      phone: "13800138000",
      category: "蔬菜类",
      status: "启用",
      rating: "4.5",
      description: "绿色无公害蔬菜种植基地，农场直供",
      address: "河北省承德市农业园区",
      business_scope: "绿叶蔬菜、根茎类蔬菜",
      cooperation_time: "2023年6月",
      url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&h=200&fit=crop"
    },
    {
      supplier_id: 3,
      supplier_name: "海鲜批发市场",
      contact_person: "张三",
      phone: "13700137000",
      category: "水产海鲜",
      status: "启用",
      rating: "4.7",
      description: "新鲜海产品批发，冷链配送保鲜",
      address: "天津市滨海新区海港路",
      business_scope: "海鲜、淡水鱼、冷冻食品",
      cooperation_time: "2023年3月",
      url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=200&fit=crop"
    },
    {
      supplier_id: 4,
      supplier_name: "优质肉类供应",
      contact_person: "赵六",
      phone: "13600136000",
      category: "肉类食品",
      status: "启用",
      rating: "4.6",
      description: "优质猪肉、牛肉、禽肉供应商",
      address: "山东省青岛市畜牧产业园",
      business_scope: "猪肉、牛肉、鸡肉、鸭肉",
      cooperation_time: "2023年8月",
      url: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&h=200&fit=crop"
    }
  ];

  console.log('写死的 suppliers:', suppliers);
  console.log('suppliers 长度:', suppliers.length);

  // 分页计算
  const totalPages = Math.ceil(suppliers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSuppliers = suppliers.slice(startIndex, endIndex);

  const handleEdit = (supplierId, supplierName) => {
    console.log('编辑供应商:', supplierName);
    // 使用 Chainlit 提供的 sendUserMessage API
    if (typeof sendUserMessage === 'function') {
      sendUserMessage(`修改${supplierName}的信息`);
    }
  };

  const handleDelete = (supplierId, supplierName) => {
    console.log('删除供应商:', supplierName);
    // 使用 Chainlit 提供的 sendUserMessage API
    if (typeof sendUserMessage === 'function') {
      sendUserMessage(`删除${supplierName}`);
    }
  };

  const getStatusColor = (status) => {
    return status === '启用' ? 'bg-green-500' : 'bg-red-500';
  };

  const getCategoryColor = (category) => {
    const colors = {
      '水果蔬菜': 'bg-green-100 text-green-800',
      '蔬菜类': 'bg-emerald-100 text-emerald-800',
      '水产海鲜': 'bg-blue-100 text-blue-800',
      '肉类食品': 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // 处理图片加载错误
  const handleImageError = (e) => {
    e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=200&fit=crop";
  };

  // 分页控制函数
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div>
      {/* 成功状态提示 */}
      <div className="p-3 bg-green-100 text-sm text-green-800 mb-4 rounded-lg border border-green-200">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4" />
          <strong>✅ 成功:</strong> 
          <span>找到 {suppliers.length} 家供应商</span>
          {suppliers.length > itemsPerPage && (
            <span className="ml-2">
              (第 {currentPage}/{totalPages} 页，每页显示 {itemsPerPage} 条)
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-4 p-2 max-w-full">
        {currentSuppliers.map((supplier, index) => {
          const isActive = supplier.status === '启用';
          
          return (
            <Card key={supplier.supplier_id || (startIndex + index)} className="relative overflow-hidden w-full shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start p-4 gap-4">
                {/* 供应商图片区域 */}
                {supplier.url && (
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 overflow-hidden rounded-xl">
                    <img 
                      src={supplier.url} 
                      alt={supplier.supplier_name || 'supplier image'}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                    {/* 供应商图片上的状态标识 */}
                    {supplier.status && (
                      <div className={`absolute top-1 left-1 ${getStatusColor(supplier.status)} text-white px-2 py-0.5 rounded-full text-xs font-medium`}>
                        {supplier.status}
                      </div>
                    )}
                    {/* 评分显示 */}
                    {supplier.rating && (
                      <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-xs">
                        ⭐ {supplier.rating}
                      </div>
                    )}
                  </div>
                )}
                
                {/* 主要内容区域 */}
                <div className="flex-1 min-w-0">
                  {/* 标题和类别 */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <Building className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                        {supplier.supplier_name || 'Unknown Supplier'}
                      </h3>
                    </div>
                    {supplier.category && (
                      <Badge className={`${getCategoryColor(supplier.category)} text-xs flex-shrink-0 ml-2`}>
                        {supplier.category}
                      </Badge>
                    )}
                  </div>
                  
                  {/* 联系信息 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {supplier.contact_person && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="h-4 w-4 text-green-500" />
                        <span className="font-medium">联系人：</span>
                        <span className="text-blue-600 font-semibold">{supplier.contact_person}</span>
                      </div>
                    )}
                    
                    {supplier.phone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">电话：</span>
                        <span className="text-indigo-600 font-semibold">{supplier.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 业务范围 */}
                  {supplier.business_scope && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="inline-block mr-1">🏢</span>
                      <span className="font-medium">业务范围：</span>
                      <span className="text-orange-600">{supplier.business_scope}</span>
                    </div>
                  )}
                  
                  {/* 地址信息 */}
                  {supplier.address && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="inline-block mr-1">📍</span>
                      <span className="font-medium">地址：</span>
                      <span className="text-gray-700">{supplier.address}</span>
                    </div>
                  )}
                  
                  {/* 描述 */}
                  {supplier.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 bg-gray-50 p-2 rounded-lg">
                      {supplier.description}
                    </p>
                  )}
                  
                  {/* 底部信息：合作时间、评分、操作按钮 */}
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {supplier.cooperation_time && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                          合作开始：{supplier.cooperation_time}
                        </span>
                      )}
                      {/* 如果没有图片，在这里显示评分 */}
                      {!supplier.url && supplier.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold text-yellow-600">{supplier.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* 编辑按钮 */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(supplier.supplier_id, supplier.supplier_name)}
                        className="bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-700 hover:text-yellow-800 text-xs px-3 py-1.5"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        修改信息
                      </Button>
                      
                      {/* 删除按钮 */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(supplier.supplier_id, supplier.supplier_name)}
                        className="bg-red-50 hover:bg-red-100 border-red-300 text-red-700 hover:text-red-800 text-xs px-3 py-1.5"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        删除供应商
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 分页控件 - 只有当数据超过每页显示数量时才显示 */}
      {suppliers.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-3 mt-8 pb-6">
          {/* 上一页按钮 */}
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

          {/* 页码按钮 */}
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

          {/* 下一页按钮 */}
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
            <div className="text-2xl font-bold text-blue-600">{suppliers.length}</div>
            <div className="text-xs text-gray-600">总供应商</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {suppliers.filter(s => s.status === '启用').length}
            </div>
            <div className="text-xs text-gray-600">启用状态</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">
              {(suppliers.reduce((sum, s) => sum + parseFloat(s.rating || 0), 0) / suppliers.length).toFixed(1)}
            </div>
            <div className="text-xs text-gray-600">平均评分</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">100%</div>
            <div className="text-xs text-gray-600">响应率</div>
          </div>
        </div>
      </div>
    </div>
  );
}