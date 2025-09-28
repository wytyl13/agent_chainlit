#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/15 11:22
@Author  : weiyutao
@File    : merchant_data.py
"""

from sqlalchemy import Column, String, Integer, Float, Text, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

from api.table.base.base import Base

class MerchantData(Base):
    """商家数据模型"""
    __tablename__ = 'merchant_data'
    
    # 主键
    id = Column(Integer, primary_key=True, autoincrement=True, comment='自增主键')
    
    # 商家基本信息
    merchant_name = Column(String(100), nullable=False, comment='商家名称')
    category = Column(String(50), nullable=False, comment='商家类型（餐厅/食堂/中央厨房）')
    contact_person = Column(String(50), nullable=False, comment='联系人姓名')
    phone = Column(String(20), nullable=False, comment='联系电话')
    address = Column(Text, nullable=False, comment='商家地址')
    service_area = Column(String(200), comment='服务区域')
    
    # 证照信息
    business_license = Column(String(100), nullable=False, comment='营业执照号')
    food_license = Column(String(100), nullable=False, comment='食品经营许可证号')
    
    # 经营信息
    capacity = Column(Integer, comment='日供餐能力（份）')
    rating = Column(Float, default=0.0, comment='商家评分（0-5分）')
    status = Column(String(20), nullable=False, comment='状态（启用/禁用/审核中）')
    description = Column(Text, comment='商家描述')
    
    # 时间戳
    create_time = Column(DateTime, default=func.now(), comment='创建时间')
    update_time = Column(DateTime, default=func.now(), onupdate=func.now(), comment='更新时间')
    
    def __repr__(self):
        return f"<MerchantData(id='{self.id}', merchant_name='{self.merchant_name}', category='{self.category}', status='{self.status}')>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'merchant_name': self.merchant_name,
            'category': self.category,
            'contact_person': self.contact_person,
            'phone': self.phone,
            'address': self.address,
            'service_area': self.service_area,
            'business_license': self.business_license,
            'food_license': self.food_license,
            'capacity': self.capacity,
            'rating': self.rating,
            'status': self.status,
            'description': self.description,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            'update_time': self.update_time.isoformat() if self.update_time else None,
        }
    
    @classmethod
    def from_dict(cls, data_dict):
        """从字典创建实例"""
        return cls(
            merchant_name=data_dict.get('merchant_name'),
            category=data_dict.get('category'),
            contact_person=data_dict.get('contact_person'),
            phone=data_dict.get('phone'),
            address=data_dict.get('address'),
            service_area=data_dict.get('service_area'),
            business_license=data_dict.get('business_license'),
            food_license=data_dict.get('food_license'),
            capacity=data_dict.get('capacity'),
            rating=data_dict.get('rating', 0.0),
            status=data_dict.get('status'),
            description=data_dict.get('description')
        )