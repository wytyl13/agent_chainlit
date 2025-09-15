import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart, X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

export default function MenuCards() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3; // 每页显示3条数据
  
  // props 是全局注入的，不需要作为参数传递
  console.log('=== MenuCards 调试信息 ===');
  console.log('全局 props:', props);
  console.log('props 类型:', typeof props);
  console.log('props 是否为数组:', Array.isArray(props));
  
  // 根据 Chainlit 文档，props 应该直接包含数据
  // 如果后端传递的是 {"data": [...]}，则使用 props.data
  // 如果后端直接传递数组，则直接使用 props
  let dishes = [];
  
  if (Array.isArray(props)) {
    // 如果 props 本身就是数组
    dishes = props;
  } else if (props && Array.isArray(props.data)) {
    // 如果 props 包含 data 数组
    dishes = props.data;
  } else if (props && typeof props === 'object') {
    // 尝试找到数组类型的属性
    const arrayValues = Object.values(props).filter(val => Array.isArray(val));
    if (arrayValues.length > 0) {
      dishes = arrayValues[0];
    }
  }

  console.log('最终处理的 dishes:', dishes);
  console.log('dishes 长度:', dishes.length);

  // 分页计算
  const totalPages = Math.ceil(dishes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDishes = dishes.slice(startIndex, endIndex);

  const handleOrder = (dishId, dishName, price) => {
    console.log('点餐:', dishName, price);
    // 使用 Chainlit 提供的 sendUserMessage API
    if (typeof sendUserMessage === 'function') {
      sendUserMessage(`我要点餐：${dishName} (${price})`);
    }
  };

  const getAvailabilityColor = (availability) => {
    return availability === '有货' ? 'bg-green-500' : 'bg-red-500';
  };

  // 处理图片加载错误
  const handleImageError = (e) => {
    e.target.src = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop";
  };

  // 处理图片点击放大
  const handleImageClick = (imageUrl, dishName) => {
    setSelectedImage({ url: imageUrl, name: dishName });
  };

  // 关闭图片放大视图
  const closeImageModal = () => {
    setSelectedImage(null);
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

  // 调试信息显示
  if (!dishes.length) {
    return (
      <div className="p-4 border-2 border-yellow-300 bg-yellow-50 rounded-lg">
        <div className="text-red-600 font-bold mb-2">🐛 调试信息：</div>
        <div className="space-y-2 text-xs">
          <div><strong>全局 props:</strong> <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(props, null, 2)}</pre></div>
          <div><strong>props 类型:</strong> {typeof props}</div>
          <div><strong>props 是否为数组:</strong> {Array.isArray(props).toString()}</div>
          <div><strong>dishes.length:</strong> {dishes.length}</div>
        </div>
        <div className="text-gray-500 mt-4 text-center">
          暂无菜单数据
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 成功状态的调试信息 */}
      <div className="p-2 bg-green-100 text-xs text-green-800 mb-4 rounded">
        <strong>✅ 成功:</strong> 找到 {dishes.length} 道菜品
        {dishes.length > itemsPerPage && (
          <span className="ml-2">
            (第 {currentPage}/{totalPages} 页，每页显示 {itemsPerPage} 条)
          </span>
        )}
      </div>
      
      <div className="space-y-3 p-2 max-w-full">
        {currentDishes.map((dish, index) => {
          const isAvailable = dish.availability === '有货';
          
          return (
            <Card key={dish.dish_id || (startIndex + index)} className="relative overflow-hidden w-full">
              <div className="flex items-start p-3 gap-3">
                {/* 小图片区域 - 手机优化 */}
                {dish.url && (
                  <div 
                    className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden rounded-lg cursor-pointer touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageClick(dish.url, dish.dish_name);
                    }}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <img 
                      src={dish.url} 
                      alt={dish.dish_name || 'dish image'}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                    {/* 放大图标提示 - 移动端优化 */}
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center sm:opacity-0 sm:hover:opacity-100 transition-opacity">
                      <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow-lg" />
                    </div>
                    {/* 图片上的评分 */}
                    {dish.rating && (
                      <div className="absolute top-0.5 left-0.5 bg-black/70 backdrop-blur-sm text-white px-1 py-0.5 rounded text-xs">
                        ⭐ {dish.rating}
                      </div>
                    )}
                  </div>
                )}
                
                {/* 主要内容区域 - 手机优化 */}
                <div className="flex-1 min-w-0">
                  {/* 标题和类别 */}
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate pr-2">
                      {dish.dish_name || 'Unknown Dish'}
                    </h3>
                    {dish.category && (
                      <Badge variant="outline" className="text-xs flex-shrink-0 ml-1">
                        {dish.category}
                      </Badge>
                    )}
                  </div>
                  
                  {/* 食材信息 */}
                  {dish.ingredients && (
                    <div className="text-xs sm:text-sm text-gray-600 mb-1.5">
                      <span className="inline-block mr-1">🥘</span>
                      <span className="font-medium">食材：</span>
                      <span className="text-orange-600">{dish.ingredients}</span>
                    </div>
                  )}
                  
                  {/* 营养信息 */}
                  {dish.nutrition && (
                    <div className="text-xs sm:text-sm text-gray-600 mb-1.5">
                      <span className="inline-block mr-1">🏥</span>
                      <span className="font-medium">营养：</span>
                      <span className="text-purple-600">{dish.nutrition}</span>
                    </div>
                  )}
                  
                  {/* 描述 */}
                  {dish.description && (
                    <p className="text-xs sm:text-sm text-gray-500 mb-2 line-clamp-2">
                      {dish.description}
                    </p>
                  )}
                  
                  {/* 底部信息：状态、价格、按钮 */}
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      {dish.availability && (
                        <Badge 
                          className={`${getAvailabilityColor(dish.availability)} text-white text-xs`}
                        >
                          {dish.availability}
                        </Badge>
                      )}
                      {/* 如果没有图片，在这里显示评分 */}
                      {!dish.url && dish.rating && (
                        <span className="text-xs sm:text-sm text-gray-600">
                          ⭐ {dish.rating}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* 价格 */}
                      <span className="text-lg sm:text-xl font-bold text-red-600">
                        {dish.price || '价格面议'}
                      </span>
                      
                      {/* 点餐按钮 */}
                      <Button
                        size="sm"
                        disabled={!isAvailable && dish.availability}
                        onClick={() => handleOrder(dish.dish_id, dish.dish_name, dish.price)}
                        className={`${(!isAvailable && dish.availability) ? "opacity-50 cursor-not-allowed" : ""} bg-red-500 hover:bg-red-600 text-xs px-2 py-1`}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        {(!isAvailable && dish.availability) ? '缺货' : '点餐'}
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
      {dishes.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-2 mt-6 pb-4">
          {/* 上一页按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevious}
            disabled={currentPage === 1}
            className="flex items-center gap-1"
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
                className={`min-w-[40px] ${currentPage === page ? 'bg-red-500 hover:bg-red-600' : ''}`}
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
            className="flex items-center gap-1"
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 图片放大模态框 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-full">
            {/* 关闭按钮 */}
            <button
              onClick={closeImageModal}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            
            {/* 放大的图片 */}
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* 图片标题 */}
            {selectedImage.name && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-3 rounded-b-lg">
                <h3 className="text-lg font-medium text-center">{selectedImage.name}</h3>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}