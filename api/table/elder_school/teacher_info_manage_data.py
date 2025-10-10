from sqlalchemy import Column, String, Integer, Text, DateTime, Date, Enum, func
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

from api.table.base.base import Base

class TeacherInfoManageData(Base):
    """教师信息数据模型"""
    __tablename__ = 'teacher_info_manage_data'
    
    # 主键
    teacher_id = Column(Integer, primary_key=True, autoincrement=True, comment='教师ID，主键')
    
    # 教师基本信息
    teacher_code = Column(String(20), nullable=False, unique=True, comment='教师编号，唯一标识')
    teacher_name = Column(String(50), nullable=False, comment='教师姓名')
    gender = Column(Enum('男', '女', name='gender_enum'), comment='性别')
    birth_date = Column(Date, comment='出生日期')
    
    # 联系方式
    phone = Column(String(20), comment='联系电话')
    email = Column(String(100), comment='邮箱地址')
    
    # 工作信息
    department = Column(String(50), comment='所属部门')
    position = Column(String(50), comment='职位')
    specialty = Column(Text, comment='专业特长')
    education_background = Column(String(100), comment='学历背景')
    hire_date = Column(Date, comment='入职日期')
    status = Column(Enum('在职', '休假', '离职', name='status_enum'), default='在职', comment='状态，默认在职')
    
    # 头像
    avatar_url = Column(String(255), comment='头像链接')
    
    # 时间戳
    created_at = Column(DateTime, default=func.now(), comment='创建时间')
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), comment='更新时间')
    
    def __repr__(self):
        return f"<Teachers(teacher_id='{self.teacher_id}', teacher_code='{self.teacher_code}', teacher_name='{self.teacher_name}', department='{self.department}')>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'teacher_id': self.teacher_id,
            'teacher_code': self.teacher_code,
            'teacher_name': self.teacher_name,
            'gender': self.gender,
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'phone': self.phone,
            'email': self.email,
            'department': self.department,
            'position': self.position,
            'specialty': self.specialty,
            'education_background': self.education_background,
            'hire_date': self.hire_date.isoformat() if self.hire_date else None,
            'status': self.status,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    @classmethod
    def from_dict(cls, data_dict):
        """从字典创建实例"""
        # 处理日期字符串转换
        birth_date = None
        if data_dict.get('birth_date'):
            if isinstance(data_dict['birth_date'], str):
                birth_date = datetime.strptime(data_dict['birth_date'], '%Y-%m-%d').date()
            else:
                birth_date = data_dict['birth_date']
        
        hire_date = None
        if data_dict.get('hire_date'):
            if isinstance(data_dict['hire_date'], str):
                hire_date = datetime.strptime(data_dict['hire_date'], '%Y-%m-%d').date()
            else:
                hire_date = data_dict['hire_date']
        
        return cls(
            teacher_code=data_dict.get('teacher_code'),
            teacher_name=data_dict.get('teacher_name'),
            gender=data_dict.get('gender'),
            birth_date=birth_date,
            phone=data_dict.get('phone'),
            email=data_dict.get('email'),
            department=data_dict.get('department'),
            position=data_dict.get('position'),
            specialty=data_dict.get('specialty'),
            education_background=data_dict.get('education_background'),
            hire_date=hire_date,
            status=data_dict.get('status', '在职'),
            avatar_url=data_dict.get('avatar_url')
        )
    

    @property
    def id(self):
        return self.teacher_id
    
    @id.setter
    def id(self, value):
        self.teacher_id = value