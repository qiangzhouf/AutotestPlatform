import os
import xml.etree.ElementTree as Et
import random
import csv
import sqlite3


# 用例scv化，过程中的输入信息的存放列表
input_list = []
count = None


def mtd(models, task_name):
    """主函数，传入用例模板，得到数据化用例csv文件"""

    # 遍历用例模型，生成csv文件
    global input_list
    if models is not None:
        models = ['login', '1', 'menu', '1'] + models
        print(models)
        s = sqlite3.connect('web/web.db')
        total_num = s.execute('select total_num from tasks where name=(?);', [task_name]).fetchall()[0][0] + 2
        seq = 0
        s.close()

        for i in range(len(models)//2):
            html, step, comp, info, prop = get_xml(models[2*i]+'.xml')
            comp = int(models[2*i+1])
            if models[2*i] == 'login' or models[2*i] == 'menu':
                prop = ''
            else:
                prop = chr(95+i) + '_'
            for j in range(int(comp)):
                input_list = []
                filename, case_name = comp_file(j, info, prop, task_name)
                for elem in step.iter():
                    step_iter(elem, html, filename, case_name, task_name)
                # 更新执行进度
                seq += 1
                s = sqlite3.connect('web/web.db')
                s.execute('update tasks set progress=(?) where name=(?);',
                          [str(round(10/total_num*seq, 2)) + '%', task_name])
                s.commit()
                s.close()
    else:
        models = [name for name in os.listdir('model')]
        for model in models:
            html, step, comp, info, prop = get_xml(model)
            for i in range(int(comp)):
                input_list = []
                filename, case_name = comp_file(i, info, prop, task_name)
                for elem in step.iter():
                    step_iter(elem, html, filename, case_name, task_name)

    # 返回csv用例文件列表
    cases = [names for names in os.listdir('data/%s' % task_name)]
    print(cases)
    cases.remove('login_1.csv')
    cases.remove('menu_1.csv')

    # 更新执行进度（用例集动态生成完成！）
    s = sqlite3.connect('web/web.db')
    casedb = s.execute('select case_name from "%s" where type="0";' % task_name).fetchall()
    for i in casedb:
        step_num = s.execute('select count(case_name) from "%s" where type="1" and case_name="%s";' %
                  (task_name, i[0])).fetchall()[0][0]
        s.execute('update "%s" set step_num="%s" where case_name="%s" and type="0";' % (task_name, step_num, i[0]))
    s.execute('update tasks set progress="10%" where name=(?);', [task_name])
    s.commit()
    s.close()

    return cases


def get_xml(elem):
    """获取解析页面和模板的xml文件"""

    # 用例模型和页面数据xml获取
    model = Et.parse('model/' + elem).getroot()
    page = Et.parse('page/' + model.find('page').text).getroot()

    # 参数解析
    html = page.find('html')
    step = model.find('step')
    comp = model.find('complexity').text
    info = [model.find('page').text, page.find('url').text, elem, page.find('frame').text]
    try:
        prop = model.find('priority').text + '_'
    except:
        prop = ''

    return html, step, comp, info, prop


def step_iter(elem, html, filename, case_name, task_name):
    """转化csv时的单步迭代，遍历模板文件的elem"""

    global input_list

    # step标签本身不参与迭代
    if elem.get('module') is None:
        return

    # 参数解析处理
    # 模块和基础xpath
    try:
        md = html.find(elem.get('module'))
        xp = html.get('xpath') + md.get('xpath')
    except:
        md = None
        xp = None
    # 定位信息
    lc = elem.get('locate')
    for i in lc.split('.'):
        if 'input_list' in i:
            lc = lc.replace(i, str(input_list[int(i.replace('input_list', ''))-1]))
    # 类型
    ty = elem.get('type')
    if ty == '':
        ty_count = 0
    else:
        ty_count = len(ty.split('.'))
    # 参数
    para = elem.text.replace('\n', '').replace('\t', '').strip()
    for i in para.split(';'):
        if 'input_list' in i:
            para = para.replace(i, str(input_list[int(i.replace('input_list', ''))-1]))
    # 方法
    method = elem.get('method')
    # 具体xpath
    xp_list = [xp]
    for num in range(ty_count):
        md = md.find(ty.split('.')[num])
        tmp_xp = md.get('xpath').replace('@@', lc.split('.')[num])
        if '##' in tmp_xp:
            if para.split(';')[num].split(',')[-1] == '_radio':
                sample = random.sample(para.split(';')[num].split(',')[:-1], 1)[0]
                tmp_xp = tmp_xp.replace('##', sample)
                tmp_xp = xp_list[-1] + tmp_xp
                xp_list.append(tmp_xp)
            elif para.split(';')[num].split(',')[-1] == '_multiple':
                if '_video' in para.split(';')[num]:
                    video = [name for name in os.listdir('video/')]
                    sample = random.sample(video, random.randint(1, len(video)))
                else:
                    sample = random.sample(para.split(';')[num].split(',')[:-1],
                                           random.randint(1, len(para.split(';')[num]) - 1))
                tmp_xp_list = []
                for elem in sample:
                    tmp_xp1 = tmp_xp.replace('##', elem)
                    tmp_xp1 = xp_list[-1] + tmp_xp1
                    tmp_xp_list.append(tmp_xp1)
                xp_list.append(tmp_xp_list)
            else:
                sample = para.split(';')[num]
                tmp_xp = tmp_xp.replace('##', sample)
                tmp_xp = xp_list[-1] + tmp_xp
                xp_list.append(tmp_xp)
            input_list.append(sample)
            para = para.replace(para.split(';')[num], sample)
        else:
            tmp_xp = xp_list[-1] + tmp_xp
            xp_list.append(tmp_xp)

    # 单击操作
    if method == 'click':
        if para.split(';')[-1] == '_single':
            write_csv(filename, [xp_list[-1], method, para[:-8]], case_name, task_name)
        else:
            for num in range(len(xp_list)-1):
                if xp_list[num+1] is list:
                    for elem in xp_list[num+1]:
                        write_csv(filename, [elem, method, para], case_name, task_name)
                    write_csv(filename, [xp_list[num], method, para], case_name, task_name)
                else:
                    write_csv(filename, [xp_list[num+1], method, para], case_name, task_name)

    # 输入操作
    elif method == 'input':
        if para.split(';')[-1] == '_radio':
            para = random.sample(para.split(';')[-2].split(','), 1)[0]
        if para == 'null':
            return
        write_csv(filename, [xp_list[-1], method, para], case_name, task_name)
        input_list.append(para)

    # 其他操作
    else:
        write_csv(filename, [xp_list[-1], method, para], case_name, task_name)


def write_csv(filename, data_list, case_name='', task_name=''):
    """写CSV文件"""

    global count

    if ('login' not in case_name) and ('menu' not in case_name) and (count > 0):
        s = sqlite3.connect('web/web.db')
        s.execute("insert into '%s' (case_name,type,ordd,xpath,operate,data,step_flag) values('%s','%s','%s','%s','%s',"
                  "'%s','%s');" % (task_name, case_name, 1, count, str(data_list[0]), str(data_list[1]),
                                   str(data_list[2]), 0))
        s.commit()
        s.close()

    count += 1

    with open(('data/%s/' % task_name) + filename, 'a', newline='') as f:
        csv_w = csv.writer(f, dialect='excel')
        csv_w.writerow(data_list)


def comp_file(i, info, prop, task_name):
    """模板复杂度生成文件命名，和CSV数据头"""

    case_name = str(prop) + info[2].replace('.xml', '') + '_' + str(i+1)
    case_page = info[0].replace('.xml', '')

    if 'login' not in case_name and 'menu' not in case_name:
        s = sqlite3.connect('web/web.db')
        print(task_name)
        s.execute('insert into "%s" (case_name,case_page,flag,type) values("%s","%s","%s","%s");' % (task_name, case_name, case_page, 0, 0))
        s.commit()
        s.close()

    global count
    count = -2

    filename = case_name + '.csv'
    write_csv(filename, data_list=['页面page', '链接url', '用例模板model', '内联框架frame'], task_name=task_name)
    write_csv(filename, info, task_name=task_name)
    write_csv(filename, data_list=['定位元素xpath', '操作方法method', '操作数据data'], task_name=task_name)

    return filename, case_name
