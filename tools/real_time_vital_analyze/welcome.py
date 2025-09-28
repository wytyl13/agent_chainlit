#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/04 14:04
@Author  : weiyutao
@File    : test.py
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
from api.server.meal_assistance_subsystem.menu_server import MenuDataServer
from api.server.meal_assistance_subsystem.menu_server import ListMenuData



utils = Utils()
class WelcomeToolSchema(BaseModel):
    service_name: str = Field(
        description=f"欢迎的服务类型"
    )


@tool
class WelcomeTool:
    args_schema: Type[BaseModel] = WelcomeToolSchema
    end_flag: int = 1
    
    @overload
    def __init__(
        self, 
    ):
        ...

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


    async def execute(
        self, 
        service_name: str = None,
        **kwargs
    ) -> Any:
        
        result = ""
        suggestion_dict_str = {}
        if service_name == "商家服务系统":
            result = """商家服务系统：包含查看、新增、修改和删除商家。"""
            suggestion_reuslt_dict = {
                "suggestions": ["查看我的供应商", "修改果多美供应商电话", "删除果多美供应商"]
            }
        elif service_name == "助餐服务子系统":
            result = """助餐服务子系统：支持商家对菜单进行管理。"""
            suggestion_reuslt_dict = {
                "suggestions": ["查看菜单信息", "修改回锅肉价格", "新增西红柿炒鸡蛋菜品"]
            }
        elif service_name == "助餐服务应用":
            result = """助餐服务应用：支持用户点餐、查看订单和修改订单等服务。"""
            suggestion_reuslt_dict = {
                "suggestions": ["我要点餐", "查看我的订单", "修改我的订单"]
            }
        elif service_name == "实时生命体征监测系统":
            result = "实时生命体征监测服务：包含实时生命体征数据监测、回顾预警事件切片以及睡眠报告的查看的解读，可以监测的设备包含：生命体征监测仪、智能床垫和指夹脉搏监测仪。"
            suggestion_reuslt_dict = {
                "suggestions": ["生命体征监测仪-实时生命体征监测", "智能床垫-实时生命体征监测", "查看睡眠报告"]
            }
        self.logger.info(f"result: -------------------------------------- {result}")
        try:
            suggestion_reuslt_dict = {
                "suggestions": ["生命体征监测仪-实时生命体征监测", "智能床垫-实时生命体征监测", "查看睡眠报告"]
            }
            suggestion_dict_str = json.dumps(suggestion_reuslt_dict, ensure_ascii=False, indent=2)
            result = result + f"""<suggestions name="Suggestions">{suggestion_dict_str}</suggestions>"""
        except Exception as e:
            import traceback
            result = f"""fail to exec WelcomeRealTimeVitalAnalyze: {traceback.format_exc()}"""
            
        result = json.dumps(utils.parse_content(result), ensure_ascii=False, indent=2)
        for item in result:
            yield item
        return
