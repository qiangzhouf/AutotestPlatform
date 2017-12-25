import socket
import multiprocessing
import time
from selenium import webdriver
from lib.case import Case
from lib.mtd import mtd
import os
import sys
import sqlite3
import platform


def start_task(task_name, driver):
	# 任务参数获取
	db = sqlite3.connect('web/web.db')
	case_set = db.execute('select case_set from tasks where name=(?)', [task_name]).fetchall()[0][0]
	case_detail = db.execute('select case_detail from case_set where name=(?)', [case_set]).fetchall()[0][0]
	case_list = case_detail.replace('\'', '').replace('(', '').replace(')','').replace(' ', '').replace('[', '').replace(']', '').split(',')
	db.close()

	# 获取用例数据集
	cases = mtd(case_list, task_name)

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
		s.execute('update tasks set progress=(?) where name=(?);', [str(round(10 + 90 / total_num * seq, 2)) + '%', task_name])
		s.commit()
		s.close()
		seq += 1

	s = sqlite3.connect('web/web.db')
	s.execute('update tasks set status="已完成" where name=(?);', [task_name])
	s.commit()
	s.close()

	# 退出浏览器
	driver.quit()
    

def tcplink(sock, addr):
	print('Accept new connection from %s:%s...' % addr)
	sock.send('Connected!'.encode('utf-8'))
	driver = None
	while True:
		data = sock.recv(1024).decode('utf-8')
		if data == 'exit' or not data:
			break
		elif data.split(':')[0] == 'task_name':
			task_name = data.split(':')[1]
			# 浏览器原生组件
			path_driver = 'driver/chromedriver'
			# 创建浏览器实例
			options = webdriver.ChromeOptions()
			options.add_argument('disable-infobars')
			options.add_argument('start-maximized');
			driver = webdriver.Chrome(path_driver, chrome_options=options)
			driver.implicitly_wait(2)

			tt = multiprocessing.Process(target=start_task, args=(task_name, driver))
			tt.daemon = True
			tt.start()
	sock.close()
	print('Connection from %s:%s closed.' % addr)
	if driver is not None:
		driver.quit()


if __name__ == '__main__':
	# listen
	s = socket.socket()
	s.bind(("127.0.0.1",1111))
	s.listen(5)
 
	while True:
		# 接受一个新连接:
		sock, addr = s.accept()
		# 创建新线程来处理TCP连接:
		t = multiprocessing.Process(target=tcplink, args=(sock, addr))
		t.start()
		print(t.pid, t.is_alive())



