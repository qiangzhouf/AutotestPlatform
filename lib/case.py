import time
import xml.etree.ElementTree as Et
import csv
import re
import os
import random
import sqlite3


class Case:
    """用例类，主要包括：用执行、日志打印、错误截图、报表。

    执行流图：
    run()
    |_ _ _ _ _ _ _
    |       \     \
    login()  \     \
    |_ _ _ _ /      \
    |                \
    turn_to_page()    \
    |_ _ _ _ _ _ _ _ _/
    |
    _step()
    |
    error_print(),log_print()
    |
    report()

    业务逻辑实现主要在_step()。

    """

    def __init__(self, case_data, driver, task_name):
        """实例化方法，获取用例csv文件，并赋值给实例属性"""

        # 载入用例抽象数据
        with open(('data/%s/' % task_name) + case_data) as f:
            data_list = []
            csv_r = csv.reader(f)
            for row in csv_r:
                data_list.append(row)

        # 属性，用例csv文件的可用信息
        self.data = data_list[3:]
        self.page = data_list[1][0]
        self.url = data_list[1][1]
        self.model = data_list[1][2]
        self.frame = data_list[1][3]
        self.name = case_data.replace('.csv', '')
        self.task_name = task_name

        # 浏览器实例
        self.driver = driver

        # 日志打印需要的信息
        self.info = ('url:' + self.url, 'page:' + self.page, 'model:' + self.model, 'name:' + self.name)

    def run(self):
        """用例执行入口函数，执行用例从此开始"""

        # 先判断浏览器当前页面url是否是要执行的用例的页面url

        # 如果成立，执行_step()操作
        if self.driver.current_url.split('/')[-1] == self.url:
            self._step(self.data)
        # 如果是首页，执行turn_to_page('index')操作
        elif self.driver.current_url.split('/')[-1] == 'index.html':
            self.turn_to_page('index')
        # 如果是其它功能页，执行turn_to_page()操作
        elif ('/new_viewer' in self.driver.current_url) and ('login' not in self.driver.current_url):
            self.turn_to_page()
        # 如果未登陆，执行login（）
        else:
            self.login()

    def _single_step(self, case_step, info_list, data, step_i):
        """csv文件对应的每一行，即单步操作的参数。

        xpath(case_step[0]) / operate(case_step[1]) / cdata(case_step[2])
        定位路径 / 操作方法 / 数据

        """

        # 执行成功标志flag，数据预处理
        flag = ['success']
        xpath = case_step[0]
        operate = case_step[1]
        cdata = case_step[2].replace('[', '').replace(']', '').replace('\'', '').\
            replace(', ', ',').strip().split(';')

        # —————— 操作 ——————
        # 成功就正常执行
        case_step[0], case_step[2], res, obj = op_method(xpath, operate, cdata, info_list, data, driver=self.driver)

        # 最后都打印普通日志
        # 更新进度和数据
        self.log_print(flag[-1] + '\n' + str(case_step) + ('' if obj is None else '\n' + str(obj)))
        case_step_mp = str(case_step[2]) + ('' if obj is None else '\n' + str(obj))

        s = sqlite3.connect('web/web.db')
        if 'login' not in self.name and 'menu' not in self.name:
            s.execute('update "%s" set xpath=\'%s\',data="%s",step_flag="%s" where case_name="%s" and ordd="%s";'
                      % (self.task_name, str(case_step[0]), case_step_mp, 2, self.name, str(step_i)))

        # 失败，打印异常日志和截图
        if res == 'error':
            flag.append('failed')
            img_path = self.error_print(str(case_step) + ('' if obj is None else '\n' + str(obj)))
            if 'login' not in self.name and 'menu' not in self.name:
                s.execute('update "%s" set step_flag="%s",img="%s" where case_name="%s" and ordd="%s";'
                          % (self.task_name, 1, img_path, self.name, str(step_i)))

        s.commit()
        s.close()
        return res

    def _step(self, data):
        """循环遍历data，多步操作用例的执行"""
        info_list = []
        step_i = 1
        for case_step in data:
            time.sleep(0.3)
            res = self._single_step(case_step, info_list, data, step_i)
            step_i += 1
            if res == 'break':
                break

        # 更新用例状态和任务信息
        if 'login' not in self.name and 'menu' not in self.name:
            s = sqlite3.connect('web/web.db')
            resul = s.execute('select step_flag from "%s" where case_name="%s"' % (
                self.task_name, self.name)).fetchall()
            if (1,) in resul:
                s.execute('update "%s" set flag="%s" where case_name="%s" and type=0;'
                          % (self.task_name, 1, self.name))
            else:
                s.execute('update "%s" set flag="%s" where case_name="%s" and type=0;'
                          % (self.task_name, 2, self.name))
                pass_num = int(s.execute('select pass_num from tasks where name="%s"'
                               % self.task_name).fetchall()[0][0]) + 1
                total_num = int(s.execute('select total_num from tasks where name="%s"' % self.task_name
                                          ).fetchall()[0][0])
                pass_rate = str(round(pass_num/total_num*100, 2)) + '%'
                s.execute('update tasks set pass_num="%s",pass_rate="%s" where name="%s";'
                          % (pass_num, pass_rate, self.task_name))
            s.commit()
            s.close()

    def report(self):
        pass

    def error_print(self, log_info):
        t1 = time.strftime("%Y%m%d_%H_", time.localtime())
        t2 = time.strftime("%Y-%m-%d   %H:%M:%S", time.localtime())
        t3 = time.strftime("%Y%m%d_%H%M%S_", time.localtime())
        image_name = ('log/%s/error/image/' % self.task_name) + t3 + self.name + '_sh.png'
        self.driver.get_screenshot_as_file(image_name)
        with open(('log/%s/error/' % self.task_name) + t1 + 'error_log.txt', 'a') as f:
            f.write(t2 + '\n' + str(self.info) + '\n' + log_info + '\n' + image_name + '\n\n')
            f.close()
        return '../' + image_name

    def log_print(self, log_info):
        t1 = time.strftime("%Y%m%d_%H_", time.localtime())
        t2 = time.strftime("%Y-%m-%d   %H:%M:%S", time.localtime())
        with open(('log/%s/' % self.task_name) + t1 + 'log.txt', 'a') as f:
            f.write(t2 + '   ' + self.name + '   ' + log_info + '\n\n')
            f.close()

    def turn_to_page(self, flag=None):
        tmp_name = self.name
        self.name = 'menu'
        if flag == 'index':
            # 获取页面跳转相关参数
            index_data = Et.parse('page/' + 'index.xml').getroot()
            html = index_data.find('html')
            xp = html.get('xpath') + html.find('turn').get('xpath')
            location = index_data.find('data').find(self.url).text
            xp = xp.replace('@@', location)
            time.sleep(1)
            try:
                elem = self.driver.find_element_by_xpath(xp)
                elem.click()
            except:
                self.error_print(xp)
        else:
            # 获取页面跳转相关参数
            with open(('data/%s/' % self.task_name) + 'menu_1.csv') as f:
                menu_list = []
                csv_r = csv.reader(f)
                for row in csv_r:
                    menu_list.append(row)
            # 执行跳转
            menu_list[4][0] = menu_list[4][0].replace('**', self.url.split('/')[-1])
            menu_list[5][0] = menu_list[5][0].replace('**', self.url.split('/')[-1])
            self._step(menu_list[3:])

        time.sleep(1)
        # 跳转后，切换到跳转页面
        for handle in self.driver.window_handles:
            self.driver.switch_to.window(handle)
        # 切换页面内联框架
        if self.frame != '':
            self.driver.switch_to.frame(self.driver.find_element_by_tag_name(self.frame))
        # 跳转成功后回到目标函数继续执行用例
        time.sleep(1)
        self.name = tmp_name
        self.run()

    def login(self):
        # 获取配置参数
        conf_data = Et.parse('conf/' + 'conf.xml').getroot()
        url = 'http://' + conf_data.find('ip').text + ':' + conf_data.find('port').text + '/'
        # 获取登陆参数
        with open(('data/%s/' % self.task_name) + 'login_1.csv') as f:
            login_list = []
            csv_r = csv.reader(f)
            for row in csv_r:
                login_list.append(row)
        # 执行登陆
        url += login_list[1][1]
        login_data = login_list[3:]
        self.driver.get(url)
        time.sleep(1)
        self.driver.maximize_window()
        time.sleep(1)
        tmp_name = self.name
        self.name = 'login'
        self._step(login_data)
        # 登陆成功后回到目标函数继续执行用例
        time.sleep(2)
        self.name = tmp_name
        self.run()


