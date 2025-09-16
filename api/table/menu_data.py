#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/15 11:22
@Author  : weiyutao
@File    : menu_data.py
"""

from sqlalchemy import Column, String, Integer, Float, Text, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

from api.table.base import Base

class MenuData(Base):
    """菜品数据模型"""
    __tablename__ = 'menu_data'
    
    # 主键
    id = Column(Integer, primary_key=True, autoincrement=True, comment='自增主键')
    
    # 菜品基本信息
    dish_name = Column(String(100), nullable=False, comment='菜品名称')
    category = Column(String(50), nullable=False, comment='菜品分类')
    price = Column(Float, nullable=False, comment='价格')
    
    # 菜品详细信息
    ingredients = Column(Text, comment='主要食材')
    nutrition = Column(Text, comment='营养特点')
    rating = Column(Float, default=0.0, comment='评分')
    description = Column(Text, comment='菜品描述')
    url = Column(String(500), comment='菜品图片URL')
    
    # 时间戳
    create_time = Column(DateTime, default=func.now(), comment='创建时间')
    update_time = Column(DateTime, default=func.now(), onupdate=func.now(), comment='更新时间')
    
    def __repr__(self):
        return f"<DishData(dish_id='{self.dish_id}', dish_name='{self.dish_name}', category='{self.category}', price={self.price})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'dish_id': self.dish_id,
            'dish_name': self.dish_name,
            'category': self.category,
            'price': self.price,
            'ingredients': self.ingredients,
            'nutrition': self.nutrition,
            'rating': self.rating,
            'description': self.description,
            'url': self.url,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            'update_time': self.update_time.isoformat() if self.update_time else None,
        }
    
    @classmethod
    def from_dict(cls, data_dict):
        """从字典创建实例"""
        return cls(
            dish_id=data_dict.get('dish_id'),
            dish_name=data_dict.get('dish_name'),
            category=data_dict.get('category'),
            price=data_dict.get('price'),
            ingredients=data_dict.get('ingredients'),
            nutrition=data_dict.get('nutrition'),
            rating=data_dict.get('rating', 0.0),
            description=data_dict.get('description'),
            url=data_dict.get('url')
        )