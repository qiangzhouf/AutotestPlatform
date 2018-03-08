from scene import *
import sqlite3
import threading
from interface import *


class Task:
    '''
    任务类：
        初始化参数: 任务名task_name， 项目project
    
    '''
    
    def __init__(self, task_name, project):
        self.name = task_name
        self.project = project
        self.suite = self.get_suite(task_name, project)
        self.total = len(self.suite)
        
    def get_suite(self, task_name, project):
        suite = self.db('select suite from interf_task where name="%s" and project="%s"' % (task_name, project))[0][0]
        suite_data = self.db('select data from suite where name="%s" and project="%s"' % (suite, project))
        return suite_data[0][0].split(',')
    
    def run(self):
        t = threading.Thread(target=self.task)
        t.start()
        
    def task(self):
        set_cookie('公共-用户-用户登录', self.project)
        count=0
        for elem in self.suite:
            s = Scene(elem, self.project)
            r = s.run()
            if r[2]:
                num = self.db('select pass_num from interf_task where name="%s" and project="%s";' % (self.name, self.project))[0][0]
                num += 1
                rate = int(num/self.total*100)
                self.db('update interf_task set pass_num="%d", pass_rate="%d" where name="%s" and project="%s";' % (num, rate, self.name, self.project))
            r_data = json.loads(self.db('select result from interf_task where name="%s" and project="%s";' % (self.name, self.project))[0][0])
            r_data.append(r)
            self.db("update interf_task set result='%s' where name='%s' and project='%s';" % (json.dumps(r_data), self.name, self.project))
            count += 1
            pro = int(count/self.total*100)
            self.db('update interf_task set progress="%d" where name="%s" and project="%s";' % (pro, self.name, self.project))
        self.db('update interf_task set status=2 where name="%s" and project="%s";' % (self.name, self.project))
            
    def db(self, cmd):
        s = sqlite3.connect(Interface.db_path)
        r = s.execute(cmd).fetchall()
        s.commit()
        s.close()
        return r
    