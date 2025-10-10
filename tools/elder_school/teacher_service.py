#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/28 9:16
@Author  : wsy
@File    : teacher_service.py
"""
import json
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

from agent.base.base_tool import tool

from tools.utils import Utils

utils = Utils()
class TeacherServiceSchema(BaseModel):
    type: str = Field(
        default=None,
        description="操作类型：<新增, 修改, 删除, 查看>",
    )
    
    teacher_name: str = Field(
        default=None,
        description="教师名称，如果用户没有提供任何名称复制为空白字符串",
    )

    teacher_id: str = Field(
        default=None,
        description="教师编号，如果用户没有提供任何名称复制为空白字符串",
    )



@tool
class TeacherService:
    args_schema: Type[BaseModel] = TeacherServiceSchema
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
        type: Optional[str] = None, 
        teacher_id: Optional[str] = None,
        teacher_name: Optional[str] = None
    ) -> Any:
        if type == "新增":
            result = utils.request_url(
                    url="https://ai.shunxikj.com:8891/api/teacher_info/save",
                    param_dict={
                        "teacher_id": teacher_id,
                        "teacher_name": teacher_name
                    }
                )
        
        for item in result:
            yield item
        return