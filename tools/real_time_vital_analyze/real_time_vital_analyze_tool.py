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
class HealthReportSchema(BaseModel):
    device_type: str = Field(
        ...,
        description="设备类型：从以下三种设备中选择，<生命体征监测仪, 智能床垫, 指夹脉搏监测仪>"
    )
    operation: str = Field(
        ...,
        description="操作类型：从以下三种设备中选择，<睡眠监测仪, 智能床垫, 指夹脉搏监测仪>"
    )


@tool
class RealTimeVitalAnalyze:
    args_schema: Type[BaseModel] = HealthReportSchema
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
        device_type: str = None,
        **kwargs
    ) -> Any:
        result = ""
        if device_type == "智能床垫":
            result_dict = {
                "ws_url": "wss://ai.shunxikj.com:9036",
                "user_name": "张秀英",
                "user_id": "P202309002", 
                "room": "样板间靠窗床位",
                "manager": "李时珍",
                "device_type": device_type,
                "device_id": "UART__TOPIC_SX_SLEEP_HEART_RATE_LG_02_ODATA"
            }
            result_dict_str = json.dumps(result_dict, ensure_ascii=False, indent=2)
            result = f"""<real_time_vital name="RealTimeVitalAnalyzeDynamic" content="智能床垫-实时监测系统已启动！">{result_dict_str}</real_time_vital>"""
        elif device_type == "生命体征监测仪":
            result = "抱歉！稍后开通该服务！"
        elif device_type == "指夹脉搏监测仪":
            result = "抱歉！稍后开通该服务！"

        suggestion_reuslt_dict = {
            "suggestions": ["查看预警事件", "处理预警事件", "查看睡眠报告"]
        }
        suggestion_dict_str = json.dumps(suggestion_reuslt_dict, ensure_ascii=False, indent=2)
        result = result + f"""<suggestions name="Suggestions">{suggestion_dict_str}</suggestions>"""
        result = json.dumps(utils.parse_content(result), ensure_ascii=False, indent=2)
        for item in result:
            yield item
        return
