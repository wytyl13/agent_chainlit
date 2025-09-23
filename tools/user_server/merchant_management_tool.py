#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/22 15:30
@Author  : weiyutao
@File    : merchant_management_tool.py
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
import json
from datetime import datetime

from agent.base.base_tool import tool
from tools.utils import Utils
from api.server.base.merchant_management_server import MerchantManagementServer
from api.server.base.merchant_management_server import MerchantDataModel


# 配置常量（与MenuService保持一致的基础路径）
SOURCE_STORAGE_PATH = "/work/ai/agent_chainlit/api/source"
SOURCE_API_PREFIX = "https://ai.shunxikj.com:8890/api/files/download"
URL_PREFIX = "https://ai.shunxikj.com:9001"  # 与菜单服务共用API域名

# 初始化商家管理服务（指定SQL配置路径，与MerchantManagementServer保持一致）
merchant_server = MerchantManagementServer(
    sql_config_path="/work/ai/agent_chainlit/config/yaml/sql_config.yaml"
)

utils = Utils()


class MerchantServiceSchema(BaseModel):
    """
    商家服务参数校验模型
    根据上下文会话提取操作类型和商家信息，严格遵循“无则空/默认”原则，不臆想数据
    """
    operation: str = Field(
        ...,
        description="操作类型：必须是以下值之一 <LIST: 查看商家, ADD: 新增商家, UPDATE: 修改商家, DELETE: 删除商家>"
    )
    merchant_name: str = Field(
        default=None,
        description="商家名称（必填项）：上下文提取不到则赋值为空字符串，不可虚构"
    )
    # category: str = Field(
    #     default=None,
    #     description="商家类别（餐厅/食堂/中央厨房）：提取不到则赋值为空字符串"
    # )
    # contact_person: str = Field(
    #     default="",
    #     description="联系人：提取不到则赋值为空字符串"
    # )
    # phone: str = Field(
    #     default=None,
    #     description="联系电话：提取不到则赋值为空字符串"
    # )
    # address: str = Field(
    #     default=None,
    #     description="商家地址：提取不到则赋值为空字符串"
    # )
    # status: str = Field(
    #     default=None,
    #     description="商家状态（启用/禁用/审核中）：提取不到则赋值为空字符串"
    # )


