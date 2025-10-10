from agent.llm_api.ollama_llm import OllamaLLM
from agent.config.llm_config import LLMConfig
from pathlib import Path
import base64
import asyncio



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


URL_PREFIX = "https://ai.shunxikj.com:9001"
utils = Utils()
class TraditionalMedicalToolSchema(BaseModel):
    device_type: str = Field(
        ...,
        description="设备类型：从以下三种设备中选择，<生命体征监测仪, 智能床垫, 指夹脉搏监测仪>"
    )
    operation: str = Field(
        ...,
        description="操作类型（使用对应操作的英文代码）：<REPORT_REVIEW（睡眠报告回顾）, REPORT_ANALYSIS（睡眠报告解读）>"
    )


@tool
class TraditionalMedicalTool:
    args_schema: Type[BaseModel] = HealthReportToolSchema
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
        operation: str = None,
        user_name: str = None,
        **kwargs
    ) -> Any:
        result = ""
        if device_type == "智能床垫":
            result_dict = {
                "user_name": "张秀英",
                "user_id": "P202309002", 
                "room": "样板间靠窗床位",
                "manager": "李时珍",
                "device_type": device_type,
                "device_id": "UART__TOPIC_SX_SLEEP_HEART_RATE_LG_02_ODATA"
            }
            result_dict_str = json.dumps(result_dict, ensure_ascii=False, indent=2)
            if operation == "REPORT_REVIEW":
                param_dict = {
                    "device_type": "智能床垫",
                    # "user_name": user_name
                }
                result = utils.request_url(
                    url=f"{URL_PREFIX}/api/sleep_statistics",
                    param_dict=param_dict,
                )
                if not result:
                    result = "您还没有睡眠报告！"
                result_dict_str = json.dumps(result, ensure_ascii=False, indent=2)
                result = f"""<card name="HealthReportReview" content="智能床垫-睡眠报告！">{result_dict_str}</card>"""
            elif operation == "REPORT_ANALYSIS":
                # 调用睡眠报告解读接口获取返回值
                result = ""
            else:
                result = "未识别的报告操作类型【报告查看/报告解读】！"
        elif device_type == "生命体征监测仪":
            if operation == "REPORT_REVIEW":
                result = "抱歉！稍后开通该服务！"
            elif operation == "REPORT_ANALYSIS":
                result = "抱歉！稍后开通该服务！"
            else:
                result = "未识别的报告操作类型【报告查看/报告解读】！"
        elif device_type == "指夹脉搏监测仪":
            if operation == "REPORT_REVIEW":
                result = "抱歉！稍后开通该服务！"
            elif operation == "REPORT_ANALYSIS":
                result = "抱歉！稍后开通该服务！"
            else:
                "未识别的报告操作类型【报告查看/报告解读】！"

        suggestion_reuslt_dict = {
            "suggestions": ["我的睡眠质量怎么样？", "我的心率正常吗？", "是否可以给我一些睡眠建议？"]
        }
        suggestion_dict_str = json.dumps(suggestion_reuslt_dict, ensure_ascii=False, indent=2)
        result = result + f"""<suggestions name="Suggestions">{suggestion_dict_str}</suggestions>"""
        result = json.dumps(utils.parse_content(result), ensure_ascii=False, indent=2)
        for item in result:
            yield item
        return




