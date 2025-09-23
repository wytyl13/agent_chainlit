#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/16 11:22
@Author  : weiyutao
@File    : order_food_server.py
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
import logging
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from fastapi.encoders import jsonable_encoder
import asyncio
import uuid
import json

from api.table.start.order_food_data import OrderFoodData
from agent.provider.sql_provider import SqlProvider
from tools.utils import Utils

utils = Utils()

class OrderFoodRequest(BaseModel):
    order_name: Optional[str] = None
    order_id: Optional[str] = None
    order_time: Optional[str] = None
    order_type: Optional[str] = None
    product_vo_list: Optional[List[Dict[str, Any]]] = None
    total_amount: Optional[float] = None
    customer_name: Optional[str] = None
    customer_address: Optional[str] = None
    customer_phone: Optional[str] = None
    expected_delivery_time: Optional[str] = None
    warm_prompt_label: Optional[str] = None
    warm_prompts: Optional[List[str]] = None
    order_status: Optional[str] = None

class OrderFoodServer:
    """订单服务类"""
    
    def __init__(self, sql_config_path: str):
        self.sql_config_path = sql_config_path
        self.logger = logging.getLogger(self.__class__.__name__)
        self.sql_provider = SqlProvider(model=OrderFoodData, sql_config_path=self.sql_config_path)
    
    def register_routes(self, app: FastAPI):
        """注册订单相关的路由"""
        app.get("/api/order_food")(self.get_order_food)
        app.post("/api/order_food")(self.post_order_food)
        app.post("/api/order_food/save")(self.save_order_food)
        app.post("/api/order_food/update")(self.update_order_food)
        app.post("/api/order_food/delete")(self.delete_order_food)
        app.post("/api/order_food/status")(self.update_order_status)
    
    async def get_order_food(
        self,
        order_id: Optional[str] = None,
        customer_name: Optional[str] = None,
        order_status: Optional[str] = None,
        customer_phone: Optional[str] = None,
    ):
        """
        GET请求 - 支持获取所有订单或根据条件筛选订单
        Examples:
        - GET /api/order_food -> 获取所有订单信息
        - GET /api/order_food?order_id=123 -> 获取指定订单
        - GET /api/order_food?customer_name=张三 -> 获取指定客户的订单
        - GET /api/order_food?order_status=pending -> 获取指定状态的订单
        """
        condition = {}
        if order_id is not None:
            condition["order_id"] = order_id
        if customer_name is not None:
            condition["customer_name"] = customer_name
        if order_status is not None:
            condition["order_status"] = order_status
        if customer_phone is not None:
            condition["customer_phone"] = customer_phone
            
        sql_provider = None
        try:
            sql_provider = SqlProvider(model=OrderFoodData, sql_config_path=self.sql_config_path)
            result = await sql_provider.get_record_by_condition(condition=condition)
            json_compatible_result = jsonable_encoder(result)
            
            return JSONResponse(
                status_code=200,
                content={"success": True, "data": json_compatible_result, "timestamp": datetime.now().isoformat()}
            )
        except Exception as e:
            self.logger.error(f"获取订单数据失败: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"获取订单数据失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
        finally:
            if sql_provider:
                await sql_provider.close()
                await asyncio.sleep(0.1)

    async def post_order_food(
        self,
        order_request: OrderFoodRequest,
    ):
        """
        POST请求 - 支持获取所有订单或根据条件查询订单
        Examples:
        - POST /api/order_food {} -> 获取所有订单信息
        - POST /api/order_food {"order_id": "123"} -> 获取指定订单
        """
        try:
            condition = {}
            if order_request.order_id:
                condition["order_id"] = order_request.order_id
            if order_request.customer_name:
                condition["customer_name"] = order_request.customer_name
            if order_request.order_status:
                condition["order_status"] = order_request.order_status
            if order_request.customer_phone:
                condition["customer_phone"] = order_request.customer_phone
                
            result = await self.get_order_food(
                order_id=order_request.order_id,
                customer_name=order_request.customer_name,
                order_status=order_request.order_status,
                customer_phone=order_request.customer_phone
            )
            return result
        except Exception as e:
            self.logger.error(f"查询订单数据失败: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"查询订单数据失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )

    async def save_order_food(
        self,
        order_request: OrderFoodRequest,
    ):
        """
        POST请求 - 保存新订单
        """
        sql_provider = None
        try:
            self.logger.info(f"收到订单保存请求: {order_request}")
            
            # 验证必填字段
            if not order_request.customer_name:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供客户姓名", "timestamp": datetime.now().isoformat()}
                )
            
            if not order_request.customer_phone:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供客户电话", "timestamp": datetime.now().isoformat()}
                )
                
            if not order_request.customer_address:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供客户地址", "timestamp": datetime.now().isoformat()}
                )
                
            if not order_request.product_vo_list or len(order_request.product_vo_list) == 0:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供订单商品列表", "timestamp": datetime.now().isoformat()}
                )
                
            if not order_request.total_amount or order_request.total_amount <= 0:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供有效的订单总金额", "timestamp": datetime.now().isoformat()}
                )

            # 生成订单ID（如果没有提供）
            if not order_request.order_id:
                order_request.order_id = f"ORD{datetime.now().strftime('%Y%m%d%H%M%S')}{str(uuid.uuid4())[:8].upper()}"

            # 检查订单是否已存在
            existing_order = OrderFoodRequest(order_id=order_request.order_id)
            response = await self.post_order_food(existing_order)
            response_data = utils.parse_server_return(response)
            if response_data:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": f"订单号 {order_request.order_id} 已存在", "timestamp": datetime.now().isoformat()}
                )

            # 构建插入数据
            insert_data = {
                "order_name": order_request.order_name or f"{order_request.customer_name}的订单",
                "order_id": order_request.order_id,
                "order_time": datetime.strptime(order_request.order_time, "%Y-%m-%d %H:%M:%S") if order_request.order_time else datetime.now(),
                "order_type": order_request.order_type or "外卖",
                "product_vo_list": order_request.product_vo_list,
                "total_amount": order_request.total_amount,
                "customer_name": order_request.customer_name,
                "customer_address": order_request.customer_address,
                "customer_phone": order_request.customer_phone,
                "expected_delivery_time": order_request.expected_delivery_time or "30-45分钟",
                "warm_prompt_label": order_request.warm_prompt_label or "温馨提示",
                "warm_prompts": order_request.warm_prompts or ["请保持电话畅通", "注意查收"],
                "order_status": order_request.order_status or "pending",
                "create_time": datetime.now(),
                "update_time": datetime.now()
            }
            
            sql_provider = SqlProvider(model=OrderFoodData, sql_config_path=self.sql_config_path)
            result = await sql_provider.add_record(insert_data)
            
            if result:
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": "订单保存成功", "data": {"order_id": order_request.order_id}, "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": "数据库添加记录失败", "timestamp": datetime.now().isoformat()}
                )
                
        except Exception as e:
            self.logger.error(f"保存订单失败: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"保存订单失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
        finally:
            if sql_provider:
                await sql_provider.close()
                await asyncio.sleep(0.1)

    async def update_order_food(
        self,
        order_request: OrderFoodRequest,
    ):
        """
        POST请求 - 更新订单信息
        """
        sql_provider = None
        try:
            self.logger.info(f"收到订单更新请求: {order_request}")
            
            if not order_request.order_id:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供订单ID", "timestamp": datetime.now().isoformat()}
                )

            # 查询现有订单
            existing_order_request = OrderFoodRequest(order_id=order_request.order_id)
            response = await self.post_order_food(existing_order_request)
            
            if hasattr(response, 'body'):
                response_data = json.loads(response.body.decode())
            else:
                response_data = response
                
            if not response_data.get("success") or not response_data.get("data"):
                return JSONResponse(
                    status_code=404,
                    content={"success": False, "message": f"订单 {order_request.order_id} 不存在", "timestamp": datetime.now().isoformat()}
                )

            existing_order = response_data["data"][0]
            
            # 构建更新数据（只更新非空字段）
            update_data = {"update_time": datetime.now()}
            
            if order_request.order_name:
                update_data["order_name"] = order_request.order_name
            if order_request.order_type:
                update_data["order_type"] = order_request.order_type
            if order_request.product_vo_list:
                update_data["product_vo_list"] = order_request.product_vo_list
            if order_request.total_amount:
                update_data["total_amount"] = order_request.total_amount
            if order_request.customer_name:
                update_data["customer_name"] = order_request.customer_name
            if order_request.customer_address:
                update_data["customer_address"] = order_request.customer_address
            if order_request.customer_phone:
                update_data["customer_phone"] = order_request.customer_phone
            if order_request.expected_delivery_time:
                update_data["expected_delivery_time"] = order_request.expected_delivery_time
            if order_request.warm_prompt_label:
                update_data["warm_prompt_label"] = order_request.warm_prompt_label
            if order_request.warm_prompts:
                update_data["warm_prompts"] = order_request.warm_prompts
            if order_request.order_status:
                update_data["order_status"] = order_request.order_status
            if order_request.order_time:
                update_data["order_time"] = datetime.strptime(order_request.order_time, "%Y-%m-%d %H:%M:%S")

            # 合并现有数据和更新数据
            final_data = {**existing_order, **update_data}
            
            sql_provider = SqlProvider(model=OrderFoodData, sql_config_path=self.sql_config_path)
            
            # 删除原记录并添加新记录
            delete_result = await sql_provider.delete_record(record_id=existing_order["id"], hard_delete=True)
            result = await sql_provider.add_record(final_data)
            
            if result:
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": "订单更新成功", "data": {"order_id": order_request.order_id}, "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": "数据库更新记录失败", "timestamp": datetime.now().isoformat()}
                )
                
        except Exception as e:
            import traceback
            self.logger.error(f"更新订单失败: {str(e)}\n{traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"更新订单失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
        finally:
            if sql_provider:
                await sql_provider.close()
                await asyncio.sleep(0.1)

    async def delete_order_food(
        self,
        order_request: OrderFoodRequest,
    ):
        """
        POST请求 - 删除订单
        """
        sql_provider = None
        try:
            self.logger.info(f"收到订单删除请求: {order_request}")
            
            if not order_request.order_id:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供要删除的订单ID", "timestamp": datetime.now().isoformat()}
                )

            # 查询订单是否存在
            existing_order_request = OrderFoodRequest(order_id=order_request.order_id)
            response = await self.post_order_food(existing_order_request)
            
            if hasattr(response, 'body'):
                response_data = json.loads(response.body.decode())
            else:
                response_data = response
                
            if not response_data.get("success") or not response_data.get("data"):
                return JSONResponse(
                    status_code=404,
                    content={"success": False, "message": f"删除失败！订单 {order_request.order_id} 不存在", "timestamp": datetime.now().isoformat()}
                )

            existing_order = response_data["data"][0]
            
            sql_provider = SqlProvider(model=OrderFoodData, sql_config_path=self.sql_config_path)
            delete_result = await sql_provider.delete_record(record_id=existing_order["id"], hard_delete=True)
            
            return JSONResponse(
                status_code=200,
                content={"success": True, "message": f"订单 {order_request.order_id} 删除成功", "timestamp": datetime.now().isoformat()}
            )
                
        except Exception as e:
            import traceback
            self.logger.error(f"删除订单失败: {str(e)}\n{traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"删除订单失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
        finally:
            if sql_provider:
                await sql_provider.close()
                await asyncio.sleep(0.1)

    async def update_order_status(
        self,
        order_request: OrderFoodRequest,
    ):
        """
        POST请求 - 更新订单状态
        """
        try:
            if not order_request.order_id:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供订单ID", "timestamp": datetime.now().isoformat()}
                )
                
            if not order_request.order_status:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供订单状态", "timestamp": datetime.now().isoformat()}
                )

            # 验证订单状态
            valid_statuses = ['pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled']
            if order_request.order_status not in valid_statuses:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": f"无效的订单状态，有效状态为: {', '.join(valid_statuses)}", "timestamp": datetime.now().isoformat()}
                )

            # 创建包含订单状态的更新请求
            update_request = OrderFoodRequest(
                order_id=order_request.order_id,
                order_status=order_request.order_status
            )
            
            result = await self.update_order_food(update_request)
            return result
            
        except Exception as e:
            self.logger.error(f"更新订单状态失败: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"更新订单状态失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )

if __name__ == '__main__':
    from pathlib import Path
    import asyncio
    
    ROOT_DIRECTORY = Path(__file__).parent.parent.parent.parent
    SQL_CONFIG_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / "sql_config.yaml")
    
    async def main():
        order_server = OrderFoodServer(sql_config_path=SQL_CONFIG_PATH)
        
        # 测试获取所有订单
        response = await order_server.get_order_food()
        print("获取所有订单:", response)
        
        # 测试保存订单
        test_order = OrderFoodRequest(
            customer_name="张三",
            customer_phone="13800138000",
            customer_address="北京市朝阳区xxx街道",
            product_vo_list=[
                {"dish_name": "宫保鸡丁", "price": 28.0, "quantity": 1},
                {"dish_name": "米饭", "price": 3.0, "quantity": 2}
            ],
            total_amount=34.0
        )
        
        save_response = await order_server.save_order_food(test_order)
        print("保存订单:", save_response)
        
    asyncio.run(main())