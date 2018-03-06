import scene
import sqlite3


class Task:
    '''
    任务类：
        初始化参数: 任务名task_name， 项目project， 测试套suite
    
    '''
    
    def __init__(self, task_name, project, suite):
        self.name = task_name
        self.project = project
        self.suite = get_suite(suite, project)
        
    def get_suite(self, suite, project):
        suite_data = self.db('select data from suite where name="%s" and project="%s"' % (suite, project))
        return suite_data[0][0].split(',')
    
    def run(self):
        
        set_cookie('公共-用户-用户登录', project_name)
        for elem in self.suite:
            s = Scene(elem, project_name)
            s.run()
            
    def db(self, cmd):
        s = sqlite3.connect(Interface.db_path)
        r = s.execute(cmd).fetchall()
        s.commit()
        s.close()
        return r