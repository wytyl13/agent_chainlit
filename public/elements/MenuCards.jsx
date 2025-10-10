import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart, X, ZoomIn, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from "lucide-react"
import { useState, useEffect, useCallback } from "react"

export default function MenuCards() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const itemsPerPage = 3; // 每页显示3条数据
  
  // props 是全局注入的，不需要作为参数传递
  console.log('=== MenuCards 调试信息 ===');
  console.log('全局 props:', props);
  
  // 从props中获取API配置和静态数据
  // 支持多种格式：直接URL、API配置对象、静态数据
  let apiConfig = null;
  let staticData = null;
  
  if (typeof props === 'string') {
    // 如果props是字符串，当作URL处理
    apiConfig = { url: props, method: 'GET', param_dict: {} };
  } else if (props?.url) {
    // 如果props包含url字段，说明是API配置
    apiConfig = {
      url: props.url,
      method: props.method || 'GET',
      param_dict: props.param_dict || {}
    };
  } else if (props?.apiUrl || props?.api_url) {
    // 兼容原来的apiUrl格式
    apiConfig = {
      url: props.apiUrl || props.api_url,
      method: 'GET',
      param_dict: {}
    };
  } else if (Array.isArray(props)) {
    // 如果props直接是数组，作为静态数据
    staticData = props;
  } else if (props?.data && Array.isArray(props.data)) {
    // 如果props包含data数组
    staticData = props.data;
  } else if (props && typeof props === 'object') {
    // 查找数组类型的属性作为静态数据
    const arrayValues = Object.values(props).filter(val => Array.isArray(val));
    if (arrayValues.length > 0) {
      staticData = arrayValues[0];
    }
  }

  // 数据获取函数 - 修复依赖项
  const fetchData = useCallback(async (showLoading = true) => {
    if (!apiConfig) {
      // 如果没有提供API配置，使用静态数据
      console.log('没有API配置，使用静态数据');
      console.log('静态数据:', staticData);
      
      if (staticData && Array.isArray(staticData)) {
        setDishes(staticData);
      } else {
        setDishes([]);
      }
      return;
    }

    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      console.log('🚀 正在从API获取数据:', apiConfig);
      
      // 根据方法准备请求配置
      const requestConfig = {
        method: apiConfig.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // 如果是POST方法且有参数，添加到请求体
      if (apiConfig.method === 'POST' && apiConfig.param_dict) {
        requestConfig.body = JSON.stringify(apiConfig.param_dict);
      }

      console.log('📤 请求配置:', requestConfig);
      console.log('🔗 请求URL:', apiConfig.url);

      const response = await fetch(apiConfig.url, requestConfig);

      console.log('📥 响应状态:', response.status, response.statusText);
      console.log('📥 响应头:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP错误响应内容:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, content: ${errorText}`);
      }

      const rawText = await response.text();
      console.log('📄 原始响应文本:', rawText);
      
      let data;
      try {
        data = JSON.parse(rawText);
        console.log('✅ JSON解析成功:', data);
      } catch (parseError) {
        console.error('❌ JSON解析失败:', parseError);
        console.error('❌ 原始文本:', rawText);
        throw new Error(`JSON解析失败: ${parseError.message}`);
      }

      // 处理不同的数据格式
      let newDishes = [];
      if (Array.isArray(data)) {
        newDishes = data;
      } else if (data && Array.isArray(data.data)) {
        newDishes = data.data;
      } else if (data && Array.isArray(data.dishes)) {
        newDishes = data.dishes;
      } else if (data && Array.isArray(data.result)) {
        newDishes = data.result;
      } else if (data && typeof data === 'object') {
        const arrayValues = Object.values(data).filter(val => Array.isArray(val));
        if (arrayValues.length > 0) {
          newDishes = arrayValues[0];
        }
      }

      console.log('处理后的菜品数据:', newDishes);
      setDishes(newDishes);
      setLastRefresh(new Date());

    } catch (err) {
      console.error('获取数据失败:', err);
      setError(err.message);
      
      // 错误时回退到静态数据
      if (staticData && Array.isArray(staticData)) {
        setDishes(staticData);
      }
    } finally {
      setLoading(false);
    }
  }, []); // 移除所有依赖项，避免无限循环

  // 初始化数据获取 - 重新设计
  useEffect(() => {
    console.log('=== 组件初始化，开始处理数据 ===');
    
    // 直接在这里处理数据，避免函数依赖问题
    async function initializeData() {
      if (!apiConfig) {
        // 如果没有提供API配置，使用静态数据
        console.log('使用静态数据模式');
        if (staticData && Array.isArray(staticData)) {
          setDishes(staticData);
        } else {
          setDishes([]);
        }
        return;
      }

      // 有API配置，调用API获取数据
      console.log('使用API模式，开始获取数据');
      setLoading(true);
      setError(null);

      try {
        const requestConfig = {
          method: apiConfig.method,
          headers: {
            'Content-Type': 'application/json',
          },
        };

        if (apiConfig.method === 'POST' && apiConfig.param_dict) {
          requestConfig.body = JSON.stringify(apiConfig.param_dict);
        }

        const response = await fetch(apiConfig.url, requestConfig);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API数据获取成功:', data);

        // 处理不同的数据格式
        let newDishes = [];
        if (Array.isArray(data)) {
          newDishes = data;
        } else if (data && Array.isArray(data.data)) {
          newDishes = data.data;
        } else if (data && Array.isArray(data.dishes)) {
          newDishes = data.dishes;
        } else if (data && typeof data === 'object') {
          const arrayValues = Object.values(data).filter(val => Array.isArray(val));
          if (arrayValues.length > 0) {
            newDishes = arrayValues[0];
          }
        }

        setDishes(newDishes);
        setLastRefresh(new Date());

      } catch (err) {
        console.error('数据获取失败:', err);
        setError(err.message);
        
        // 错误时回退到静态数据
        if (staticData && Array.isArray(staticData)) {
          setDishes(staticData);
        } else {
          setDishes([]);
        }
      } finally {
        setLoading(false);
      }
    }

    initializeData();
  }, []); // 只在组件挂载时执行一次

  // 手动刷新数据 - 简化版本
  const handleRefresh = async () => {
    if (!apiConfig) return;
    
    console.log('手动刷新数据');
    setLoading(true);
    setError(null);

    try {
      const requestConfig = {
        method: apiConfig.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (apiConfig.method === 'POST' && apiConfig.param_dict) {
        requestConfig.body = JSON.stringify(apiConfig.param_dict);
      }

      const response = await fetch(apiConfig.url, requestConfig);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('手动刷新获取数据成功:', data);

      // 处理不同的数据格式
      let newDishes = [];
      if (Array.isArray(data)) {
        newDishes = data;
      } else if (data && Array.isArray(data.data)) {
        newDishes = data.data;
      } else if (data && Array.isArray(data.dishes)) {
        newDishes = data.dishes;
      } else if (data && typeof data === 'object') {
        const arrayValues = Object.values(data).filter(val => Array.isArray(val));
        if (arrayValues.length > 0) {
          newDishes = arrayValues[0];
        }
      }

      setDishes(newDishes);
      setLastRefresh(new Date());

    } catch (err) {
      console.error('手动刷新失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 分页计算
  const totalPages = Math.ceil(dishes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDishes = dishes.slice(startIndex, endIndex);

  const handleOrder = (dishId, dishName, price) => {
    console.log('点餐:', dishName, price);
    // 使用 Chainlit 提供的 sendUserMessage API
    if (typeof sendUserMessage === 'function') {
      sendUserMessage(`我要点餐：${dishName}`);
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

  // 分页控制函数 - 纯前端分页，不调用API
  const goToPage = (page) => {
    console.log(`切换到第${page}页`);
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      console.log(`从第${currentPage}页切换到第${currentPage - 1}页`);
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      console.log(`从第${currentPage}页切换到第${currentPage + 1}页`);
      setCurrentPage(currentPage + 1);
    }
  };

  // 错误状态显示
  if (error && !dishes.length) {
    return (
      <div className="p-4 border-2 border-red-300 bg-red-50 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 font-bold mb-2">
          <AlertCircle className="h-5 w-5" />
          数据获取失败
        </div>
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={handleRefresh} className="bg-red-500 hover:bg-red-600">
          <RefreshCw className="h-4 w-4 mr-2" />
          重试
        </Button>
        <div className="text-xs text-gray-500 mt-4 bg-gray-100 p-2 rounded">
          <strong>🔧 调试信息:</strong>
          <div>API配置: {apiConfig ? JSON.stringify(apiConfig, null, 2) : '无'}</div>
          <div>静态数据长度: {staticData ? (Array.isArray(staticData) ? staticData.length : '非数组') : '无'}</div>
          <div>原始Props: {JSON.stringify(props, null, 2)}</div>
        </div>
      </div>
    );
  }

  // 无数据状态显示
  if (!loading && !dishes.length) {
    return (
      <div className="p-4 border-2 border-yellow-300 bg-yellow-50 rounded-lg">
        <div className="text-yellow-600 font-bold mb-2">📭 暂无菜单数据</div>
        {apiConfig && (
          <Button onClick={handleRefresh} className="mb-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        )}
        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          <strong>🔧 调试信息:</strong>
          <div className="mt-1 space-y-1">
            <div><strong>API配置:</strong> {apiConfig ? JSON.stringify(apiConfig, null, 2) : '无'}</div>
            <div><strong>静态数据:</strong> {staticData ? (Array.isArray(staticData) ? `数组(${staticData.length}项)` : typeof staticData) : '无'}</div>
            <div><strong>原始Props:</strong> <pre className="text-xs bg-white p-1 rounded mt-1 overflow-auto max-h-32">{JSON.stringify(props, null, 2)}</pre></div>
            <div className="text-blue-600"><strong>💡 提示:</strong> 请检查浏览器控制台的详细API调用日志</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 状态信息栏 */}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg mb-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">
              ✅ 共 {dishes.length} 道菜品
            </span>
            {dishes.length > itemsPerPage && (
              <span className="text-gray-600 text-sm">
                (第 {currentPage}/{totalPages} 页)
              </span>
            )}
            {apiConfig && (
              <Badge variant="outline" className="text-xs">
                动态数据 ({apiConfig.method})
              </Badge>
            )}
            {!apiConfig && staticData && (
              <Badge variant="outline" className="text-xs">
                静态数据
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {lastRefresh && (
              <span className="text-xs text-gray-500">
                更新于: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            {apiConfig && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            )}
          </div>
        </div>
        
        {/* API配置信息显示 */}
        {apiConfig && (
          <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
            🔗 API: {apiConfig.method} {apiConfig.url}
            {Object.keys(apiConfig.param_dict).length > 0 && (
              <span className="ml-2">参数: {JSON.stringify(apiConfig.param_dict)}</span>
            )}
          </div>
        )}
        
        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            ⚠️ {error} (显示缓存数据)
          </div>
        )}
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center gap-2 text-gray-600">
            <RefreshCw className="h-5 w-5 animate-spin" />
            正在获取最新数据...
          </div>
        </div>
      )}
      
      <div className="space-y-3 p-2 max-w-full">
        {currentDishes.map((dish, index) => {
          const isAvailable = dish.availability === '有货';
          // 兼容不同的ID字段格式
          const dishId = dish.dish_id || dish.id || (startIndex + index);
          // 兼容不同的名称字段格式  
          const dishName = dish.dish_name || dish.name || 'Unknown Dish';
          // 格式化价格显示
          const formattedPrice = dish.price ? 
            (typeof dish.price === 'number' ? `¥${dish.price}` : dish.price) : 
            '价格面议';
          
          return (
            <Card key={dishId} className="relative overflow-hidden w-full">
              <div className="flex items-start p-3 gap-3">
                {/* 小图片区域 - 手机优化 */}
                {dish.url && (
                  <div 
                    className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden rounded-lg cursor-pointer touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageClick(dish.url, dishName);
                    }}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <img 
                      src={dish.url} 
                      alt={dishName}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                    {/* 放大图标提示 - 移动端优化 */}
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center sm:opacity-0 sm:hover:opacity-100 transition-opacity">
                      <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow-lg" />
                    </div>
                    {/* 图片上的评分 */}
                    {dish.rating && dish.rating > 0 && (
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
                      {dishName}
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
                      {!dish.url && dish.rating && dish.rating > 0 && (
                        <span className="text-xs sm:text-sm text-gray-600">
                          ⭐ {dish.rating}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* 价格 */}
                      <span className="text-lg sm:text-xl font-bold text-red-600">
                        {formattedPrice}
                      </span>
                      
                      {/* 点餐按钮 */}
                      <Button
                        size="sm"
                        disabled={!isAvailable && dish.availability}
                        onClick={() => handleOrder(dishId, dishName, formattedPrice)}
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