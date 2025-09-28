#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/22 11:22
@Author  : weiyutao
@File    : merchant_management_server.py
"""


from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
import logging
from pydantic import BaseModel
from typing import Optional
from fastapi.encoders import jsonable_encoder
import asyncio
import json

from api.table.merchant_service_system.merchant_management import MerchantData
from agent.provider.sql_provider import SqlProvider
from tools.utils import Utils

utils = Utils()


class MerchantDataModel(BaseModel):
    """商家数据模型验证类"""
    merchant_name: Optional[str] = None
    category: Optional[str] = None  # 餐厅/食堂/中央厨房
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    service_area: Optional[str] = None
    business_license: Optional[str] = None
    food_license: Optional[str] = None
    capacity: Optional[int] = None
    rating: Optional[float] = None
    status: Optional[str] = None  # 启用/禁用/审核中
    description: Optional[str] = None


class MerchantManagementServer:
    """商家管理服务类"""
    
    def __init__(self, sql_config_path: str):
        self.sql_config_path = sql_config_path
        self.logger = logging.getLogger(self.__class__.__name__)
        self.sql_provider = SqlProvider(model=MerchantData, sql_config_path=self.sql_config_path)
    
    def register_routes(self, app: FastAPI):
        """注册商家相关的路由"""
        app.get("/api/merchant_data")(self.get_merchant_data)
        app.post("/api/merchant_data")(self.post_merchant_data)
        app.post("/api/merchant_data/save")(self.save_merchant_data)
        app.post("/api/merchant_data/update")(self.update_merchant_data)
        app.post("/api/merchant_data/delete")(self.delete_merchant_data)
    
    
    async def get_merchant_data(
        self,
        merchant_name: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None
    ):
        """
        GET请求 - 获取商家信息
        支持获取所有商家或按条件筛选
        Examples:
        - GET /api/merchant_data -> 获取所有商家信息
        - GET /api/merchant_data?merchant_name=麦当劳 -> 获取指定商家信息
        - GET /api/merchant_data?category=餐厅&status=启用 -> 按类别和状态筛选
        """
        condition = {}
        if merchant_name is not None:
            condition["merchant_name"] = merchant_name
        if category is not None:
            condition["category"] = category
        if status is not None:
            condition["status"] = status
            
        sql_provider = None
        try:
            sql_provider = SqlProvider(model=MerchantData, sql_config_path=self.sql_config_path)
            result = await sql_provider.get_record_by_condition(condition=condition)
            json_compatible_result = jsonable_encoder(result)
            
            return JSONResponse(
                status_code=200,
                content={"success": True, "data": json_compatible_result, "timestamp": datetime.now().isoformat()}
            )
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"获取商家数据失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
        finally:
            if sql_provider:
                await sql_provider.close()
                await asyncio.sleep(0.1)  # 确保连接关闭
    
    
    async def post_merchant_data(
        self,
        merchant_data: MerchantDataModel,
    ):
        """
        POST请求 - 通过请求体参数获取商家信息
        Examples:
        - POST /api/merchant_data {} -> 获取所有商家信息
        - POST /api/merchant_data {"merchant_name": "肯德基"} -> 获取指定商家信息
        """
        try:
            # 构建查询条件
            condition = {}
            if merchant_data.merchant_name:
                condition["merchant_name"] = merchant_data.merchant_name
            if merchant_data.category:
                condition["category"] = merchant_data.category
            if merchant_data.status:
                condition["status"] = merchant_data.status
                
            # 调用GET方法获取数据
            result = await self.get_merchant_data(**condition)
            return result
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"获取商家数据失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
    
    
    async def save_merchant_data(
        self,
        merchant_data: MerchantDataModel,
    ):
        """
        POST请求 - 保存新商家信息
        """
        try:
            self.logger.info(f"收到商家数据保存请求: {merchant_data}")
            
            # 验证必填字段
            required_fields = [
                'merchant_name', 'category', 'contact_person', 
                'phone', 'address', 'business_license', 'food_license'
            ]
            
            # 检查必填字段
            for field in required_fields:
                if not getattr(merchant_data, field):
                    return JSONResponse(
                        status_code=400,
                        content={"success": False, "message": f"请提供{field}信息", "timestamp": datetime.now().isoformat()}
                    )
            
            # 检查商家是否已存在
            existing_merchant = await self.get_merchant_data(merchant_name=merchant_data.merchant_name)
            existing_merchant = utils.parse_server_return(existing_merchant)
            if existing_merchant:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": f"""<confirm content="确认修改商家：{merchant_data.merchant_name}">商家{merchant_data.merchant_name}已经存在，请问您是否要修改？</confirm>""", "timestamp": datetime.now().isoformat()}
                )
            
            # 构建插入数据
            insert_data = {
                "merchant_name": merchant_data.merchant_name,
                "category": merchant_data.category,
                "contact_person": merchant_data.contact_person,
                "phone": merchant_data.phone,
                "address": merchant_data.address,
                "business_license": merchant_data.business_license,
                "food_license": merchant_data.food_license,
                "status": merchant_data.status,
                "create_time": datetime.now(),
                "update_time": datetime.now()
            }
            
            # 处理可选字段
            if merchant_data.service_area:
                insert_data["service_area"] = merchant_data.service_area
            if merchant_data.capacity is not None:
                insert_data["capacity"] = merchant_data.capacity
            if merchant_data.rating is not None:
                insert_data["rating"] = merchant_data.rating
            else:
                insert_data["rating"] = 0.0  # 默认评分
            if merchant_data.description:
                insert_data["description"] = merchant_data.description
            
            # 保存到数据库
            result = await self.sql_provider.add_record(insert_data)
            if result:
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": "商家信息保存成功", "data": str(result), "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": "数据库添加记录失败", "timestamp": datetime.now().isoformat()}
                )
                
        except Exception as e:
            self.logger.error(f"保存商家数据失败: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"保存失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
    
    
    async def update_merchant_data(
        self,
        merchant_data: MerchantDataModel,
    ):
        """
        POST请求 - 更新商家信息
        """
        try:
            self.logger.info(f"收到商家数据更新请求: {merchant_data}")
            
            # 验证商家名称是否提供
            if not merchant_data.merchant_name:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供商家名称", "timestamp": datetime.now().isoformat()}
                )
            
            # 查询商家是否存在
            response = await self.get_merchant_data(merchant_name=merchant_data.merchant_name)
            if hasattr(response, 'body'):
                response = json.loads(response.body.decode())
            
            if not response.get("success") or not response.get("data"):
                return JSONResponse(
                    status_code=404,
                    content={"success": False, "message": f"商家{merchant_data.merchant_name}不存在", "timestamp": datetime.now().isoformat()}
                )
            
            # 获取现有商家数据
            existing_merchant = response.get("data")[0]
            
            # 构建更新数据
            update_data = {
                "merchant_name": merchant_data.merchant_name,
                "update_time": datetime.now()
            }
            
            # 处理字段更新，保留原有值如果未提供新值
            fields = [
                'category', 'contact_person', 'phone', 'address', 
                'service_area', 'business_license', 'food_license',
                'capacity', 'rating', 'status', 'description'
            ]
            
            for field in fields:
                new_value = getattr(merchant_data, field)
                if new_value is not None:
                    update_data[field] = new_value
                else:
                    update_data[field] = existing_merchant.get(field)
            
            # 先删除旧记录，再插入新记录（模拟更新）
            delete_result = await self.sql_provider.delete_record(record_id=existing_merchant["id"], hard_delete=True)
            result = await self.sql_provider.add_record(update_data)
            
            if result:
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": "商家信息更新成功", "data": str(result), "timestamp": datetime.now().isoformat()}
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": "数据库更新记录失败", "timestamp": datetime.now().isoformat()}
                )
                
        except Exception as e:
            import traceback
            self.logger.error(f"更新商家数据失败: {str(e)}\n{traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"更新失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )
    
    
    async def delete_merchant_data(
        self,
        merchant_data: MerchantDataModel,
    ):
        """
        POST请求 - 删除商家信息
        """
        try:
            self.logger.info(f"收到商家数据删除请求: {merchant_data}")
            
            # 验证商家名称是否提供
            if not merchant_data.merchant_name:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "请提供要删除的商家名称", "timestamp": datetime.now().isoformat()}
                )
            
            # 查询商家是否存在
            response = await self.get_merchant_data(merchant_name=merchant_data.merchant_name)
            if hasattr(response, 'body'):
                response = json.loads(response.body.decode())
            
            if not response.get("success") or not response.get("data"):
                return JSONResponse(
                    status_code=404,
                    content={"success": False, "message": f"商家{merchant_data.merchant_name}不存在", "timestamp": datetime.now().isoformat()}
                )
            
            # 执行删除操作
            merchant_info = response.get("data")[0]
            delete_result = await self.sql_provider.delete_record(record_id=merchant_info["id"], hard_delete=True)
            
            return JSONResponse(
                status_code=200,
                content={"success": True, "message": f"商家{merchant_data.merchant_name}删除成功", "timestamp": datetime.now().isoformat()}
            )
                
        except Exception as e:
            import traceback
            self.logger.error(f"删除商家数据失败: {str(e)}\n{traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"删除失败: {str(e)}", "timestamp": datetime.now().isoformat()}
            )


if __name__ == '__main__':
    from pathlib import Path
    import asyncio
    ROOT_DIRECTORY = Path(__file__).parent.parent.parent.parent
    SQL_CONFIG_PATH = str(ROOT_DIRECTORY / "config" / "yaml" / "sql_config.yaml")
    
    async def main():
        merchant_server = MerchantManagementServer(sql_config_path=SQL_CONFIG_PATH)
        response = await merchant_server.get_merchant_data()
        print(response)
    
    asyncio.run(main())
    