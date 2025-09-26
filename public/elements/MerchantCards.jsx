import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Phone, MapPin, Users, Star, ChevronLeft, ChevronRight, RefreshCw, AlertCircle, Building, FileText } from "lucide-react"
import { useState, useEffect, useCallback } from "react"

export default function MerchantCards() {
  const [currentPage, setCurrentPage] = useState(1);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const itemsPerPage = 3; // 每页显示3条数据
  
  // props 是全局注入的，不需要作为参数传递
  console.log('=== MerchantCards 调试信息 ===');
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
    } else {
      // 如果props是单个商家对象，包装成数组
      if (props.merchant_name || props.name) {
        staticData = [props];
      }
    }
  }

  // 初始化数据获取
  useEffect(() => {
    console.log('=== 组件初始化，开始处理数据 ===');
    
    async function initializeData() {
      if (!apiConfig) {
        // 如果没有提供API配置，使用静态数据
        console.log('使用静态数据模式');
        if (staticData && Array.isArray(staticData)) {
          setMerchants(staticData);
        } else {
          setMerchants([]);
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
        let newMerchants = [];
        if (Array.isArray(data)) {
          newMerchants = data;
        } else if (data && Array.isArray(data.data)) {
          newMerchants = data.data;
        } else if (data && Array.isArray(data.merchants)) {
          newMerchants = data.merchants;
        } else if (data && typeof data === 'object') {
          const arrayValues = Object.values(data).filter(val => Array.isArray(val));
          if (arrayValues.length > 0) {
            newMerchants = arrayValues[0];
          } else if (data.merchant_name || data.name) {
            newMerchants = [data];
          }
        }

        setMerchants(newMerchants);
        setLastRefresh(new Date());

      } catch (err) {
        console.error('数据获取失败:', err);
        setError(err.message);
        
        // 错误时回退到静态数据
        if (staticData && Array.isArray(staticData)) {
          setMerchants(staticData);
        } else {
          setMerchants([]);
        }
      } finally {
        setLoading(false);
      }
    }

    initializeData();
  }, []); // 只在组件挂载时执行一次

  // 手动刷新数据
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
      let newMerchants = [];
      if (Array.isArray(data)) {
        newMerchants = data;
      } else if (data && Array.isArray(data.data)) {
        newMerchants = data.data;
      } else if (data && Array.isArray(data.merchants)) {
        newMerchants = data.merchants;
      } else if (data && typeof data === 'object') {
        const arrayValues = Object.values(data).filter(val => Array.isArray(val));
        if (arrayValues.length > 0) {
          newMerchants = arrayValues[0];
        } else if (data.merchant_name || data.name) {
          newMerchants = [data];
        }
      }

      setMerchants(newMerchants);
      setLastRefresh(new Date());

    } catch (err) {
      console.error('手动刷新失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 分页计算
  const totalPages = Math.ceil(merchants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMerchants = merchants.slice(startIndex, endIndex);

  const handleContact = (merchantName, phone) => {
    console.log('联系商家:', merchantName, phone);
    // 使用 Chainlit 提供的 sendUserMessage API
    if (typeof sendUserMessage === 'function') {
      sendUserMessage(`我要联系商家：${merchantName}，电话：${phone}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '启用':
      case 'active':
      case '正常':
        return 'bg-green-500';
      case '禁用':
      case 'inactive':
      case '暂停':
        return 'bg-red-500';
      case '审核中':
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 分页控制函数
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
  if (error && !merchants.length) {
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
  if (!loading && !merchants.length) {
    return (
      <div className="p-4 border-2 border-yellow-300 bg-yellow-50 rounded-lg">
        <div className="text-yellow-600 font-bold mb-2">🏪 暂无商家数据</div>
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
              ✅ 共 {merchants.length} 家商家
            </span>
            {merchants.length > itemsPerPage && (
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
      
      <div className="space-y-4 p-2 max-w-full">
        {currentMerchants.map((merchant, index) => {
          // 兼容不同的字段格式
          const merchantId = merchant.merchant_id || merchant.id || (startIndex + index);
          const merchantName = merchant.merchant_name || merchant.name || 'Unknown Merchant';
          const isActive = merchant.status === '启用' || merchant.status === 'active' || merchant.status === '正常';
          
          return (
            <Card key={merchantId} className="relative overflow-hidden w-full">
              <div className="p-4">
                {/* 头部：商家名称、类别、状态 */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                      <Building className="h-5 w-5 text-blue-600" />
                      {merchantName}
                    </h3>
                    {merchant.category && (
                      <Badge variant="outline" className="text-sm">
                        {merchant.category}
                      </Badge>
                    )}
                  </div>
                  
                  {/* 状态和评分 */}
                  <div className="flex flex-col items-end gap-2">
                    {merchant.status && (
                      <Badge 
                        className={`${getStatusColor(merchant.status)} text-white text-sm`}
                      >
                        {merchant.status}
                      </Badge>
                    )}
                    {merchant.rating && merchant.rating > 0 && (
                      <div className="flex items-center gap-1 text-orange-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-bold">{merchant.rating}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 详细信息网格 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {/* 联系信息 */}
                  {merchant.contact_person && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 font-medium min-w-[60px]">联系人:</span>
                      <span className="text-gray-800">{merchant.contact_person}</span>
                    </div>
                  )}
                  
                  {merchant.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">{merchant.phone}</span>
                    </div>
                  )}
                  
                  {/* 地址信息 */}
                  {merchant.address && (
                    <div className="md:col-span-2 flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{merchant.address}</span>
                    </div>
                  )}
                  
                  {/* 服务区域 */}
                  {merchant.service_area && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 font-medium min-w-[60px]">服务区域:</span>
                      <span className="text-blue-600">{merchant.service_area}</span>
                    </div>
                  )}
                  
                  {/* 容量 */}
                  {merchant.capacity && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-gray-700">容量: {merchant.capacity}人</span>
                    </div>
                  )}
                </div>

                {/* 证件信息 */}
                {(merchant.business_license || merchant.food_license) && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">证件信息</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      {merchant.business_license && (
                        <div>营业执照: {merchant.business_license}</div>
                      )}
                      {merchant.food_license && (
                        <div>食品许可证: {merchant.food_license}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* 描述 */}
                {merchant.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                      {merchant.description}
                    </p>
                  </div>
                )}

                {/* 底部操作按钮 */}
                <div className="flex justify-end gap-2">
                  {merchant.phone && (
                    <Button
                      size="sm"
                      onClick={() => handleContact(merchantName, merchant.phone)}
                      className="bg-green-500 hover:bg-green-600 text-sm"
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      联系商家
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (typeof sendUserMessage === 'function') {
                        sendUserMessage(`查看商家详情：${merchantName}`);
                      }
                    }}
                    className="text-sm"
                  >
                    查看详情
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 分页控件 */}
      {merchants.length > itemsPerPage && (
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
                className={`min-w-[40px] ${currentPage === page ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
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
    </div>
  );
}