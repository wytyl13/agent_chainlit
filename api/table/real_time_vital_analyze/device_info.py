#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/27
@Author  : weiyutao
@File    : device_info.py
"""

from sqlalchemy import Column, BigInteger, String, DateTime, Integer, func
from datetime import datetime
from api.table.base.base import Base

class DeviceInfo(Base):
    """
    设备信息表
    对应 SX_DEVICE_INFO 表
    """
    __tablename__ = 'device_info'
    
    # 主键
    id = Column(BigInteger, primary_key=True, autoincrement=True, comment='主键id')
    
    # 设备信息
    device_id = Column(String(128), nullable=False, index=True, comment='设备编号')
    device_type = Column(String(32), nullable=False, comment='设备类型')
    device_name = Column(String(32), nullable=True, comment='设备名称')
    user_name = Column(String(32), nullable=True, comment='用户名称')
    device_status = Column(Integer, nullable=False, comment='设备状态')
    
    # 系统字段
    creator = Column(String(64), nullable=True, comment='创建者')
    create_time = Column(DateTime, default=func.now(), nullable=False, comment='创建时间')
    updater = Column(String(64), nullable=True, comment='更新者')
    update_time = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False, comment='更新时间')
    
    def __repr__(self):
        return f"<DeviceInfo(device_id='{self.device_id}', device_type='{self.device_type}', device_name='{self.device_name}')>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'device_id': self.device_id,
            'device_type': self.device_type,
            'device_name': self.device_name,
            'user_name': self.user_name,
            'device_status': self.device_status,
            
            # 系统字段
            'creator': self.creator,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            'updater': self.updater,
            'update_time': self.update_time.isoformat() if self.update_time else None,
        }
    
    @classmethod
    def from_dict(cls, data_dict):
        """从字典创建实例"""
        return cls(
            device_id=data_dict.get('device_id'),
            device_type=data_dict.get('device_type'),
            device_name=data_dict.get('device_name'),
            user_name=data_dict.get('user_name'),
            device_status=data_dict.get('device_status'),
            
            # 系统字段
            creator=data_dict.get('creator'),
            updater=data_dict.get('updater'),
        )
    
    def update_from_dict(self, data_dict, updater=None):
        """从字典更新实例"""
        if 'device_id' in data_dict:
            self.device_id = data_dict['device_id']
        if 'device_type' in data_dict:
            self.device_type = data_dict['device_type']
        if 'device_name' in data_dict:
            self.device_name = data_dict['device_name']
        if 'user_name' in data_dict:
            self.user_name = data_dict['user_name']
        if 'device_status' in data_dict:
            self.device_status = data_dict['device_status']
        
        # 更新系统字段
        if updater:
            self.updater = updater
        self.update_time = datetime.now()
    
    @property
    def status_display(self):
        """设备状态显示名称"""
        status_map = {
            0: '离线',
            1: '在线',
            2: '故障',
            3: '维护中'
        }
        return status_map.get(self.device_status, '未知状态')
    
    def is_online(self):
        """判断设备是否在线"""
        return self.device_status == 1
    
    def is_offline(self):
        """判断设备是否离线"""
        return self.device_status == 0