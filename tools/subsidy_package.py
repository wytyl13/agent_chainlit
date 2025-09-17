#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/15 16:09
@Author  : wsy
@File    : subsidy_package.py
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




class SubsidyPackageSchema(BaseModel):
    pass
@tool
class SubsidyPackage:
    args_schema: Type[BaseModel] = SubsidyPackageSchema
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
        **kwargs
    ) -> Any:
        result = f"""<card name="SubsidyPackage" content="补贴套餐创建">{[{}]}</card>"""
        for item in result:
            yield item
        return