@tool
class MerchantManagementService:
    """
    商家管理Agent Tool
    对接MerchantManagementServer，支持商家信息的查看、新增、修改、删除操作
    """
    args_schema: Type[BaseModel] = MerchantServiceSchema  # 参数校验模型
    end_flag: int = 1  # 工具结束标识（遵循BaseTool规范）

    @overload
    def __init__(self):
        ...

    def __init__(self, **kwargs):
        super().__init__(** kwargs)

    async def execute(
        self,
        operation: str = None,
        merchant_name: Optional[str] = None,
        category: Optional[str] = None,
        contact_person: Optional[str] = None,
        phone: Optional[str] = None,
        address: Optional[str] = None,
        status: Optional[str] = None,
        **kwargs
    ) -> Any:
        """
        执行商家操作：根据operation参数分发到对应方法
        :param operation: 操作类型（LIST/ADD/UPDATE/DELETE）
        :param merchant_name: 商家名称
        :param category: 商家类别
        :param contact_person: 联系人
        :param phone: 联系电话
        :param address: 商家地址
        :param status: 商家状态
        :return: 操作结果（带卡片格式的JSON字符串）
        """
        # 1. 基础参数校验：操作类型必须合法
        try:
            if operation is None or operation not in ["LIST", "ADD", "UPDATE", "DELETE"]:
                result = {
                    "success": False,
                    "message": "请指定合法的操作类型：查看、新增、修改、删除"
                }
            # 2. 按操作类型分发逻辑
            if operation == "LIST":
                result = await self._handle_list(merchant_name, category, status)
            elif operation == "ADD":
                result = self._handle_add(merchant_name, category, contact_person, phone, address, status)
            elif operation == "UPDATE":
                result = await self._handle_update(merchant_name, category, contact_person, phone, address, status)
            elif operation == "DELETE":
                result = await self._handle_delete(merchant_name)
            result = json.loads(result)
            print(f"查看商家信息: ---------------------------------------------------- {result}")
            result = result["content"] if result["success"] and "content" in result else result["message"]
        except Exception as e:
            import traceback
            result = f"错误！{str(e)}\n {traceback.format_exc()}"
        for item in result:
            yield item
    async def _handle_list(
        self,
        merchant_name: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None
    ) -> str:
        """
        处理“查看商家”操作：支持按名称、类别、状态筛选，无筛选条件则返回所有商家
        """
        try:
            # 1. 构建查询参数（空值不传入，避免影响SQL查询）
            query_params = {}
            if merchant_name:
                query_params["merchant_name"] = merchant_name
            if category:
                query_params["category"] = category
            if status:
                query_params["status"] = status

            # 2. 调用MerchantManagementServer的POST接口获取数据（支持复杂条件筛选）
            merchant_model = MerchantDataModel(** query_params)
            response = await merchant_server.post_merchant_data(merchant_model)

            # 3. 解析响应数据
            parsed_data = utils.parse_server_return(response)
            if not parsed_data:
                return json.dumps({
                    "success": False,
                    "message": "暂无商家数据，可先新增商家信息（需提供商家名称、类别、联系人、电话、地址）"
                }, ensure_ascii=False)

            # 4. 格式化结果：生成卡片（与MenuService格式保持一致）
            merchant_names = [item["merchant_name"] for item in parsed_data]
            merchant_names_str = "、".join(merchant_names)
            request_config = {
                "url": f"{URL_PREFIX}/api/merchant_data",
                "param_dict": query_params,
                "method": "POST"
            }
            data_str = json.dumps(request_config, ensure_ascii=False, indent=2)

            return json.dumps({
                "success": True,
                "content": f"""<card name="MerchantCards" content="为您查到{len(parsed_data)}条商家信息：{merchant_names_str}，详细信息如下：">{data_str}</card>"""
            }, ensure_ascii=False)

        except Exception as e:
            return json.dumps({
                "success": False,
                "message": f"查看商家失败：{str(e)}"
            }, ensure_ascii=False)

    async def _handle_add(
        self,
        merchant_name: str,
        category: str,
        contact_person: str,
        phone: str,
        address: str,
        status: Optional[str] = None
    ) -> str:
        """
        处理“新增商家”操作：校验必填项，避免重复新增
        """
        try:
            # 1. 校验必填项（参考MerchantManagementServer的save逻辑）
            required_fields = [
                ("商家名称", merchant_name),
                ("商家类别", category),
                ("联系人", contact_person),
                ("联系电话", phone),
                ("商家地址", address)
            ]
            for field_name, field_value in required_fields:
                if not field_value:
                    return json.dumps({
                        "success": False,
                        "message": f"新增商家失败：请提供{field_name}"
                    }, ensure_ascii=False)

            # 2. 检查商家是否已存在
            check_model = MerchantDataModel(merchant_name=merchant_name)
            check_response = await merchant_server.post_merchant_data(check_model)
            check_data = utils.parse_server_return(check_response)
            if check_data:
                return json.dumps({
                    "success": False,
                    "message": f"""<confirm content="确认修改商家：{merchant_name}">商家{merchant_name}已存在，是否要修改？</confirm>"""
                }, ensure_ascii=False)

            # 3. 构建新增数据（补全默认值）
            add_model = MerchantDataModel(
                merchant_name=merchant_name,
                category=category,
                contact_person=contact_person,
                phone=phone,
                address=address,
                status=status or "审核中",  # 默认状态：审核中
                rating=0.0  # 默认评分：0.0（参考MerchantManagementServer的save逻辑）
            )

            # 4. 调用新增接口
            add_response = await merchant_server.save_merchant_data(add_model)
            add_result = utils.parse_server_return(add_response)

            if add_result:
                # 5. 新增成功后，返回最新商家列表
                list_result = await self._handle_list(merchant_name=merchant_name)
                list_json = json.loads(list_result)
                return json.dumps({
                    "success": True,
                    "message": f"商家{merchant_name}新增成功！",
                    "content": list_json.get("content", "")
                }, ensure_ascii=False)
            else:
                return json.dumps({
                    "success": False,
                    "message": f"商家{merchant_name}新增失败：数据库写入异常"
                }, ensure_ascii=False)

        except Exception as e:
            return json.dumps({
                "success": False,
                "message": f"新增商家失败：{str(e)}"
            }, ensure_ascii=False)

    async def _handle_update(
        self,
        merchant_name: str,
        category: Optional[str] = None,
        contact_person: Optional[str] = None,
        phone: Optional[str] = None,
        address: Optional[str] = None,
        status: Optional[str] = None
    ) -> str:
        """
        处理“修改商家”操作：先确认商家存在，再更新非空字段
        """
        try:
            # 1. 校验商家名称（必填）
            if not merchant_name:
                return json.dumps({
                    "success": False,
                    "message": "修改商家失败：请提供要修改的商家名称"
                }, ensure_ascii=False)

            # 2. 检查商家是否存在
            check_model = MerchantDataModel(merchant_name=merchant_name)
            check_response = await merchant_server.post_merchant_data(check_model)
            check_data = utils.parse_server_return(check_response)
            if not check_data:
                return json.dumps({
                    "success": False,
                    "message": f"修改商家失败：商家{merchant_name}不存在"
                }, ensure_ascii=False)

            # 3. 构建更新数据（非空字段才更新，空字段保留原有值）
            existing_merchant = check_data[0]
            update_model = MerchantDataModel(
                merchant_name=merchant_name,
                category=category or existing_merchant["category"],
                contact_person=contact_person or existing_merchant["contact_person"],
                phone=phone or existing_merchant["phone"],
                address=address or existing_merchant["address"],
                status=status or existing_merchant["status"],
                rating=existing_merchant["rating"],  # 评分不主动修改，保留原值
                description=existing_merchant.get("description", "")  # 描述保留原值
            )

            # 4. 调用更新接口
            update_response = await merchant_server.update_merchant_data(update_model)
            update_result = utils.parse_server_return(update_response)

            if update_result:
                # 5. 更新成功后，返回最新商家信息
                list_result = await self._handle_list(merchant_name=merchant_name)
                list_json = json.loads(list_result)
                return json.dumps({
                    "success": True,
                    "message": f"商家{merchant_name}修改成功！",
                    "content": list_json.get("content", "")
                }, ensure_ascii=False)
            else:
                return json.dumps({
                    "success": False,
                    "message": f"商家{merchant_name}修改失败：数据库更新异常"
                }, ensure_ascii=False)

        except Exception as e:
            return json.dumps({
                "success": False,
                "message": f"修改商家失败：{str(e)}"
            }, ensure_ascii=False)

    async def _handle_delete(
        self,
        merchant_name: str
    ) -> str:
        """
        处理“删除商家”操作：先确认商家存在，再执行删除
        """
        try:
            # 1. 校验商家名称（必填）
            if not merchant_name:
                return json.dumps({
                    "success": False,
                    "message": "删除商家失败：请提供要删除的商家名称"
                }, ensure_ascii=False)

            # 2. 检查商家是否存在
            check_model = MerchantDataModel(merchant_name=merchant_name)
            check_response = await merchant_server.post_merchant_data(check_model)
            check_data = utils.parse_server_return(check_response)
            if not check_data:
                return json.dumps({
                    "success": False,
                    "message": f"删除商家失败：商家{merchant_name}不存在"
                }, ensure_ascii=False)

            # 3. 构建删除数据并调用接口
            delete_model = MerchantDataModel(merchant_name=merchant_name)
            delete_response = await merchant_server.delete_merchant_data(delete_model)
            delete_result = utils.parse_server_return(delete_response)

            if delete_result:
                # 4. 删除成功后，返回剩余商家列表
                list_result = await self._handle_list()
                list_json = json.loads(list_result)
                return json.dumps({
                    "success": True,
                    "message": f"商家{merchant_name}删除成功！",
                    "content": list_json.get("content", "当前无商家数据")
                }, ensure_ascii=False)
            else:
                return json.dumps({
                    "success": False,
                    "message": f"商家{merchant_name}删除失败：数据库删除异常"
                }, ensure_ascii=False)

        except Exception as e:
            return json.dumps({
                "success": False,
                "message": f"删除商家失败：{str(e)}"
            }, ensure_ascii=False)