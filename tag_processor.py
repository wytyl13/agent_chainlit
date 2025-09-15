#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/14 12:39
@Author  : weiyutao
@File    : tag_processor.py
"""


import re
import json
import pandas as pd
import chainlit as cl
from plotly.subplots import make_subplots
import plotly.graph_objects as go
import os
from typing import (
    List,
    Optional 
)


from tools.utils import Utils
from tools.utils import TAG_PATTERNS

utils = Utils()


class TagProcessor:
    """标签处理器类"""

    def __init__(self):
        # 定义所有支持的标签模式
        self.tag_patterns = TAG_PATTERNS


    async def process_data_frame_tag(self, content, attributes=None, chat_history: Optional[List] = None, function_call_url: Optional[str] = None):
        """处理data_frame标签"""
        try:
            message_content = attributes.get('content') if attributes else '📊 **数据表格**'
            data_list = json.loads(content)
            # 将字典表转换为列数据，方便pandas读取为dataframe格式
            data_list = utils.convert_to_column_format(data_list=data_list)
            df = pd.DataFrame(data_list)
            elements = [cl.Dataframe(data=df, display="inline", name="数据表格")]
            await cl.Message(content=f"{message_content}\n📊 **数据表格**", elements=elements).send()
            print(f"✅ DataFrame处理成功: {df.shape}")
            return True
        except Exception as e:
            print(f"❌ DataFrame处理失败: {e}")
            await cl.Message(content=f"❌ 数据表格处理失败: {str(e)}").send()
            return False


    async def process_card_tag(self, content, attributes=None, chat_history: Optional[List] = None, function_call_url: Optional[str] = None):
        """处理card标签"""
        try:
            card_name = attributes.get('name', 'DefaultCard') if attributes else 'DefaultCard'
            data_list = json.loads(content)
            message_content = attributes.get('content', '🍽️ **今日推荐菜单** - 点击卡片上的按钮进行操作') if attributes else '🍽️ **今日推荐菜单** - 点击卡片上的按钮进行操作'
            
            print(f"card_name: ---------------------------- {card_name}")
            print(f"data_list: ---------------------------- {data_list}")
            # # 创建自定义元素
            menu_element = cl.CustomElement(
                name=card_name,
                props={"data": data_list}
            )
    
            await cl.Message(
                content=message_content,
                elements=[menu_element]
            ).send()
            
            print("✅ Card处理成功")
            return True
        except Exception as e:
            print(f"❌ Card处理失败: {e}")
            return False


    async def process_confirm_tag(self, content, attributes=None, chat_history: Optional[List] = None, function_call_url: Optional[str] = None):
        """处理confirm标签"""
        try:
            actions = [
                cl.Action(name="continue", payload={"value": "确认"}, label="🟢 确认操作"),
                cl.Action(name="cancel", payload={"value": "取消"}, label="🔴 取消操作")
            ]
            message_content = attributes.get('content') if attributes else ""
            content = message_content if content == "" or content is None else content
            
            res = await cl.AskActionMessage(
                content=f"⚠️ **操作确认**\n\n{content}",
                actions=actions
            ).send()
            print("whoami-----------------------------------------------------------------------")
            print("whoami-----------------------------------------------------------------------")
            if res and res.get("payload").get("value") == "确认":
                # 调用确认接口
                await cl.Message(
                    content="确认!",
                ).send()
                
                param_dict = {
                    "question": "确认!",
                    "messages": chat_history
                }
                print(f"param_dict: --------------------------------- {param_dict}")
                print(f"function_call_url: --------------------------------- {function_call_url}")
                # function_call
                result = utils.request_url(
                    url=function_call_url,
                    param_dict=param_dict
                )
                print("================================")
                print(result)
                print("================================")
                segments = None
                try:
                    segments = json.loads(result)
                    print("接受到json格式返回数据")
                except Exception as e:
                    print("接受到字符串格式返回数据")
                    segments = utils.parse_content(content=result)
                result_seg = await self.process_segments(segments=segments, chat_history=chat_history, function_call_url=function_call_url)
                
            print("✅ Confirm处理成功")
            return True
        except Exception as e:
            import traceback
            print(f"❌ Confirm处理失败: {str(e)}\n{traceback.format_exc()}")
            return False


    async def process_zhuyunying_tag(self, content, attributes=None, chat_history: Optional[List] = None, function_call_url: Optional[str] = None):
        """处理zhuyunying标签"""
        try:
            # 数据
            sites = ["幸福站", "和谐站", "康乐站"]
            orders = [865, 743, 621]
            satisfaction = [0.99, 0.98, 0.97]
            
            # 创建子图
            fig = make_subplots(
                rows=1, cols=2,
                subplot_titles=("订单数统计", "满意度统计"),
                specs=[[{"secondary_y": False}, {"secondary_y": False}]]
            )
            
            # 添加订单数柱状图
            fig.add_trace(
                go.Bar(x=sites, y=orders, name="订单数", marker_color='lightblue'),
                row=1, col=1
            )
            
            # 添加满意度柱状图
            fig.add_trace(
                go.Bar(x=sites, y=satisfaction, name="满意度", marker_color='lightgreen'),
                row=1, col=2
            )
            
            # 更新布局
            fig.update_layout(
                title="智慧养老社区 - 各站点运营数据",
                showlegend=False,
                title_x=0.5,
                height=400,
            )
            
            # 发送图表
            message_content = attributes.get('content') if attributes else ''
            await cl.Message(
                content=f"{message_content}\n📈 **各站点运营数据统计**：",
                elements=[cl.Plotly(name="chart", figure=fig, display="inline")]
            ).send()
            print("✅ Zhuyunying图表处理成功")
            return True
        except Exception as e:
            print(f"❌ Zhuyunying处理失败: {e}")
            return False


    async def process_preview_tag(self, content, attributes=None, chat_history: Optional[List] = None, function_call_url: Optional[str] = None):
        try:
            message_content = attributes.get('content') if attributes else ''
            name = attributes.get('name') if 'name' in attributes else 'WebPreviewCard'
            title = attributes.get('title') if 'title' in attributes else '订单详情'
            content = message_content if content is None or content == "" else content
            
            # # 创建自定义元素
            data = [
                {"title": "订单", "link": content, "image": "", "content": ""}
            ]
            
            menu_element = cl.CustomElement(
                name=name,
                props={"data": data}
            )
    
            await cl.Message(
                content=message_content,
                elements=[menu_element]
            ).send()
            return True
        except Exception as e:
            import traceback
            error_info = (f"标签处理失败{str(e)}\n{traceback.format_exc()}")
            print(error_info)
            return False


    async def process_image_tag(self, content, attributes=None, chat_history: Optional[List] = None, function_call_url: Optional[str] = None):
        """处理image标签"""
        try:
            image_path = content.strip()
            print(f"处理图片: {image_path}")
            print(f"处理图片: {image_path}")
            print(f"处理图片: {image_path}")
            message_content = attributes.get('content') if attributes else ''
            if os.path.exists(image_path):
                image = cl.Image(
                    name="图片",
                    display="inline",
                    path=image_path
                )
                await cl.Message(content=f"{message_content}\n🖼️ **相关图片**：", elements=[image]).send()
                print("✅ Image处理成功")
                return True
            elif image_path.startswith("http"):
                image = cl.Image(
                    name="图片",
                    display="inline",
                    url=image_path
                )
                await cl.Message(content=f"{message_content}\n🖼️ **相关图片**：", elements=[image]).send()
                print("✅ Image处理成功")
                return True
            else:
                await cl.Message(content=f"❌ 图片不存在: {image_path}").send()
                print(f"❌ 图片不存在: {image_path}")
                return False
        except Exception as e:
            print(f"❌ Image处理失败: {e}")
            await cl.Message(content=f"❌ 图片处理失败: {str(e)}").send()
            return False


    async def process_tag(self, tag_name, content, attributes, chat_history: Optional[List] = None, function_call_url: Optional[str] = None):
        """根据标签名称处理对应的标签"""
        handler_map = {
            'data_frame': self.process_data_frame_tag,
            'card': self.process_card_tag,
            'confirm': self.process_confirm_tag,
            'zhuyunying': self.process_zhuyunying_tag,
            'image': self.process_image_tag,
            'preview': self.process_preview_tag
        }
        
        handler = handler_map.get(tag_name)
        if handler:
            return await handler(content, attributes, chat_history, function_call_url)
        else:
            print(f"❌ 未知标签类型: {tag_name}")
            return False


    async def process_segments(self, segments, chat_history: Optional[List] = None, function_call_url: Optional[str] = None):
        """按顺序处理所有分段"""
        text_msg = None  # 用于累积文本消息
        print("============================")
        print("segments: --------------------- {segments}")
        print("============================")
        for i, segment in enumerate(segments):
            print(f"分段{i+1}: {segment['type']}", 
            f"- {segment.get('tag_name', 'text')}", 
            f"- 属性: {segment.get('attributes', {})}")
            if segment['type'] == 'text':
                # 处理文本内容 - 流式输出
                if text_msg is None:
                    text_msg = cl.Message(content="")
                # 流式输出文本
                await text_msg.stream_token(segment['content'])
            elif segment['type'] == 'tag':
                # 先发送累积的文本消息（如果有）
                if text_msg is not None:
                    await text_msg.send()
                    text_msg = None
                
                # 处理标签
                print(f"🏷️  处理标签: {segment['tag_name']}")
                success = await self.process_tag(
                    segment['tag_name'], 
                    segment['content'], 
                    segment.get('attributes'),  # 新增传递attributes
                    chat_history,
                    function_call_url
                )
                if not success:
                    import traceback
                    await cl.Message(content=f"❌ 标签 {segment['tag_name']} 处理失败\n{traceback.format_exc()}").send()
        # 发送最后的文本消息（如果有）
        if text_msg is not None:
            await text_msg.send()