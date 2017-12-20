//动态生成表格行函数
function tr_re(dict_data, tb){
    for(key in dict_data){
        tb = tb + "<tr class='dam' id='0'>";
        tb += "<td class='dam'>" + key + "</td>";
        for (var i=0;i<5;i++){tb += "<td></td>";};
        if (key == 'page'){
        tb += "<td class='dam' id='page'>" + dict_data[key][1] + "</td>";}
        else if (key == 'step'){tb += "<td class='dam'></td>";}
        else{tb += "<td class='dam'>" + dict_data[key][1] + "</td>";};
        if (key == 'step'){
            tb += "<td align='center'><button class='btn btn-info' id='add'>新增</button> <button class='btn btn-warning' id='del'>删除</button></td>";
            }
        else
            {
            tb += "<td align='center'><button class='btn btn-info' disabled='disabled'>新增</button> <button class='btn btn-warning' id='del'>删除</button></td>";
            };
        tb += "</tr>";}
    if ('step' in dict_data){
    var step_set = dict_data['step'][2]['elem']
    for(var i=0;i<step_set.length;i++){
        tb = tb + "<tr class='dam' id='1'>";
        tb += "<td></td><td>elem</td>";
        tb += "<td class='dam'>" + step_set[i][0]['module'] + "</td>";
        tb += "<td class='dam'>" + step_set[i][0]['type'] + "</td>";
        tb += "<td class='dam'>" + step_set[i][0]['locate'] + "</td>";
        tb += "<td class='dam'>" + step_set[i][0]['method'] + "</td>";
        tb += "<td class='dam'>" + step_set[i][1] + "</td>";
        tb += "<td align='center'><button class='btn btn-info' id='add'>新增</button> <button class='btn btn-warning' id='del'>删除</button></td>";
        tb += "</tr>";};}
    return tb
    };

