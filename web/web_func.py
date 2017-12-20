import xml.etree.ElementTree as ET
import json


def xml_parse(father, page_tree):
    for child in father:
        try:
            xpath = child.attrib['xpath']
        except:
            xpath = ''
        if child.text is None or '\n' in child.text:
            tag_text = ''
        else:
            tag_text = child.text
        page_tree[child.tag] = [xpath, tag_text, {}]
        xml_parse(child, page_tree[child.tag][2])


def write_xml(xml_file, data):
    file_name = '../page/' + xml_file + '.xml'
    tree = ET.parse(file_name)
    root = tree.getroot()
    add_row = json.loads(data[0])
    for elem in add_row:
        elem['position'].reverse()
        location = '.'
        for i in elem['position'][:-1]:
            location = location + '/' + i.split('>')[0]
        fa = root.find(location)
        ET.SubElement(fa, elem['data']['tag'])
        child = fa.find(elem['data']['tag'])
        child.text = elem['data']['text']
        child.set('xpath', elem['data']['xpath'])
    del_row = json.loads(data[1])
    del_row.reverse()
    for elem in del_row:
        elem['position'].reverse()
        location = '.'
        for i in elem['position'][:-1]:
            location = location + '/' + i.split('>')[0]
        fa = root.find(location)
        child = root.find(location + '/' + elem['position'][-1])
        fa.remove(child)
    modify = json.loads(data[2])
    modify.reverse()
    for elem in modify:
        elem['position'].reverse()
        location = '.'
        for i in elem['position']:
            location = location + '/' + i.split('>')[0]
        fa = root.find(location)
        if 'text' in elem['data']:
            fa.text = elem['data']['text']
        if 'xpath' in elem['data']:
            fa.set('xpath', elem['data']['xpath'])
        if '>' in elem['position'][-1]:
            fa.tag = elem['position'][-1].split('>')[1]
    tree.write(file_name)
