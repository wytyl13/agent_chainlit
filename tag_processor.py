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


class TagProcessor:
    """标签处理器类"""
    
    def __init__(self):
        # 定义所有支持的标签模式
        self.tag_patterns = {
            'data_frame': r'<data_frame>(.*?)</data_frame>', # <data_frame>[{"姓名": "张三", "性别": "男"}, {"姓名": "张三", "性别": "男"}, {"姓名": "张三", "性别": "男"}]</data_frame>
            'card': r'<card name="AttendanceCard">(.*?)</card>', # the type of content in tag: List[Dict[str, ]]
            'confirm': r'<confirm>(.*?)</confirm>', # the type of content in tag: string, <confirm>请确认您的订单？</confirm>
            'image': r'<image>(.*?)</image>', # the type of content in tag: string (path or url) <image>url</image>
            'preview': r'<preview>(.*?)</preview>', # the type of content in tag: string (path or url) <image>url</image>
        }


    def parse_content(self, content):
        """
        解析内容，找到所有标签并记录位置和顺序
        
        Returns:
            list: [{'type': 'text'/'tag', 'content': '...', 'tag_name': '...', 'start': pos, 'end': pos}]
        """
        segments = []
        last_pos = 0
        
        # 找到所有标签的位置
        all_matches = []
        
        for tag_name, pattern in self.tag_patterns.items():
            for match in re.finditer(pattern, content, re.DOTALL):
                all_matches.append({
                    'tag_name': tag_name,
                    'start': match.start(),
                    'end': match.end(),
                    'full_match': match.group(0),
                    'inner_content': match.group(1).strip()
                })
        
        # 按位置排序
        all_matches.sort(key=lambda x: x['start'])
        
        # 构建分段内容
        for match in all_matches:
            # 添加标签前的文本内容
            if last_pos < match['start']:
                text_content = content[last_pos:match['start']].strip()
                if text_content:
                    segments.append({
                        'type': 'text',
                        'content': text_content,
                        'start': last_pos,
                        'end': match['start']
                    })
            
            # 添加标签内容
            segments.append({
                'type': 'tag',
                'tag_name': match['tag_name'],
                'content': match['inner_content'],
                'full_match': match['full_match'],
                'start': match['start'],
                'end': match['end']
            })
            
            last_pos = match['end']
        
        # 添加最后剩余的文本
        if last_pos < len(content):
            remaining_text = content[last_pos:].strip()
            if remaining_text:
                segments.append({
                    'type': 'text',
                    'content': remaining_text,
                    'start': last_pos,
                    'end': len(content)
                })
        
        return segments


    async def process_data_frame_tag(self, content):
        """处理data_frame标签"""
        try:
            data_list = json.loads(content)
            df = pd.DataFrame(data_list)
            elements = [cl.Dataframe(data=df, display="inline", name="数据表格")]
            await cl.Message(content="📊 **数据表格**", elements=elements).send()
            print(f"✅ DataFrame处理成功: {df.shape}")
            return True
        except Exception as e:
            print(f"❌ DataFrame处理失败: {e}")
            await cl.Message(content=f"❌ 数据表格处理失败: {str(e)}").send()
            return False


    async def process_card_tag(self, content):
        """处理card标签"""
        try:
            print(f"处理card标签: {content[:50]}...")
            attendance_data = {
                "studentId": "ST001",
                "courseId": "CS001",
                "studentName": "张大爷",
                "month": "2024年12月",
                "stats": {
                    "present": 15,
                    "late": 2,
                    "absent": 1
                },
                "records": [
                    {
                        "courseName": "太极拳基础班",
                        "date": "2024-12-02",
                        "day": "周一",
                        "time": "08:55",
                        "status": "已签到"
                    },
                    {
                        "courseName": "太极拳基础班",
                        "date": "2024-12-04",
                        "day": "周三", 
                        "time": "09:10",
                        "status": "迟到"
                    },
                    {
                        "courseName": "毛笔书法入门",
                        "date": "2024-12-06",
                        "day": "周五",
                        "time": "13:58",
                        "status": "已签到"
                    },
                    {
                        "courseName": "太极拳基础班",
                        "date": "2025-09-06",
                        "day": "周六",
                        "time": "",
                        "status": "缺勤"
                    }
                ]
            }
            
            # 创建自定义元素
            attendance_element = cl.CustomElement(
                name="AttendanceCard",
                props=attendance_data
            )
            
            await cl.Message(
                content="📊 **出勤统计报告** - 点击卡片查看详细信息",
                elements=[attendance_element]
            ).send()




            # # await create_menu_cards()  # 调用你的菜单卡片函数
            
            # # dishes = 
            # # 创建自定义元素
            # # menu_element = cl.CustomElement(
            # #     name="MenuCards",
            # #     props={"dishes": dishes}
            # # )
    
            # await cl.Message(
            #     content="🍽️ **今日推荐菜单** - 点击卡片上的按钮进行操作",
            #     # elements=[menu_element]
            # ).send()
            
            print("✅ Card处理成功")
            return True
        except Exception as e:
            print(f"❌ Card处理失败: {e}")
            return False
    
    
    async def process_confirm_tag(self, content):
        """处理confirm标签"""
        try:
            actions = [
                cl.Action(name="continue", payload={"value": "确认"}, label="🟢 确认操作"),
                cl.Action(name="cancel", payload={"value": "取消"}, label="🔴 取消操作")
            ]
            
            res = await cl.AskActionMessage(
                content=f"⚠️ **操作确认**\n\n{content}",
                actions=actions
            ).send()
        
            if res and res.get("payload").get("value") == "确认":
                # 调用确认接口
                await cl.Message(
                    content="确认!",
                ).send()
            print("✅ Confirm处理成功")
            return True
        except Exception as e:
            print(f"❌ Confirm处理失败: {e}")
            return False
    
    
    async def process_zhuyunying_tag(self, content):
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
            await cl.Message(
                content="📈 **各站点运营数据统计**：",
                elements=[cl.Plotly(name="chart", figure=fig, display="inline")]
            ).send()
            print("✅ Zhuyunying图表处理成功")
            return True
        except Exception as e:
            print(f"❌ Zhuyunying处理失败: {e}")
            return False
    
    
    async def process_preview_tag(self, content):
        iframe_html = f"""
        <iframe 
            src="{content}" 
            width="100%" 
            height="600px" 
            frameborder="0"
            style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        </iframe>
        """
        
        await cl.Message(
            content="网页预览：",
            elements=[cl.Html(content=iframe_html)]
        ).send()
    
    
    async def process_image_tag(self, content):
        """处理image标签"""
        try:
            image_path = content.strip()
            print(f"处理图片: {image_path}")
            print(f"处理图片: {image_path}")
            print(f"处理图片: {image_path}")
            
            if os.path.exists(image_path):
                image = cl.Image(
                    name="图片",
                    display="inline",
                    path=image_path
                )
                await cl.Message(content="🖼️ **相关图片**：", elements=[image]).send()
                print("✅ Image处理成功")
                return True
            elif image_path.startswith("http"):
                image = cl.Image(
                    name="图片",
                    display="inline",
                    url=image_path
                )
                await cl.Message(content="🖼️ **相关图片**：", elements=[image]).send()
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
    
    
    async def process_tag(self, tag_name, content):
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
            return await handler(content)
        else:
            print(f"❌ 未知标签类型: {tag_name}")
            return False
    
    
    async def process_segments(self, segments):
        """按顺序处理所有分段"""
        text_msg = None  # 用于累积文本消息
        print("============================")
        print(segments)
        print("============================")
        for segment in segments:
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
                success = await self.process_tag(segment['tag_name'], segment['content'])
                if not success:
                    await cl.Message(content=f"❌ 标签 {segment['tag_name']} 处理失败").send()
        # 发送最后的文本消息（如果有）
        if text_msg is not None:
            await text_msg.send()