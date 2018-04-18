from scene import *
import sqlite3
import threading
from interface import *
import json
import concurrent.futures
import traceback


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
        Interface.host = self.db('select host from project where name="%s"' % (project))[0][0]
        self.lock = threading.Lock()
        
    def get_suite(self, task_name, project):
        suite = self.db('select suite from interf_task where name="%s" and project="%s"' % (task_name, project))[0][0]
        suite_data = self.db('select data from suite where name="%s" and project="%s"' % (suite, project))
        return suite_data[0][0].split(',')
    
    def run(self):
        #t = threading.Thread(target=self.task)
        t = threading.Thread(target=self.mutil_pro)
        t.start()
    
    # 串行执行
    def task(self):
        user_passwd = self.db('select user_passwd from project where name="%s"' % (self.project))[0][0]
        if user_passwd:
            user_passwd = json.loads(user_passwd)
        set_cookie('公共-用户-用户登录', self.project, user_passwd)
        
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
            
            count = self.db('select progress from interf_task where name="%s" and project="%s";' % (self.name, self.project))[0][0]
            count += 1
            self.db('update interf_task set progress="%d" where name="%s" and project="%s";' % (count, self.name, self.project))
            
        self.db('update interf_task set status=2 where name="%s" and project="%s";' % (self.name, self.project))
    
    def single_task(self, single_scene):
        g = threading.local()
        g = {}
        s = Scene(single_scene, self.project, g)
        r = s.run()
        with self.lock:
            try:
                # 刷新场景通过数，通过率
                if r[2]:
                    num = self.db('select pass_num from interf_task where name="%s" and project="%s";' % (self.name, self.project))[0][0]
                    num += 1
                    rate = int(num/self.total*100)
                    self.db('update interf_task set pass_num="%d", pass_rate="%d" where name="%s" and project="%s";' % (num, rate, self.name, self.project))
                # 刷新任务进度
                r_data = json.loads(self.db('select result from interf_task where name="%s" and project="%s";' % (self.name, self.project))[0][0])
                r_data.append(r)
                self.db("update interf_task set result='%s' where name='%s' and project='%s';" % (json.dumps(r_data), self.name, self.project))
                count = self.db('select progress from interf_task where name="%s" and project="%s";' % (self.name, self.project))[0][0]
                count += 1
                self.db('update interf_task set progress="%d" where name="%s" and project="%s";' % (count, self.name, self.project))
            except:
                print(single_scene,'该场景执行结果刷新失败')
                print(traceback.format_exc())
        
    
    # 并发执行
    def mutil_pro(self):
        # 环境准备
        user_passwd = self.db('select user_passwd from project where name="%s"' % (self.project))[0][0]
        if user_passwd:
            user_passwd = json.loads(user_passwd)
        set_cookie('公共-用户-用户登录', self.project, user_passwd)
        
        # 线程池任务映射
        with concurrent.futures.ThreadPoolExecutor(max_workers=50) as e:
            e.map(self.single_task, self.suite)
        
        # 刷新任务结果
        self.db('update interf_task set status=2,progress="%s" where name="%s" and project="%s";' % (self.total, self.name, self.project))
            
    def db(self, cmd):
        s = sqlite3.connect(Interface.db_path)
        r = s.execute(cmd).fetchall()
        s.commit()
        s.close()
        return r
    