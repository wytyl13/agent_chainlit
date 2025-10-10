import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart, X, ZoomIn, ChevronLeft, ChevronRight, Star, Award, Truck } from "lucide-react"
import { useState } from "react"

export default function ShanxiVinegarCards() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2; // 每页显示2个产品
  
  // 山西老陈醋产品数据
  const vinegarProducts = [
    {
      product_id: 1,
      product_name: "山西老陈醋 陈年500ml",
      brand: "东湖牌",
      specification: "500ml/瓶",
      aging_years: "3年陈酿",
      acidity: "6°",
      category: "调味品",
      description: "采用传统工艺酿制，醋香浓郁，酸甜适中，是烹饪和调味的首选。经过3年陈酿，口感醇厚，营养丰富。",
      ingredients: "高粱、麸皮、谷糠、水",
      nutrition: "富含氨基酸、有机酸、维生素B族",
      price: "¥28.8",
      original_price: "¥35.0",
      availability: "有货",
      stock_count: 156,
      rating: "4.8",
      review_count: 2168,
      origin: "山西太原",
      production_date: "2024-10",
      shelf_life: "3年",
      url: "https://img2.baidu.com/it/u=3569742284,686720831&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500",
      certificates: ["有机认证", "ISO9001", "HACCP"],
      features: ["传统工艺", "无添加剂", "陈年发酵"]
    }
  ];

  // 分页计算
  const totalPages = Math.ceil(vinegarProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = vinegarProducts.slice(startIndex, endIndex);

  const handleOrder = (productId, productName, price) => {
    console.log('下单:', productName, price);
    if (typeof sendUserMessage === 'function') {
      sendUserMessage(`我要订购：${productName} - ${price}`);
    }
  };

  const getAvailabilityColor = (availability) => {
    return availability === '有货' ? 'bg-green-500' : 'bg-red-500';
  };

  // 处理图片加载错误
  const handleImageError = (e) => {
    e.target.src = "https://images.unsplash.com/photo-1609501676725-7186f078e5e4?w=400&h=300&fit=crop";
  };

  // 处理图片点击放大
  const handleImageClick = (imageUrl, productName) => {
    setSelectedImage({ url: imageUrl, name: productName });
  };

  // 关闭图片放大视图
  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // 分页控制函数
  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* 页面标题 */}
      <div style={{
        backgroundColor: 'darkred',
        color: 'white',
        padding: '16px',
        borderRadius: '12px 12px 0 0',
        marginBottom: '0',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
          🍶 山西老陈醋精品订购
        </h1>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
          传承千年酿造工艺 • 品味醇香陈年老醋
        </p>
      </div>

      {/* 成功状态信息 */}
      <div style={{
        padding: '12px',
        backgroundColor: 'lightgreen',
        color: 'darkgreen',
        fontSize: '14px',
        borderLeft: '4px solid green',
        marginBottom: '16px'
      }}>
        <strong>✅ 商品加载成功：</strong> 共找到 {vinegarProducts.length} 款山西老陈醋产品
        {vinegarProducts.length > itemsPerPage && (
          <span style={{ marginLeft: '8px' }}>
            (第 {currentPage}/{totalPages} 页，每页显示 {itemsPerPage} 款)
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px' }}>
        {currentProducts.map((product, index) => {
          const isAvailable = product.availability === '有货';
          
          return (
            <Card key={product.product_id} style={{
              border: '2px solid #e5e5e5',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '300px 1fr',
                gap: '20px',
                padding: '20px'
              }}>
                {/* 左侧图片区域 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* 主图片 */}
                  <div 
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '200px',
                      overflow: 'hidden',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: '2px solid #ddd'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageClick(product.url, product.product_name);
                    }}
                  >
                    <img 
                      src={product.url} 
                      alt={product.product_name}
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
                      <ZoomIn style={{ height: '24px', width: '24px', color: 'white' }} />
                    </div>
                    
                    {/* 评分标签 */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Star style={{ height: '12px', width: '12px', fill: 'gold', color: 'gold' }} />
                      {product.rating}
                    </div>

                    {/* 库存标签 */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: isAvailable ? 'green' : 'red',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {product.availability}
                    </div>
                  </div>

                  {/* 认证标识 */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {product.certificates.map((cert, i) => (
                      <Badge key={i} style={{
                        backgroundColor: 'gold',
                        color: 'darkred',
                        fontSize: '10px',
                        padding: '2px 6px'
                      }}>
                        <Award style={{ height: '10px', width: '10px', marginRight: '2px' }} />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* 右侧信息区域 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* 标题和品牌 */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: 'darkred',
                        margin: 0,
                        lineHeight: '1.2'
                      }}>
                        {product.product_name}
                      </h3>
                      <Badge style={{
                        backgroundColor: 'darkred',
                        color: 'white',
                        fontSize: '12px'
                      }}>
                        {product.category}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: 'gray' }}>
                      <span><strong>品牌：</strong>{product.brand}</span>
                      <span><strong>规格：</strong>{product.specification}</span>
                      <span><strong>年份：</strong>{product.aging_years}</span>
                    </div>
                  </div>

                  {/* 产品特色 */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {product.features.map((feature, i) => (
                      <Badge key={i} style={{
                        backgroundColor: 'orange',
                        color: 'white',
                        fontSize: '11px'
                      }}>
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* 产品描述 */}
                  <p style={{
                    fontSize: '14px',
                    color: 'gray',
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {product.description}
                  </p>
                  
                  {/* 详细信息网格 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    fontSize: '13px'
                  }}>
                    <div style={{ padding: '8px', backgroundColor: 'aliceblue', borderRadius: '4px' }}>
                      <div style={{ color: 'blue', fontWeight: 'bold' }}>🌾 主要原料</div>
                      <div style={{ color: 'darkblue' }}>{product.ingredients}</div>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'lightgreen', borderRadius: '4px' }}>
                      <div style={{ color: 'green', fontWeight: 'bold' }}>💊 营养成分</div>
                      <div style={{ color: 'darkgreen' }}>{product.nutrition}</div>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'lightyellow', borderRadius: '4px' }}>
                      <div style={{ color: 'orange', fontWeight: 'bold' }}>📍 产地</div>
                      <div style={{ color: 'darkorange' }}>{product.origin}</div>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'lavender', borderRadius: '4px' }}>
                      <div style={{ color: 'purple', fontWeight: 'bold' }}>⏰ 保质期</div>
                      <div style={{ color: 'darkviolet' }}>{product.shelf_life}</div>
                    </div>
                  </div>

                  {/* 评价信息 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '14px',
                    color: 'gray',
                    padding: '8px',
                    backgroundColor: 'whitesmoke',
                    borderRadius: '4px'
                  }}>
                    <span>⭐ {product.rating}分</span>
                    <span>📝 {product.review_count}条评价</span>
                    <span>📦 库存{product.stock_count}件</span>
                    <span>🚚 <Truck style={{ height: '14px', width: '14px', display: 'inline' }} /> 包邮</span>
                  </div>
                  
                  {/* 底部价格和购买 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 'auto',
                    padding: '12px',
                    backgroundColor: 'mistyrose',
                    borderRadius: '8px',
                    border: '1px solid pink'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: 'red'
                      }}>
                        {product.price}
                      </span>
                      {product.original_price && (
                        <span style={{
                          fontSize: '16px',
                          color: 'gray',
                          textDecoration: 'line-through'
                        }}>
                          {product.original_price}
                        </span>
                      )}
                      {product.original_price && (
                        <Badge style={{
                          backgroundColor: 'red',
                          color: 'white',
                          fontSize: '11px'
                        }}>
                          省{(parseFloat(product.original_price.replace('¥', '')) - parseFloat(product.price.replace('¥', ''))).toFixed(1)}元
                        </Badge>
                      )}
                    </div>
                    
                    <Button
                      disabled={!isAvailable}
                      onClick={() => handleOrder(product.product_id, product.product_name, product.price)}
                      style={{
                        backgroundColor: isAvailable ? 'darkred' : 'gray',
                        color: 'white',
                        padding: '8px 20px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        opacity: isAvailable ? 1 : 0.6
                      }}
                    >
                      <ShoppingCart style={{ height: '16px', width: '16px', marginRight: '6px' }} />
                      {isAvailable ? '立即订购' : '暂时缺货'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 分页控件 */}
      {vinegarProducts.length > itemsPerPage && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          marginTop: '24px',
          paddingBottom: '16px'
        }}>
          <Button
            variant="outline"
            onClick={goToPrevious}
            disabled={currentPage === 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px'
            }}
          >
            <ChevronLeft style={{ height: '16px', width: '16px' }} />
            上一页
          </Button>

          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => goToPage(page)}
                style={{
                  minWidth: '44px',
                  height: '36px',
                  backgroundColor: currentPage === page ? 'darkred' : 'white',
                  color: currentPage === page ? 'white' : 'darkred',
                  border: '1px solid darkred'
                }}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={goToNext}
            disabled={currentPage === totalPages}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px'
            }}
          >
            下一页
            <ChevronRight style={{ height: '16px', width: '16px' }} />
          </Button>
        </div>
      )}

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