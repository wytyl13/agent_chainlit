import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Info } from "lucide-react"

export default function MenuCards() {
  const handleOrder = (dishId, dishName, price) => {
    // 发送用户消息到 Chainlit
    sendUserMessage(`我要点餐：${dishName} (${price})`);
  };

  const handleViewDetails = (dishId, dishName) => {
    sendUserMessage(`查看详情：${dishName}`);
  };

  const getAvailabilityColor = (availability) => {
    return availability === '有货' ? 'bg-green-500' : 'bg-red-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {props.dishes?.map((dish, index) => {
        const isAvailable = dish.availability === '有货';
        
        return (
          <Card key={dish.dish_id || index} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  {dish.dish_name}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {dish.category}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* 价格和评分 */}
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-red-600">
                  {dish.price}
                </span>
                <span className="text-sm text-gray-600">
                  ⭐ {dish.rating}
                </span>
              </div>
              
              {/* 食材和营养信息 */}
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">🥘 食材：</span>
                  {dish.ingredients}
                </div>
                <div>
                  <span className="font-medium">🏥 营养：</span>
                  {dish.nutrition}
                </div>
              </div>
              
              {/* 描述 */}
              <p className="text-sm text-gray-500 italic">
                {dish.description}
              </p>
              
              {/* 状态和按钮 */}
              <div className="flex justify-between items-center pt-2">
                <Badge 
                  className={`${getAvailabilityColor(dish.availability)} text-white`}
                >
                  {dish.availability}
                </Badge>
                
                <div className="flex gap-2">
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
                    disabled={!isAvailable}
                    onClick={() => handleOrder(dish.dish_id, dish.dish_name, dish.price)}
                    className={isAvailable ? "" : "opacity-50 cursor-not-allowed"}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    {isAvailable ? '点餐' : '缺货'}
                  </Button>
                </div>
              </div>
            </CardContent>
            
            {/* 缺货蒙层 */}
            {!isAvailable && (
              <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
                <span className="text-red-600 font-bold text-lg">暂时缺货</span>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}