//页面加载时运行
$(function(){
    //新增抽象页面
    $('button#new_model').click(function(){
        var org_val = $('input#model_name').val()
        $.post('/xml_add', {'para1': org_val, 'para2': 'model'}, function(data){
            if (data.code!=200){
                alert(data.msg)};
        });
    });

    //选择页面抽象对象，动态生成表格
    $('select#model').change(function(){
        if ($(this).val() != 'none'){
            $.post('/model', {
                model: $(this).val(),
            }, function(data){
                $('div#show').show();
                var tb = '';
                tb = tr_re(data.model_para, tb)
                $('tr.dam').empty();
                $('tr#model_params').after(tb);
            });
        }
        else{$('div#show').hide();};
    });

    //双击表格元素修改内容
    $('table').on('dblclick', 'td.dam', function(){
        var e_index = $(this).parent().find('td').index(this)
        if ((e_index == parseInt($(this).parent().attr('id')) || e_index == 6 || e_index == 4) &&
        $(this).parent().find('td').eq(0).text() != 'step'){
            ori_data = $(this).text()
            $(this).html("<input class='dam'/>" + "<label style='font-weight:normal'>" + ori_data + "</label>");
            $(this).attr('id', 'click');
            $(this).find('input').val(ori_data)
            $(this).find('input').focus()
        }
        else if (e_index == 2 || e_index == 3 || e_index == 5){
            var org_val = $(this).text()
            var obj = $(this)
            $.post('/get_xml', {'para1': $('td#page').text(), 'para2': e_index, 'para3': obj.prev().text()}, function(data){
                var tmp_html = '<select class="dam" id="module">'
                for (var i=0;i<data.module.length;i++){
                    if (data.module[i] == org_val){tmp_html = tmp_html + '<option class="dam" selected="selected" value="' + data.module[i] + '">' +
                    data.module[i] + '</option>'
                    }
                    else{
                    tmp_html = tmp_html + '<option class="dam" value="' + data.module[i] + '">' +
                    data.module[i] + '</option>';};
                };
                tmp_html = tmp_html + '</select>' + "<label style='font-weight:normal'>" + org_val + "</label>";
                obj.html(tmp_html);
                obj.attr('id', 'click');
                obj.find('select').focus()
            ;});
        }
        else {
            return;
        };
    });

    //焦点丢失时修改成功，只是前端缓存
    $('table').on('blur', 'td#click', function(){
        var ori_data = $('td#click label').text().split('>')[0]
        var md_data = $('td#click input').val();
        if (! md_data){md_data = $('td#click select').val();};
        if ($(this).parent().attr('class') != 'dam new danger'){
            if (md_data != ori_data){$(this).attr('class', 'dam danger');};
        };
        if ($('td#click').parent().find('td').index($('td#click')) == 0){
            if (md_data != ori_data && ori_data != ''){md_data = ori_data + '>' + md_data;};
        };
        $('td#click').empty();
        $('td#click').html(md_data);
        $(this).attr('id', '');
        if ($(this).parent().find('td').eq(0).text() == 'step'){
            $(this).parent().find('button#add').removeAttr("disabled")
        };
    });

    //新增根行
    $('table').on('click', 'button#g', function(){
        var elem = $(this).parent().parent('tr');
        var new_tr = "<tr class='dam new' id='0'>";
        new_tr += "<td class='dam'></td>"
        for (var i=0;i<5;i++){new_tr += "<td></td>";};
        new_tr += "<td class='dam'></td>"
        elem.after(new_tr + "<td align='center'><button class='btn btn-info' id='add' disabled='disabled'>新增</button> <button class='btn btn-warning' id='del'>删除</button></td></tr>");
        elem.next().attr('class', 'dam new danger');
    });

    //新增加表格一行
    $('table').on('click', 'button#add', function(){
        var elem = $(this).parent().parent('tr');
        var new_tr = "<tr class='dam new' id='1'><td></td><td class='dam'>elem</td>";
        for (var i=0;i<5;i++){new_tr += "<td class='dam'></td>";};
        elem.after(new_tr + "<td align='center'><button class='btn btn-info' id='add'>新增</button> <button class='btn btn-warning' id='del'>删除</button></td></tr>");
        elem.next().attr('class', 'dam new danger');
    });

    //删除表格一行
    $('table').on('click', 'button#del', function(){
        var elem = $(this).parent().parent('tr');
        if (elem.attr('class') == 'dam new danger')
            {elem.remove();}
        else
            {
            elem.find('button#add').attr('disabled', 'disabled')
            elem.before("<div class='del' style='position:absolute;width:85%;padding-top: 15px;'><div style='outline:#C00 solid 0.5px;width:96%;'></div></div>");
            var fir_id = parseInt(elem.attr('id'));
            for (var i=0;i<100;i++){
                elem = elem.next('tr');
                if (parseInt(elem.attr('id')) <= fir_id){break;};
                elem.before("<div class='delnext' style='position:absolute;width:100%;padding-top: 15px;'><div style='outline:#C00 solid 0.5px;width:96%;'></div></div>");
                elem.find('button').attr('disabled', 'disabled')
                };
            };
        $(this).text('恢复');
        $(this).attr('id', 'rec');
    });

    //非新增的，恢复删除的一行
    $('table').on('click', 'button#rec', function(){
        var elem = $(this).parent().parent('tr');
        elem.prev('div').remove();
        elem.find('button#add').removeAttr('disabled')
        $(this).text('删除');
        $(this).attr('id', 'del');
        var fir_id = parseInt(elem.attr('id'));
        for (var i=0;i<100;i++){
            elem = elem.next().next('tr');
            if (parseInt(elem.attr('id')) <= fir_id){break;};
            elem.prev('div').remove();
            elem.find('button').removeAttr('disabled')
            };
    });

    //提交修改到后台
    $('button#zmd').click(function(){
        if (($('td.danger').length > 0) || ($('tr.danger').length > 0) || ($('div.del').length > 0)){
            var modify = new Array();
            var add_row = new Array();
            var del_row = new Array();
            for (var j=0;j<$('td.danger').length;j++){
                var obj_em = $('td.danger').eq(j)
                var obj_par = obj_em.parent()
                if (obj_par.find('td').eq(0).text() != ''){
                    if (obj_par.find('td').index(obj_em) == 0){
                        var elem_data = {'tag': obj_em.text().split('>')[1]}
                        modify.push({'position': obj_em.text().split('>')[0],'data': elem_data});
                    }
                    else{
                        var elem_data = {'text': obj_em.text()}
                        modify.push({'position': obj_par.find('td').eq(0).text(),'data': elem_data});}
                }
                else{
                    var position = $('table').find('tr#1').index(obj_par)
                    var elem_data = {}
                    if (obj_par.find('td').index(obj_em) == 2){elem_data['attr'] = {'module': obj_em.text()};}
                    else if (obj_par.find('td').index(obj_em) == 3){elem_data['attr'] = {'type': obj_em.text()};}
                    else if (obj_par.find('td').index(obj_em) == 4){elem_data['attr'] = {'locate': obj_em.text()};}
                    else if (obj_par.find('td').index(obj_em) == 5){elem_data['attr'] = {'method': obj_em.text()};}
                    else if (obj_par.find('td').index(obj_em) == 6){elem_data['text'] = obj_em.text()};
                    modify.push({'position': position,'data': elem_data});};
            };
            for (var j=0;j<$('tr.danger').length;j++){
                var obj_em = $('tr.danger').eq(j)
                if (obj_em.find('td').eq(0).text() != ''){
                    elem_data = {'text': obj_em.find('td').eq(6).text(),'tag': obj_em.find('td').eq(0).text()}
                    add_row.push({'position': '/','data': elem_data});
                }
                else{
                    var position = $('table').find('tr#1').index(obj_em)
                    elem_attr = {'module': obj_em.find('td').eq(2).text(),
                                 'type': obj_em.find('td').eq(3).text(),
                                 'locate': obj_em.find('td').eq(4).text(),
                                 'method': obj_em.find('td').eq(5).text()
                                }
                    elem_data = {'text': obj_em.find('td').eq(6).text(),'attr': elem_attr}
                    add_row.push({'position': position,'data': elem_data});
                };


            };
            for (var j=0;j<$('div.del').length;j++){
                var obj_em = $('div.del').eq(j).next();
                if (obj_em.find('td').eq(0).text() != ''){
                    var position = obj_em.find('td').eq(0).text()
                    del_row.push({'position': position});
                }
                else{
                    var position = $('table').find('tr#1').index(obj_em)
                    del_row.push({'position': position});
                };
            };
            datas = {'model': $('select#model').val(),
                    'modify': JSON.stringify(modify),
                    'add_row': JSON.stringify(add_row),
                    'del_row': JSON.stringify(del_row)}
            $.post('/modify_model', datas, function(data){
                if (data.code == 200){
                    $('td.danger').removeClass('danger');
                    $('tr.danger td').eq(parseInt($('tr.danger').attr('id'))).text($('tr.danger td').eq(parseInt($('tr.danger').attr('id'))).text().split('>').pop())
                    $('tr.danger').removeClass('danger');
                    $('div.del').next().remove();
                    $('div.del').remove();
                    $('div.delnext').next().remove();
                    $('div.delnext').remove();
                    }
                else
                    {alert('修改失败')};
            });
        };
    });
});