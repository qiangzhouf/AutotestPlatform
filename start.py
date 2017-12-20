from selenium import webdriver
from lib.case import Case
from lib.mtd import mtd
import os
import sys
import sqlite3
import platform


# 远程模式切换工作目录
if 'web' in os.getcwd():
    os.chdir('..')

# 任务参数获取
case_list = None
try:
    db = sqlite3.connect('web/web.db')
    task_name = sys.argv[1]
    case_set = db.execute('select case_set from tasks where name=(?)', [task_name]).fetchall()[0][0]
    case_detail = db.execute('select case_detail from case_set where name=(?)', [case_set]).fetchall()[0][0]
    case_list = case_detail.replace('\'', '').replace('(', '').replace(')', '').\
        replace(' ', '').replace('[', '').replace(']', '').split(',')
except:
    task_name = None
    pass

# 获取用例数据集
cases = mtd(case_list, task_name)

# 浏览器原生组件路径
if 'Windows' in platform.platform():
    path_driver = 'driver/chrome_driver.exe'
else:
    path_driver = 'driver/chromedriver'
options = webdriver.ChromeOptions()
options.add_argument('disable-infobars')

# 创建浏览器实例
driver = webdriver.Chrome(path_driver, chrome_options=options)
# 设置隐性等待延时（界面加载慢问题）
driver.implicitly_wait(2)

# 遍历执行用例
total_num = len(cases)
seq = 1
for single_case in cases:
    my_case = Case(single_case, driver, task_name)
    my_case.run()
    del my_case
    driver.refresh()
    # 刷新进度
    s = sqlite3.connect('web/web.db')
    s.execute('update tasks set progress=(?) where name=(?);',
              [str(round(10 + 90 / total_num * seq, 2)) + '%', task_name])
    s.commit()
    s.close()
    seq += 1

s = sqlite3.connect('web/web.db')
s.execute('update tasks set status="已完成" where name=(?);', [task_name])
s.commit()
s.close()

# 退出浏览器
driver.quit()
