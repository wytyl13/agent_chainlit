#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/04 14:04
@Author  : weiyutao
@File    : online_market.py
"""
from typing import (
    Optional,
    Dict,
    Any,
    List,
    overload,
    Type
)

from pydantic import Field, BaseModel
import re
import uuid
import json
from datetime import datetime, timedelta

from agent.base.base_tool import tool
from tools.utils import Utils

SOURCE_STORAGE_PATH = "/work/ai/agent_chainlit/api/source"
SOURCE_API_PREFIX = "https://ai.shunxikj.com:8890/api/files/download"


utils = Utils()
class FoodServiceSchema(BaseModel):

    type: str = Field(

        description="查看早餐、午餐、晚餐菜品信息"
    )
    dish_name: str = Field(
        default=None,
        description="查询的菜品名称，应该从"
    )

@tool
class FoodService:
    args_schema: Type[BaseModel] = FoodServiceSchema
    end_flag: int = 1
    
    
    @overload
    def __init__(
        self, 
    ):
        ...


    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        self.key_mapping = {
            "dish_id": "菜品编号",
            "dish_name": "菜品名称",
            "category": "菜品分类",
            "price": "价格", 
            "ingredients": "主要食材",
            "nutrition": "营养特点",
            "availability": "供应状态",
            "rating": "评分",
            "description": "菜品描述",
            "image": "菜品图片"
        }
        
        self.food_data_list = [
            {
                "dish_id": "001",
                "dish_name": "宫保鸡丁",
                "category": "川菜",
                "price": "¥28",
                "ingredients": "鸡肉、花生、青椒、红椒",
                "nutrition": "高蛋白、维生素C",
                "rating": "4.8",
                "availability": "有货",
                "description": "经典川菜，麻辣鲜香，鸡肉嫩滑配花生脆香",
                "url": f"{SOURCE_API_PREFIX}/宫保鸡丁.jpg"
            },
            {
                "dish_id": "002", 
                "dish_name": "红烧狮子头",
                "category": "淮扬菜",
                "price": "¥35",
                "ingredients": "猪肉、马蹄、冬菇、青菜",
                "nutrition": "高蛋白、膳食纤维",
                "rating": "4.6",
                "availability": "有货",
                "description": "淮扬名菜，肉质鲜嫩，汤汁醇厚，营养丰富",
                "url": f"{SOURCE_API_PREFIX}/红烧狮子头.jpg"
            },
            {
                "dish_id": "003",
                "dish_name": "清蒸鲈鱼",
                "category": "粤菜",
                "price": "¥42",
                "ingredients": "新鲜鲈鱼、蒸鱼豉油、葱丝",
                "nutrition": "高蛋白、低脂肪、DHA",
                "rating": "4.9",
                "availability": "缺货",
                "description": "粤式经典，鱼肉鲜嫩，保持原汁原味",
                "url": f"{SOURCE_API_PREFIX}/清蒸鲈鱼.jpg"
            },
            {
                "dish_id": "004",
                "dish_name": "麻婆豆腐",
                "category": "川菜",
                "price": "¥18",
                "ingredients": "嫩豆腐、牛肉末、豆瓣酱、花椒",
                "nutrition": "植物蛋白、钙质、维生素",
                "rating": "4.7",
                "availability": "有货",
                "description": "川菜经典，麻辣鲜香，豆腐嫩滑入味",
                "url": f"{SOURCE_API_PREFIX}/麻婆豆腐.jpg"
            },
            {
                "dish_id": "005",
                "dish_name": "糖醋排骨",
                "category": "家常菜",
                "price": "¥32",
                "ingredients": "猪排骨、番茄酱、糖、醋、生抽",
                "nutrition": "高蛋白、胶原蛋白、钙质",
                "rating": "4.8",
                "availability": "有货",
                "description": "酸甜可口，色泽红亮，老少皆宜的经典菜品",
                "url": f"{SOURCE_API_PREFIX}/糖醋排骨.jpg"
            },
            {
                "dish_id": "006",
                "dish_name": "蒜蓉西兰花",
                "category": "素菜",
                "price": "¥15",
                "ingredients": "新鲜西兰花、大蒜、蚝油",
                "nutrition": "维生素C、膳食纤维、叶酸",
                "rating": "4.5",
                "availability": "有货",
                "description": "清淡健康，营养丰富，蒜香浓郁",
                "url": f"{SOURCE_API_PREFIX}/蒜蓉西兰花.jpg"
            },
            {
                "dish_id": "007",
                "dish_name": "回锅肉",
                "category": "川菜",
                "price": "¥26",
                "ingredients": "五花肉、青椒、豆瓣酱、甜面酱",
                "nutrition": "蛋白质、脂肪、维生素",
                "rating": "4.6",
                "availability": "缺货",
                "description": "川菜之首，肥而不腻，香辣下饭",
                "url": f"{SOURCE_API_PREFIX}/回锅肉.jpg"
            },
            {
                "dish_id": "008",
                "dish_name": "西红柿鸡蛋",
                "category": "家常菜",
                "price": "¥12",
                "ingredients": "新鲜西红柿、鸡蛋、糖、盐",
                "nutrition": "优质蛋白、番茄红素、维生素",
                "rating": "4.9",
                "availability": "有货",
                "description": "国民家常菜，酸甜开胃，营养均衡",
                "url": f"{SOURCE_API_PREFIX}/西红柿鸡蛋.jpg"
            }
        ]
        self.food_name_list = [item["dish_name"] for item in self.food_data_list] 
        self.food_name_str = '、'.join(self.food_name_list)


    def simple_text_to_markdown(self, text):
        """简单的文本到Markdown转换"""
        if not text:
            return ""
        
        lines = text.split('\n')
        result = []
        
        for line in lines:
            line = line.strip()
            
            if not line:
                result.append("")
                continue
            
            # 转换键值对为粗体格式
            if '：' in line or ':' in line:
                parts = line.split('：' if '：' in line else ':', 1)
                if len(parts) == 2:
                    key, value = parts
                    result.append(f"**{key.strip()}：** {value.strip()}")
                    continue
            
            # 转换数字列表
            if re.match(r'^\d+[.)、]', line):
                cleaned = re.sub(r'^\d+[.)、]\s*', '', line)
                result.append(f"- {cleaned}")
                continue
            
            # 普通文本
            result.append(line)
        
        return '\n'.join(result)


    async def execute(
        self, 
        type: str = None,
        content: Optional[str] = None,
        is_ensure: int = 0,
        **kwargs
    ) -> Any:
        
        result = ""
        if type == "LIST":
            # 商品信息字段映射
            # 今日菜单数据
            data_list_str = json.dumps(self.food_data_list, ensure_ascii=False, indent=2)
            result = f"""
            <card name="MenuCards" content="为您查到{len(self.food_data_list)}条菜品信息：{self.food_name_str}，菜品详细信息如下：">{data_list_str}</card>
            """
        if type == "ORDER":
            dish_info = None
            for item in self.food_data_list:
                if item["dish_name"] == content or item["dish_name"] in content:
                    dish_info = item
            order_id = uuid.uuid4().hex
            dish_name = dish_info["dish_name"]
            dish_id = dish_info["dish_id"]
            current_time = datetime.now()
            delivery_time_start = current_time + timedelta(hours=1)
            delivery_time_end = current_time + timedelta(hours=1.5)
            arrive_start_time = delivery_time_start.strftime('%H:%M:%S')
            arrive_end_time = delivery_time_end.strftime('%H:%M:%S')
            price = dish_info["price"]
            address = "幸福小区3栋201室"
            result_order = f"""
            ===========================================
                           助餐订单
            ===========================================

            订单编号：{order_id}
            下单时间：{current_time}

            -------------------------------------------
                        订单详情
            -------------------------------------------
            菜品名称：{dish_name}
            菜品编号：{dish_id}
            份    数：1份
            单    价：{price}元/份
            总 金 额：{price}元

            -------------------------------------------
                        客户信息  
            -------------------------------------------
            客户姓名：张秀英
            送餐地址：{address}
            联系电话：138****5678

            -------------------------------------------
                        用餐安排
            -------------------------------------------
            用餐时间：今日午餐
            特殊要求：少放盐，口味清淡

            -------------------------------------------
                        配送信息
            -------------------------------------------
            预计送达：{arrive_start_time}-{arrive_end_time}

            ===========================================
                        订单确认完成
                    请妥善保管此订单凭证
            ===========================================
            """
            
            result_order_info = f"""
            🍽️ 助餐订单确认
            📋 订单详情
            菜品名称： {dish_name}
            菜品编号： {dish_id}
            份数： 1份
            单价： {price}元/份
            总金额： {price}元
            👤 客户信息
            客户姓名： 张秀英
            送餐地址： {address}
            联系电话： 138****5678
            🕐 用餐安排
            用餐时间： 今日午餐
            特殊要求： 少放盐，口味清淡
            """
            if not is_ensure:
                result = self.simple_text_to_markdown(result_order_info)
                result = result + "\n" + "<confirm>请确认您的订单？</confirm>"
            else:
                html_file_name = f"{uuid.uuid4().hex}.html"
                output_file = f"{SOURCE_STORAGE_PATH}/{html_file_name}"
                order_info_source = utils.generate_order_html(title="助餐订单", order_content=result_order, output_file=output_file)
                result = f"""<preview name="WebPreviewCard" content="已发送您的订单详情，请核对！">{SOURCE_API_PREFIX}/{html_file_name}</preview>"""
        # if type == "REWARD":
        #     result = """
        #     收到您的评价，我们后续优化菜品口感！
        #     """
        result = json.dumps(utils.parse_content(result), 
            ensure_ascii=False,  # 支持中文
            indent=2)
        for item in result:
            yield item
        return
