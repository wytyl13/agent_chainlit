import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Info } from "lucide-react"

export default function MenuCards() {
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

  const handleOrder = (dishId, dishName, price) => {
    console.log('点餐:', dishName, price);
    // 使用 Chainlit 提供的 sendUserMessage API
    sendUserMessage(`我要点餐：${dishName} (${price})`);
  };

  const handleViewDetails = (dishId, dishName) => {
    console.log('查看详情:', dishName);
    // 使用 Chainlit 提供的 sendUserMessage API
    sendUserMessage(`查看详情：${dishName}`);
  };

  const getAvailabilityColor = (availability) => {
    return availability === '有货' ? 'bg-green-500' : 'bg-red-500';
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
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {dishes.map((dish, index) => {
          const isAvailable = dish.availability === '有货';
          
          return (
            <Card key={dish.dish_id || index} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    {dish.dish_name || 'Unknown Dish'}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {dish.category || '未分类'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* 价格和评分 */}
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-red-600">
                    {dish.price || '价格面议'}
                  </span>
                  {dish.rating && (
                    <span className="text-sm text-gray-600">
                      ⭐ {dish.rating}
                    </span>
                  )}
                </div>
                
                {/* 食材和营养信息 */}
                {(dish.ingredients || dish.nutrition) && (
                  <div className="space-y-2 text-sm text-gray-600">
                    {dish.ingredients && (
                      <div>
                        <span className="font-medium">🥘 食材：</span>
                        {dish.ingredients}
                      </div>
                    )}
                    {dish.nutrition && (
                      <div>
                        <span className="font-medium">🏥 营养：</span>
                        {dish.nutrition}
                      </div>
                    )}
                  </div>
                )}
                
                {/* 描述 */}
                {dish.description && (
                  <p className="text-sm text-gray-500 italic">
                    {dish.description}
                  </p>
                )}
                
                {/* 状态和按钮 */}
                <div className="flex justify-between items-center pt-2">
                  {dish.availability && (
                    <Badge 
                      className={`${getAvailabilityColor(dish.availability)} text-white`}
                    >
                      {dish.availability}
                    </Badge>
                  )}
                  
                  <div className="flex gap-2 ml-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(dish.dish_id, dish.dish_name)}
                    >
                      <Info className="h-4 w-4 mr-1" />
                      详情
                    </Button>
                    
                    <Button
                      size="sm"
                      disabled={!isAvailable && dish.availability}
                      onClick={() => handleOrder(dish.dish_id, dish.dish_name, dish.price)}
                      className={(!isAvailable && dish.availability) ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      {(!isAvailable && dish.availability) ? '缺货' : '点餐'}
                    </Button>
                  </div>
                </div>
              </CardContent>
              
              {/* 缺货蒙层 */}
              {!isAvailable && dish.availability && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
                  <span className="text-red-600 font-bold text-lg">暂时缺货</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}