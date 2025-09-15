import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Globe, Link as LinkIcon } from "lucide-react"

export default function WebPreviewCard() {
  // props 是全局注入的，不需要作为参数传递
  console.log('=== WebPreviewCard 调试信息 ===');
  console.log('全局 props:', props);
  console.log('props 类型:', typeof props);
  console.log('props 是否为数组:', Array.isArray(props));
  
  // 处理数据结构
  let links = [];
  
  if (Array.isArray(props)) {
    // 如果 props 本身就是数组
    links = props;
  } else if (props && Array.isArray(props.data)) {
    // 如果 props 包含 data 数组
    links = props.data;
  } else if (props && typeof props === 'object') {
    // 如果是单个链接对象
    if (props.url && props.title) {
      links = [props];
    } else {
      // 尝试找到数组类型的属性
      const arrayValues = Object.values(props).filter(val => Array.isArray(val));
      if (arrayValues.length > 0) {
        links = arrayValues[0];
      }
    }
  }

  console.log('最终处理的 links:', links);
  console.log('links 长度:', links.length);

  const handleOpenLink = (url, title) => {
    console.log('打开链接:', title, url);
    // 使用 Chainlit 提供的 sendUserMessage API
    sendUserMessage(`访问链接：${title} - ${url}`);
    // 同时在新窗口打开链接
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = (url, title) => {
    console.log('复制链接:', title, url);
    navigator.clipboard.writeText(url).then(() => {
      sendUserMessage(`已复制链接：${title}`);
    }).catch(() => {
      sendUserMessage(`复制链接失败：${title}`);
    });
  };

  // 获取域名
  const getDomain = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'unknown';
    }
  };

  // 获取网站图标
  const getFavicon = (url) => {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
    } catch {
      return null;
    }
  };

  // 调试信息显示
  if (!links.length) {
    return (
      <div className="p-4 border-2 border-yellow-300 bg-yellow-50 rounded-lg">
        <div className="text-red-600 font-bold mb-2">🐛 调试信息：</div>
        <div className="space-y-2 text-xs">
          <div><strong>全局 props:</strong> <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(props, null, 2)}</pre></div>
          <div><strong>props 类型:</strong> {typeof props}</div>
          <div><strong>props 是否为数组:</strong> {Array.isArray(props).toString()}</div>
          <div><strong>links.length:</strong> {links.length}</div>
        </div>
        <div className="text-gray-500 mt-4 text-center">
          <div>暂无链接数据</div>
          <div className="text-xs mt-2 text-left">
            <strong>支持的JSON格式：</strong>
            <pre className="bg-gray-50 p-2 rounded mt-1 text-left">
{`// 单个链接
{ "url": "https://example.com", "title": "标题" }

// 包装格式
{ "link": { "url": "...", "title": "..." } }
{ "data": [{ "url": "...", "title": "..." }] }

// 多个链接
{ "links": [{ "url": "...", "title": "..." }] }`}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 成功状态的调试信息 */}
      <div className="p-2 bg-green-100 text-xs text-green-800 mb-4 rounded">
        <strong>✅ 成功:</strong> 找到 {links.length} 个链接
      </div>
      
      <div className="space-y-3 p-4 max-w-md">
        {links.map((linkItem, index) => {
          const domain = getDomain(linkItem.link || '');
          const favicon = getFavicon(linkItem.link || '');
          
          return (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {/* 网站图标 */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-gray-100 flex items-center justify-center overflow-hidden">
                    {favicon ? (
                      <img 
                        src={favicon} 
                        alt="favicon" 
                        className="w-6 h-6"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <Globe className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  {/* 内容区域 */}
                  <div className="flex-1 min-w-0">
                    {/* 标题 */}
                    <div className="font-medium text-gray-900 text-sm leading-tight mb-1 truncate">
                      {linkItem.title || '无标题'}
                    </div>
                    
                    {/* 描述（如果有的话）*/}
                    {linkItem.description && (
                      <div className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {linkItem.description}
                      </div>
                    )}
                    
                    {/* 域名和链接 */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400 truncate flex-1">
                        <LinkIcon className="w-3 h-3 inline mr-1" />
                        {domain}
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(linkItem.link, linkItem.title);
                          }}
                          title="复制链接"
                        >
                          <LinkIcon className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenLink(linkItem.link, linkItem.title);
                          }}
                          title="打开链接"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 点击整个卡片也能打开链接 */}
                <div 
                  className="absolute inset-0" 
                  onClick={() => handleOpenLink(linkItem.link, linkItem.title)}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}