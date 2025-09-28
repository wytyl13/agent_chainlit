import { useState } from "react";
import { ChevronRight, MessageSquare, RefreshCw } from "lucide-react";

export default function Suggestions() {
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  
  // props 是全局注入的，不需要作为参数传递
  console.log('=== Suggestions 调试信息 ===');
  console.log('全局 props:', props);
  
  // 从props中获取suggestions数据
  let suggestions = [];
  
  if (Array.isArray(props)) {
    // 如果props直接是数组
    suggestions = props;
  } else if (props?.suggestions && Array.isArray(props.suggestions)) {
    // 如果props是字典，包含suggestions键
    suggestions = props.suggestions;
  } else if (props && typeof props === 'object') {
    // 查找数组类型的属性作为建议数据
    const arrayValues = Object.values(props).filter(val => Array.isArray(val));
    if (arrayValues.length > 0) {
      suggestions = arrayValues[0];
    }
  }
  
  // 只保留前三个建议
  suggestions = suggestions.slice(0, 3);
  
  console.log('处理后的建议数据:', suggestions);

  // 处理建议点击事件
  const handleSuggestionClick = (text) => {
    console.log("选择了建议:", text);
    // 调用Chainlit的sendUserMessage发送选中的问题
    if (typeof sendUserMessage === 'function') {
      sendUserMessage(text);
    }
  };

  // 无数据状态显示
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="mt-4 mb-6 p-4 border-2 border-yellow-300 bg-yellow-50 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-600 font-bold mb-2">
          <MessageSquare className="h-5 w-5" />
          暂无建议问题
        </div>
        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          <strong>🔧 调试信息:</strong>
          <div className="mt-1 space-y-1">
            <div><strong>原始Props:</strong> <pre className="text-xs bg-white p-1 rounded mt-1 overflow-auto max-h-32">{JSON.stringify(props, null, 2)}</pre></div>
            <div className="text-blue-600"><strong>💡 提示:</strong> 请检查props是否包含suggestions字段</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 完全透明的建议列表 */}
      <div>
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(-1)}
            className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors duration-150"
          >
            <span className="flex-1 text-sm text-gray-900 dark:text-white pr-3">
              {suggestion}
            </span>
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}