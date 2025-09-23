#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/16 
@Author  : weiyutao
@File    : order_food_service.py
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
import pytz
from pypinyin import pinyin, lazy_pinyin, Style

from agent.base.base_tool import tool
from tools.utils import Utils
from api.server.start.order_food_server import OrderFoodServer
from api.server.start.order_food_server import OrderFoodRequest
from api.server.start.menu_server import MenuDataServer
from api.server.start.menu_server import ListMenuData
import pandas as pd

SOURCE_STORAGE_PATH = "/work/ai/agent_chainlit/api/source"
SOURCE_API_PREFIX = "https://ai.shunxikj.com:8890/api/files/download"

menu_data_service = MenuDataServer(sql_config_path="/work/ai/agent_chainlit/config/yaml/sql_config.yaml")
# menu_data_list = None
# async def main():
#     menu_data = ListMenuData()
#     response = await menu_data_service.post_menu_data(menu_data)
#     menu_data_list = utils.parse_server_return(response=response)
    
# fish_name = [item["dish_name"] for item in menu_data_list]    

utils = Utils()





class OrderFoodToolSchema(BaseModel):
    is_ensure: int = Field(
        default=None,
        description="用户是否已经明确确认订单：0=用户没有确认点餐；1=用户确认了点餐"
    )
    operation: str = Field(
        description="根据上下文历史会话消息提取订单操作类型: str = <LIST: 查看订单, ADD: 创建订单, UPDATE: 修改订单, DELETE: 删除订单, STATUS: 更新订单状态>"
    )
    order_id: Optional[str] = Field(
        default=None,
        description="订单ID，查询、修改、删除订单时必需，创建订单时可选，严格按照上下文，不要臆想"
    )
    customer_address: Optional[str] = Field(
        default=None,
        description="客户地址，创建订单时必需，严格按照上下文，不要臆想"
    )
    product_vo_list: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description=f"""商品列表，创建订单时必需，格式为[{{'name': '菜品名', 'unitPrice': 价格, 'quantity': 数量}}]，严格按照上下文，不要臆想，菜品名字必须从上下文提供的菜品信息中找对应的名称"""
    )
    total_amount: Optional[float] = Field(
        default=None,
        description="订单总金额，创建订单时必需，严格按照上下文，不要臆想"
    )
    order_type: Optional[str] = Field(
        default=None,
        description="订单类型，如：外卖、堂食、打包等，严格按照上下文，不要臆想"
    )
    

