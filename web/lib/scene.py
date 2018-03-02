import sqlite3
from case import *


class Scene:
    '''
    场景类， 根据场景名和项目名实例化
    
    业务流：
        1、从数据库中根据场景名scene_name获得场景包含的case参数;
        2、根据case参数来实例化case;
        3、运行case返回运行结果。
    '''
    
    def __init__(self, project, scene_name):
        self.s_key = None
        self.project = project
        self.data = self.get_case_data(self.get_scene_data(scene_name))
        self.name = project+'|'+scene_name
        self.status = []
        
    def get_scene_data(self, scene_name):
        s = sqlite3.connect(Interface.db_path)
        tmp = s.execute('select data from scene where name="%s" and project="%s"' % (scene_name, self.project)).fetchall()[0][0]
        self.s_key = s.execute('select id from scene where name="%s" and project="%s"' % (scene_name, self.project)).fetchall()[0][0]
        s.close()
        return tmp.replace(' ','').split(',')
    
    def get_case_data(self, case_name):
        s = sqlite3.connect(Interface.db_path)
        tmp = []
        for elem in case_name:
            r = s.execute('select project,name,data,assert_data,save_data,del_data,pre_time from "case" where name="%s" and project="%s" and s_key="%s"' % (elem, self.project, self.s_key)).fetchall()[0]
            tmp.append(r)
        s.close()
        return tmp
    
    def run(self):
        result = []
        for elem in self.data:
            c = Case(*elem)
            result.append(c.run())
            self.status.append(result[-1][1][0] and result[-1][1][1])
        return self.name, result, all(self.status)
    
    @classmethod
    def add(cls, scene_params, case_params):
        pass
    
    @classmethod
    def modify(cls, scene_params, case_params):
        pass
    
    @classmethod
    def delete(cls, scene_params, case_params):
        pass
        
    
    
# 测试代码
if __name__ == '__main__':
    set_cookie('车综平台', '公共-用户-用户登录')
    
    s = Scene('车综平台', '假牌车预警')
    print(s.run())
    