def op_method(xpath, operate, cdata, info_list, data, driver=None):
    a_obj = None
    try:
        for i in range(len(cdata)):
            if 'info_list' in cdata[i]:
                cdata[i] = info_list[int(cdata[i].replace('info_list', ''))-1]

        if 'info_list' in xpath:
            xpath_list = xpath.split('info_list')
            xpath = xpath_list[0] + info_list[int(xpath_list[1][0])-1] + xpath_list[1][1:]

        # —————— 方法 ——————
        # 点击操作
        if operate == 'click':
            try:
                elem = driver.find_element_by_xpath(xpath)
            except:
                elem = None
            if cdata[-1] == '_if':
                if cdata[-2] == '_attribute':
                    if cdata[0] in elem.get_attribute(cdata[-3]):
                        elem.click()
                elif cdata[-2] == '已完成':
                    assert elem is None
                elif cdata[-2] == '分析中':
                    elem.click()
                elif cdata[-2] == '_break':
                    if elem is not None:
                        elem.click()
                    else:
                        return 'break'
            elif cdata[-1] == '_index':
                xp = xpath.split('[**]')
                elems1 = driver.find_elements_by_xpath(xp[0])
                obj = sorted(random.sample([e + 1 for e in range(len(elems1))], random.randint(1, len(elems1))))
                tmp_list = []
                for i in obj:
                    xpath1 = xp[0] + '[' + i + ']' + xp[1]
                    elems2 = driver.find_elements_by_xpath(xpath1)
                    obj2 = sorted(random.sample([e + 1 for e in range(len(elems2))], random.randint(1, len(elems2))))
                    for j in obj2:
                        xpath2 = xpath1 + '[' + j + ']' + xp[2]
                        elem = driver.find_element_by_xpath(xpath2)
                        elem.click()
                        if cdata[-2] == '_save':
                            tmp_list.append(elem.get_attribute('textContent'))
                if len(tmp_list):
                    info_list.append(tmp_list)
            elif cdata[-1] == '_try':
                try:
                    elem = driver.find_element_by_xpath(xpath)
                    elem.click()
                except:
                    time.sleep(2)
                    elem = driver.find_element_by_xpath(xpath)
                    elem.click()
                finally:
                    time.sleep(2)
                    elem = driver.find_element_by_xpath(xpath)
                    elem.click()
            else:
                elem.click()

        # 输入操作
        elif operate == 'input':
            elem = driver.find_element_by_xpath(xpath)
            if cdata[-1] == '_video':
                cdata[0] = random.sample(os.listdir('video//'), 1)[0]
            elif cdata[-1] == '_time':
                if cdata[-2] == 'today':
                    t_time = '%s:%s:%s' % ("{:02}".format(random.randint(0, 23)), "{:02}".format(random.randint(0, 59)),
                                           "{:02}".format(random.randint(0, 59)))
                    t_date = '%Y-%m-%d '
                    tt = time.strftime(t_date + t_time, time.localtime())
                    cdata[0] = tt
                elif cdata[-2] == '_little':
                    ot = time.mktime(time.strptime(cdata[0], '%Y-%m-%d %H:%M:%S'))
                    cdata[0] = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(ot - 10))
            elif cdata[-1] == '_randint':
                cdata[0] = random.randint(1, int(cdata[0]))
            elif cdata[-1] == '_path':
                cdata[0] = os.getcwd() + '/video/' + cdata[0]
                elem.send_keys(cdata[0])
                time.sleep(60)
                return xpath, cdata, '', '' 
            elem.clear()
            elem.send_keys(cdata[0])
            elem.click()
            info_list.append(cdata[0])

        # 断言校验
        elif operate == 'assert':
            try:
                elem = driver.find_element_by_xpath(xpath)
            except:
                time.sleep(1)
                try:
                    elem = driver.find_element_by_xpath(xpath)
                except:
                    elem = None
            cdata[0] = cdata[0].replace('@', ' ')

            # 非检验
            if cdata[-1] == '_not':
                if cdata[-2] == '_attribute':
                    assert_object = elem.get_attribute(cdata[-3])
                    a_obj = assert_object
                    assert assert_object not in cdata
                elif cdata[-2] == '_elem':
                    assert elem is None
                else:
                    assert_object = elem.text
                    a_obj = assert_object
                    assert assert_object not in cdata
            # 元素个数校验
            elif cdata[-1] == '_len':
                elem = driver.find_elements_by_xpath(xpath)
                num = len(elem)
                a_obj = num
                assert int(cdata[0]) == num
            # 进度条检验
            elif cdata[-1] == '_progress':
                a_obj = elem.text
                if cdata[0] == '已完成':
                    assert elem.text == '100%'
                elif cdata[0] == '分析中' or cdata[0] == '已停止':
                    tmp = elem.text.split('.')
                    if len(tmp) > 1:
                        assert int(tmp[0]) <= 100 and len(tmp[1]) <= 3 and tmp[1][-1] == '%'
                    else:
                        assert '%' in tmp[0] and int(tmp[0][:-1]) <= 100
                elif cdata[0] == '未识别':
                    assert elem.text == '0%'
                else:
                    assert cdata[0] == elem.text
            # 等待出现校验
            elif cdata[-1] == '_wait':
                if cdata[-2] == '_not':
                    while elem is not None:
                        time.sleep(0.5)
                        try:
                            elem = driver.find_element_by_xpath(xpath)
                        except:
                            elem = None
                else:
                    while elem is None:
                        time.sleep(0.5)
                        elem = driver.find_element_by_xpath(xpath)
            # 属性校验
            elif cdata[-1] == '_attribute':
                assert_object = elem.get_attribute(cdata[-2])
                a_obj = assert_object
                assert assert_object in cdata
            # 时间点校验
            elif cdata[-1] == '_t_point':
                if cdata[-2] == '_min':
                    ot = time.mktime(time.strptime(elem.text, '%Y-%m-%d %H:%M:%S'))
                    nt = time.time()
                    a_obj = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(ot))
                    assert nt - ot < 120
            # 时间范围校验
            elif cdata[-1] == '_t_range':
                if cdata[0] == 'null':
                    cdata[0] = time.strftime('%Y-%m-%d 00:00:00', time.localtime())
                    t_start = time.mktime(time.strptime(cdata[0], '%Y-%m-%d %H:%M:%S'))
                else:
                    t_start = time.mktime(time.strptime(cdata[0], '%Y-%m-%d %H:%M:%S'))
                if cdata[1] == 'null':
                    t_end = time.time()
                    cdata[2][1] = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())
                else:
                    t_end = time.mktime(time.strptime(cdata[1], '%Y-%m-%d %H:%M:%S'))
                t = time.mktime(time.strptime(elem.text, '%Y-%m-%d %H:%M:%S'))
                a_obj = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(t))
                assert t_start < t < t_end
            # 断言跳出
            elif cdata[-1] == '_break':
                try:
                    elem = driver.find_element_by_xpath(xpath)
                    a_obj = elem.text
                    assert elem.text in cdata
                    return xpath, cdata, 'break', a_obj
                except:
                    pass
            # 普通的标签内容校验
            else:
                assert_object = elem.text.split('：')[-1]
                assert_object1 = elem.get_attribute('value')
                a_obj = [assert_object, assert_object1]
                assert ((assert_object in cdata) or (assert_object1 in cdata))

        # 获取信息
        elif operate == 'getinfo':
            if cdata[-1] == '_count':
                info = len(driver.find_elements_by_xpath(xpath))
                info_list.append(info)
            elif cdata[-1] == '_num':
                tmp_text = driver.find_element_by_xpath(xpath).text
                tmp_num = int(re.sub("\D", "", tmp_text))
                info_list.append(tmp_num)
            else:
                info = driver.find_element_by_xpath(xpath).text
                info_list.append(info)

        # 第三方插件时数据处理
        elif operate == 'tri':
            if cdata[-1] == '_wait':
                time.sleep(int(cdata[0]))
            elif cdata[-1] == '_upload':
                path = os.getcwd()
                os.system('func/upload.exe' + ' ' + path + '/video/' + cdata[0])
            elif cdata[-1] == '_loop':
                for i in range(int(cdata[-2])-1):
                    start = '%s' % (cdata[-3].split(':')[0])
                    stop = '%s' % (cdata[-3].split(':')[1])
                    if start == '':
                        data_range = data[:int(stop)]
                    elif stop == '':
                        data_range = data[int(start):]
                    else:
                        data_range = data[int(start):int(stop)]
                    for elem in data_range:
                        xp = elem[0]
                        op = elem[1]
                        cd = elem[2].replace('[', '').replace(']', '').replace('\'', ''). \
                            replace(', ', ',').strip().split(';')
                        res = op_method(xp, op, cd, info_list, data, driver=driver)
                        if res[2] == 'break':
                            break
                        time.sleep(0.3)

        return xpath, cdata, '', a_obj

    except:
        return xpath, cdata, 'error', a_obj
