#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/04 14:04
@Author  : weiyutao
@File    : client_service.py
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


from agent.base.base_tool import tool




class ProcurementProjectSchema(BaseModel):

    type: str = Field(
        default=None,
        description="操作类型：<新增, 修改, 删除, 查看>",
    )
    
    project_name: str = Field(
        default=None,
        description="采购项目项目名称",
    )

    project_time: str = Field(
    default=None,
    description="采购项目项目时长",
    )

    subsidy_method: str = Field(
    default=None,
    description="采购项目补贴方式：<账户充值，服务套餐>",
    )

    area: str = Field(
    default=None,
    description="采购项目适用区域",
    )

    is_ensure: int = Field(
        default=None,
        description="用户确认状态：0=首次新增、修改、删除权限请求，需要向用户确认；1=用户已明确确认，可直接执行该指令。只有当用户明确说出'确认'、'同意'、'是的'等确认词汇时才设为1。"
    )


@tool
class ProcurementProject:
    args_schema: Type[BaseModel] = ProcurementProjectSchema
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
        project_name: Optional[str] = None,
        project_time: Optional[str] = None,
        subsidy_method: Optional[str] = None,
        area: Optional[str] = None,
        is_ensure: Optional[int] = 0,
        **kwargs
    ) -> Any:

        result = None
        if type and project_name and project_time and subsidy_method and area:
            if not type == "查看":
                if is_ensure:
                    result = f"好的，已为您{type}项目{project_name}。"
                else:
                    result = f"好的，收到{type}项目 {project_name} 命令<confirm>请确认是否操作{type}？</confirm>"
            else:
                result = f"好的，已为您{type}项目{project_name}..................................................."
        else:
            if not area:
                result = f"请输入具体的适用区域"

            if not subsidy_method:
                result = f"请提供具体的补贴操作！你可以选择如下操作：<账户充值，服务套餐>"
            
            if not project_time:
                result = "请提供具体的项目开展的时间段"
            if not project_name:
                result = "请提供具体的项目名称"

        for item in result:
            yield item
        return
