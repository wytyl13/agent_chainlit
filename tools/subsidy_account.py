#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/15 16:09
@Author  : wsy
@File    : subsidy_account.py
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




class SubsidyAccountSchema(BaseModel):
    pass

@tool
class SubsidyAccount:
    args_schema: Type[BaseModel] = SubsidyAccountSchema
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

        result = f"""<card name="SubsidyAccount" content="补贴账户余额展示">{[{}]}</card>"""
        for item in result:
            yield item
        return

