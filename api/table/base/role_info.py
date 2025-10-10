#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time    : 2025/09/27
@Author  : weiyutao
@File    : role_info.py
"""

from sqlalchemy import Column, BigInteger, String, DateTime, Integer, Text, func
from datetime import datetime
from api.table.base.base import Base

class RoleInfo(Base):
    """
    角色信息表
    对应 ROLE_INFO 表
    """
    __tablename__ = 'role_info'
    
    # 主键
    id = Column(BigInteger, primary_key=True, autoincrement=True, comment='主键id')
    
    # 角色基本信息
    role_name = Column(String(64), nullable=False, comment='角色名称')
    role_code = Column(String(32), nullable=False, unique=True, index=True, comment='角色代码')
    
    # 角色详细信息
    description = Column(Text, nullable=True, comment='角色描述')
    permissions = Column(Text, nullable=True, comment='权限列表(JSON格式)')
    
    # 状态信息
    role_status = Column(Integer, nullable=False, default=1, comment='角色状态: 0-禁用, 1-启用')
    
    # 系统字段
    creator = Column(String(64), nullable=True, comment='创建者')
    create_time = Column(DateTime, default=func.now(), nullable=False, comment='创建时间')
    updater = Column(String(64), nullable=True, comment='更新者')
    update_time = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False, comment='更新时间')
    
    def __repr__(self):
        return f"<RoleInfo(role_code='{self.role_code}', role_name='{self.role_name}')>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'role_name': self.role_name,
            'role_code': self.role_code,
            'description': self.description,
            'permissions': self.permissions,
            'role_status': self.role_status,
            'creator': self.creator,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            'updater': self.updater,
            'update_time': self.update_time.isoformat() if self.update_time else None,
        }
    
    @classmethod
    def from_dict(cls, data_dict):
        """从字典创建实例"""
        return cls(
            role_name=data_dict.get('role_name'),
            role_code=data_dict.get('role_code'),
            description=data_dict.get('description'),
            permissions=data_dict.get('permissions'),
            role_status=data_dict.get('role_status', 1),
            creator=data_dict.get('creator'),
        )
    
    def update_from_dict(self, data_dict, updater=None):
        """从字典更新实例"""
        for field in ['role_name', 'role_code', 'description', 'permissions', 'role_status']:
            if field in data_dict:
                setattr(self, field, data_dict[field])
        
        if updater:
            self.updater = updater
        self.update_time = datetime.now()
    
    def is_enabled(self):
        """判断角色是否启用"""
        return self.role_status == 1
    
    def get_permissions_list(self):
        """获取权限列表"""
        if self.permissions:
            try:
                import json
                return json.loads(self.permissions)
            except (json.JSONDecodeError, TypeError):
                return []
        return []
    
    def set_permissions_list(self, permissions_list):
        """设置权限列表"""
        if permissions_list:
            import json
            self.permissions = json.dumps(permissions_list, ensure_ascii=False)
        else:
            self.permissions = None