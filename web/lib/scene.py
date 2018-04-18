import sqlite3
from case import *
from interface import *


class Scene:
    '''
    场景类， 根据场景名和项目名实例化
    
    业务流：
        1、从数据库中根据场景名scene_name获得场景包含的case参数;
        2、根据case参数来实例化case;
        3、运行case返回运行结果。
    '''

    
    def __init__(self, scene_name, project, g={}):
        self.s_key = None
        self.project = project
        self.data = self.get_case_data(self.get_scene_data(scene_name))
        self.name = scene_name
        self.status = []
        self.g = g
        
    def get_scene_data(self, scene_name):
        try:
            s = sqlite3.connect(Interface.db_path)
            tmp = s.execute('select data from scene where name="%s" and project="%s"' % (scene_name, self.project)).fetchall()[0][0]
            self.s_key = s.execute('select id from scene where name="%s" and project="%s"' % (scene_name, self.project)).fetchall()[0][0]
            s.close()
            return tmp.replace(' ','').split(',')
        except:
            return []
    
    def get_case_data(self, case_name):
        try:
            s = sqlite3.connect(Interface.db_path)
            tmp = []
            for k,v in enumerate(case_name):
                r = s.execute('select name,data,assert_data,save_data,del_data,pre_time from "case" where name="%s" and s_key=%d' % (v, self.s_key)).fetchall()[case_name[:k].count(v)]
                r = list(r)
                r.insert(0, self.project)
                tmp.append(r)
            s.close()
            return tmp
        except:
            return []
    
    def run(self):
        result = []
        for elem in self.data:
            try:
                c = Case(*elem, g=self.g, s=self.name)
                result.append(c.run())
            except Exception as e:
                print(e)
                result.append((elem[1], 0, ''))
            self.status.append(result[-1][1][0] and result[-1][1][1])
        return self.name, result, 1 if all(self.status) else 0
    
    @classmethod
    def modify(cls, scene_params, case_params):
        s = sqlite3.connect(Interface.db_path)
        s.execute('update scene set data="%s" where project="%s" and name="%s";' % (','.join(scene_params[2]), scene_params[0], scene_params[1]))
        s.commit()
        s_key = s.execute('select id from scene where project="%s" and name="%s";' % (scene_params[0], scene_params[1])).fetchall()[0][0]
        s.execute('delete from "case" where s_key=%d;' % s_key)
        s.commit()
        for i in case_params:
            tmp = i.copy()
            tmp.append(s_key)
            s.execute("insert into 'case' (name,data,assert_data,save_data,del_data,pre_time,s_key) values('%s','%s','%s','%s','%s','%s','%s');" % tuple(tmp))
        s.commit()
        s.close()
    
    
# 测试代码
if __name__ == '__main__':
    scene_name = input('请输入场景名：')
    project_name = input('请输入项目名：')
    
    set_cookie('公共-用户-用户登录', project_name)
    s = Scene(scene_name, project_name)
    print(s.run())
    