@tool
class OrderFoodTool:
    args_schema: Type[BaseModel] = OrderFoodToolSchema
    end_flag: int = 1
    
    @overload
    def __init__(
        self, 
    ):
        ...

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.order_server = OrderFoodServer(sql_config_path="/work/ai/agent_chainlit/config/yaml/sql_config.yaml")
    
    
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
    
    
    def chinese_to_pinyin(self, text, style='normal'):
        """
        将汉字转换为拼音
        :param text: 中文文本
        :param style: 拼音样式 ('normal', 'first_letter', 'tone', 'tone_num')
        :return: 拼音字符串
        """
        if not text:
            return ""
        
        if style == 'normal':
            # 不带声调的拼音
            result = lazy_pinyin(text, style=Style.NORMAL)
            return '_'.join(result)
        elif style == 'first_letter':
            # 只取首字母
            result = lazy_pinyin(text, style=Style.FIRST_LETTER)
            return ''.join(result)
        elif style == 'tone':
            # 带声调符号的拼音
            result = lazy_pinyin(text, style=Style.TONE)
            return '_'.join(result)
        elif style == 'tone_num':
            # 带数字声调的拼音
            result = lazy_pinyin(text, style=Style.TONE2)
            return '_'.join(result)
        else:
            result = lazy_pinyin(text)
            return '_'.join(result)
    
    
    def create_simple_dataframe(self, data):
        """创建简单的DataFrame，处理复杂对象"""
        if not data:
            return pd.DataFrame()
        
        processed_data = []
        for item in data:
            processed_item = {}
            for key, value in item.items():
                if isinstance(value, (list, dict)):
                    # 处理复杂对象
                    if key == 'product_vo_list' and isinstance(value, list):
                        # 格式化产品列表
                        product_names = []
                        for product in value:
                            if isinstance(product, dict):
                                name = product.get('product_name', '未知产品')
                                qty = product.get('quantity', 0)
                                product_names.append(f"{name}×{qty}")
                            else:
                                product_names.append(str(product))
                        processed_item[key] = "; ".join(product_names) if product_names else "无产品"
                    else:
                        # 其他复杂对象转为JSON字符串
                        processed_item[key] = json.dumps(value, ensure_ascii=False)
                else:
                    processed_item[key] = value
            processed_data.append(processed_item)
        
        return pd.DataFrame(processed_data)
    
    
    async def execute(
        self, 
        operation: str = None,
        order_id: Optional[str] = None,
        customer_name: Optional[str] = None,
        customer_phone: Optional[str] = None,
        customer_address: Optional[str] = None,
        product_vo_list: Optional[List[Dict[str, Any]]] = None,
        total_amount: Optional[float] = None,
        order_status: Optional[str] = None,
        order_type: Optional[str] = None,
        expected_delivery_time: Optional[str] = None,
        is_ensure: Optional[int] = 0,
        **kwargs
    ) -> Any:
        result = ""
        print(f"operation: ----------------------- {operation}")
        
        if operation is None or operation not in ["LIST", "ADD", "UPDATE", "DELETE", "STATUS"]:
            result = "请告诉我具体的操作类型：比如我要查看菜品订单信息、我要点餐、我要修改订单或我要删除订单！"
            
        elif operation == "LIST":
            # 查看订单列表
            try:
                order_request = OrderFoodRequest(
                    order_id=order_id,
                    customer_name=customer_name,
                    customer_phone=customer_phone,
                    order_status=order_status
                )
                response = await self.order_server.post_order_food(order_request)
                result = utils.parse_server_return(response=response)
                
                if not result:
                    result = "暂无订单信息！您可以告诉我创建新订单（客户信息、商品列表、总金额等）"
                else:
                    order_count = len(result)
                    order_summary = []
                    for order in result:
                        order_summary.append(f"订单号：{order.get('order_id', 'N/A')}，客户：{order.get('customer_name', 'N/A')}，金额：{order.get('total_amount', 'N/A')}元，状态：{order.get('order_status', 'N/A')}")
                    
                    order_summary_str = '；'.join(order_summary)
                    data_list_str = json.dumps(result, ensure_ascii=False, indent=2)
                    result_df = self.create_simple_dataframe(result)
                    data_frame_dict = result_df.to_dict('records')  # 转换为字典列表
                    data_frame_str = json.dumps(data_frame_dict, ensure_ascii=False, indent=2)
                    print("result: ---------------------------- {result}")
                    result = f"""
                    <data_frame content="为您查到{order_count}条订单信息：{order_summary_str}，订单详细信息如下：">{data_frame_str}</data_frame>
                    """
            except Exception as e:
                result = f"查询订单失败：{str(e)}"

        elif operation == "ADD":
            # 创建新订单
            try:
                # 验证必需字段
                customer_name = "张秀英" if not customer_name else customer_name
                customer_phone = "176****4284" if not customer_phone else customer_phone
                customer_address = "幸福小区3栋201室" if not customer_address else customer_address
                order_id = uuid.uuid4().hex[:8]
                shanghai_tz = pytz.timezone('Asia/Shanghai')
                current_time = datetime.now(shanghai_tz)
                delivery_time_start = current_time + timedelta(hours=1)
                delivery_time_end = current_time + timedelta(hours=1.5)
                arrive_start_time = delivery_time_start.strftime('%H:%M:%S')
                arrive_end_time = delivery_time_end.strftime('%H:%M:%S')
                if not product_vo_list or len(product_vo_list) == 0:
                    result = "创建订单失败：请提供商品列表"
                    
                try:
                    print(f"product_vo_list: --------------------------------------- {product_vo_list}")
                    for item in product_vo_list:
                        try:
                            item["id"] = self.chinese_to_pinyin(item["name"])
                        except Exception as e:
                            import traceback
                            raise ValueError(f"fail to generate id {str(e)}\n{traceback.format_exec()}") from e
                        menu_data = ListMenuData(dish_name=item["name"])
                        response = await menu_data_service.post_menu_data(menu_data)
                        menu_data_list = utils.parse_server_return(response=response)
                        item["unitPrice"] = menu_data_list[0]["price"]
                    total_amount = sum(item['unitPrice'] * item['quantity'] for item in product_vo_list)    
                except Exception as e:
                    result = "创建订单失败：请提供有效的订单总金额"

                order_request = OrderFoodRequest(
                    order_id=order_id,
                    customer_name=customer_name,
                    customer_phone=customer_phone,
                    customer_address=customer_address,
                    product_vo_list=product_vo_list,
                    total_amount=total_amount,
                    order_type=order_type,
                    expected_delivery_time=expected_delivery_time,
                    order_status=order_status
                )
                response = await self.order_server.save_order_food(order_request)
                    
                printer_data = {
                    "orderName": "助餐订单确认单",
                    "orderId": order_id,
                    "orderTime": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "orderType": "助餐",
                    "productVoList": product_vo_list,
                    "totalAmount": total_amount,
                    "customerName": customer_name,
                    "customerAddress": customer_address,
                    "customerPhone": customer_phone,
                    "warmPromptLabel": "用餐安排",
                    "warmPrompts": [
                        "用餐时间：今日午餐",
                        "特殊要求：少放盐，口味清淡"
                    ],
                    "expectedDeliveryTime": f"{arrive_start_time}-{arrive_end_time}"
                }
                print(f"printer_data: --------------------------------- {printer_data}")
                print(f"product_vo_list: --------------------------------- {product_vo_list}")
                dish_name = product_vo_list[0]["name"]
                dish_id = product_vo_list[0]["id"]
                quantity = product_vo_list[0]["quantity"]
                price = product_vo_list[0]["unitPrice"]
                
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
                总 金 额：{total_amount}元

                -------------------------------------------
                            客户信息  
                -------------------------------------------
                客户姓名：张秀英
                送餐地址：{address}
                联系电话：{customer_phone}

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
                    pythonorder_list = [f"{item['name']}" for item in product_vo_list]
                    product_vo_str = ", ".join(pythonorder_list)
                    result = result + "\n" + f"""<confirm content="确认点餐：{product_vo_str}">请确认您的订单？</confirm>"""
                else:
                    result = utils.request_url(
                        url="http://1.71.15.117:48099/print/start",
                        param_dict=printer_data
                    )
                    print(f"result: --------------------------- {result}")
                    html_file_name = f"{uuid.uuid4().hex}.html"
                    output_file = f"{SOURCE_STORAGE_PATH}/{html_file_name}"
                    order_info_source = utils.generate_order_html(title="助餐订单", order_content=result_order, output_file=output_file)
                    result = f"""<preview name="WebPreviewCard" content="已发送您的订单详情，请核对！">{SOURCE_API_PREFIX}/{html_file_name}</preview>"""    
                
                    
                    # if hasattr(response, 'body'):
                    #     content = json.loads(response.body.decode())
                    #     if content.get("success"):
                    #         result = f"订单创建成功！订单号：{content.get('data', {}).get('order_id', 'N/A')}，{content.get('message', '')}"
                    #     else:
                    #         result = f"订单创建失败：{content.get('message', '未知错误')}"
                    # else:
                    #     result = "订单创建失败：服务器响应异常"
            except Exception as e:
                import traceback
                result = f"创建订单失败：{str(e)}\n{traceback.format_exc()}"
                
        elif operation == "UPDATE":
            # 更新订单信息
            try:
                if not order_id:
                    result = "更新订单失败：请提供订单ID"
                else:
                    order_request = OrderFoodRequest(
                        order_id=order_id,
                        customer_name=customer_name,
                        customer_phone=customer_phone,
                        customer_address=customer_address,
                        product_vo_list=product_vo_list,
                        total_amount=total_amount,
                        order_type=order_type,
                        expected_delivery_time=expected_delivery_time,
                        order_status=order_status
                    )
                    response = await self.order_server.update_order_food(order_request)
                    
                    if hasattr(response, 'body'):
                        content = json.loads(response.body.decode())
                        if content.get("success"):
                            result = f"订单更新成功！{content.get('message', '')}"
                        else:
                            result = f"订单更新失败：{content.get('message', '未知错误')}"
                    else:
                        result = "订单更新失败：服务器响应异常"
            except Exception as e:
                result = f"更新订单失败：{str(e)}"
                
        elif operation == "DELETE":
            # 删除订单
            try:
                if not order_id:
                    result = "删除订单失败：请提供订单ID"
                else:
                    order_request = OrderFoodRequest(order_id=order_id)
                    response = await self.order_server.delete_order_food(order_request)
                    
                    if hasattr(response, 'body'):
                        content = json.loads(response.body.decode())
                        if content.get("success"):
                            result = f"订单删除成功！{content.get('message', '')}"
                        else:
                            result = f"订单删除失败：{content.get('message', '未知错误')}"
                    else:
                        result = "订单删除失败：服务器响应异常"
            except Exception as e:
                result = f"删除订单失败：{str(e)}"
                
        elif operation == "STATUS":
            # 更新订单状态
            try:
                if not order_id:
                    result = "更新订单状态失败：请提供订单ID"
                elif not order_status:
                    result = "更新订单状态失败：请提供订单状态"
                else:
                    # 验证订单状态
                    valid_statuses = ['pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled']
                    if order_status not in valid_statuses:
                        result = f"更新订单状态失败：无效的订单状态，有效状态为: {', '.join(valid_statuses)}"
                    else:
                        order_request = OrderFoodRequest(
                            order_id=order_id,
                            order_status=order_status
                        )
                        response = await self.order_server.update_order_status(order_request)
                        
                        if hasattr(response, 'body'):
                            content = json.loads(response.body.decode())
                            if content.get("success"):
                                result = f"订单状态更新成功！{content.get('message', '')}"
                            else:
                                result = f"订单状态更新失败：{content.get('message', '未知错误')}"
                        else:
                            result = "订单状态更新失败：服务器响应异常"
            except Exception as e:
                result = f"更新订单状态失败：{str(e)}"
        
        # 处理返回结果
        result = json.dumps(utils.parse_content(result), ensure_ascii=False, indent=2)
        for item in result:
            yield item
        return