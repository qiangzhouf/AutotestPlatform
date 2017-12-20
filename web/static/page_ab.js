//动态生成表格行函数
function tr_re(dict_data, tb, cyc=-1){
    cyc += 1

    for(key in dict_data){
        tb = tb + "<tr class='dam' id='" + cyc +"'>";
        for (var i=0;i<cyc;i++){tb += "<td class='dam'></td>";};
        tb += "<td class='dam'>" + key + "</td>";
        for (var i=0;i<3-cyc;i++){tb += "<td class='dam'></td>";};
        tb += "<td class='dam'>" + dict_data[key][0] + "</td>";
        tb += "<td class='dam'>" + dict_data[key][1] + "</td>";
        tb += "<td align='center'><button class='btn btn-info' id='add'>新增</button> <button class='btn btn-warning' id='del'>删除</button></td>";
        tb += "</tr>";
        if (JSON.stringify(dict_data[key][2]) != "{}"){
            tb = tr_re(dict_data[key][2], tb, cyc);}
        };
    return tb
    };

//页面加载时运行
$(function(){
    //新增抽象页面
    $('button#new_page').click(function(){
        var org_val = $('input#page_name').val()
        $.post('/xml_add', {'para1': org_val,'para2': 'page'}, function(data){
            if (data.code!=200){
                alert(data.msg)};
        });
    });

    //选择页面抽象对象，动态生成表格
    $('select#page').change(function(){
        if ($(this).val() != 'none'){
            $.post('/page_ab', {
                page: $(this).val(),
            }, function(data){
                $('div#show').show();
                var tb = '';
                tb = tr_re(data.page_para, tb)
                $('tr.dam').empty();
                $('tr#page_params').after(tb);
            });
        }
        else{$('div#show').hide();};
    });

    //双击表格元素修改内容
    $('table').on('dblclick', 'td.dam', function(){
        var e_index = $(this).parent().find('td').index(this)
        if (e_index != parseInt($(this).parent().attr('id')) && e_index !=4 && e_index !=5){
            return;};
        $('input.dam').remove();
        $('#click').attr('id', '');
        $(this).html("<input class='dam'>" + $(this).text() +"</input>");
        $(this).attr('id', 'click');
        $('input').focus();
    });

    //焦点丢失时修改成功，只是前端缓存
    $('table').on('blur', 'td#click', function(){
        var or_data = $('td#click').text();
        var md_data = $('td#click input').val();
        if (md_data=='')
            {md_data = or_data;}
        else
            {
            if ($(this).parent().attr('class') != 'dam new danger'){
                if (or_data.split('>')[0] != md_data){
                    $(this).attr('class', 'dam danger');
                    if ($(this).parent().find('td').index(this) !=4 && $(this).parent().find('td').index(this) !=5){
                        md_data = or_data.split('>')[0] + '>' + md_data;};};};
            };
        $('td#click').empty();
        $('td#click').html(md_data);
        $(this).attr('id', '');
    });

    //新增根行
    $('table').on('click', 'button#g', function(){
        var elem = $(this).parent().parent('tr');
        var new_tr = "<tr class='dam new' id='0'>";
        for (var i=0;i<6;i++){new_tr += "<td class='dam'></td>";};
        elem.after(new_tr + "<td align='center'><button class='btn btn-info' id='add'>新增</button> <button class='btn btn-warning' id='del'>删除</button></td></tr>");
        elem.next().attr('class', 'dam new danger');
    });

    //新增加表格一行
    $('table').on('click', 'button#add', function(){
        var elem = $(this).parent().parent('tr');
        var new_id = parseInt(elem.attr('id')) + 1
        var new_tr = "<tr class='dam new' id='" + new_id +"'>";
        for (var i=0;i<6;i++){new_tr += "<td class='dam'></td>";};
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
        elem.find('button').removeAttr('disabled')
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
            var flag = 0
            for (var j=0;j<$('td.danger').length;j++){
                var obj_em = $('td.danger').eq(j)
                var elem_position = new Array();
                var elem_data = {}
                var count = parseInt(obj_em.parent().attr('id')) + 1;
                if (obj_em.parent().find('td').index(obj_em) == 4)
                    {elem_data={'xpath': obj_em.text()};}
                else if (obj_em.parent().find('td').index(obj_em) == 5)
                    {elem_data={'text': obj_em.text()};}
                else if (obj_em.parent().find('td').index(obj_em) == count-1)
                    {elem_data={'tag': obj_em.text()};}
                else
                    {
                    flag = 1;
                    break;
                    }
                for (var i=0;i<count;i++){
                    if (i==0)
                        {var obj = obj_em.parent()}
                    else
                        {var obj = obj_em.parent().prevAll('#'+(count-1-i)).first()};
                    elem_position[i] = obj.find('td').eq(count-i-1).text()
                };
                modify.push({'position': elem_position,'data': elem_data});
            };
            for (var j=0;j<$('tr.danger').length;j++){
                var obj_em = $('tr.danger').eq(j)
                var elem_position = new Array();
                var elem_data = {}
                var count = parseInt(obj_em.attr('id')) + 1;
                if (obj_em.find('td').eq(count-1).text() == '')
                    {flag = 1;
                    break;};
                elem_data={'text': obj_em.find('td').eq(5).text(),
                           'xpath': obj_em.find('td').eq(4).text(),
                           'tag': obj_em.find('td').eq(count-1).text()};
                for (var i=0;i<count;i++){
                    if (i==0)
                        {var obj = obj_em}
                    else
                        {var obj = obj_em.prevAll('#'+(count-1-i)).first()};
                    elem_position[i] = obj.find('td').eq(count-i-1).text()
                };
                add_row.push({'position': elem_position,'data': elem_data});
            };
            for (var j=0;j<$('div.del').length;j++){
                var obj_em = $('div.del').eq(j).next();
                var elem_position = new Array();
                var count = parseInt(obj_em.attr('id')) + 1;
                for (var i=0;i<count;i++){
                    if (i==0)
                        {var obj = obj_em}
                    else
                        {var obj = obj_em.prevAll('#'+(count-1-i)).first()};
                    elem_position[i] = obj.find('td').eq(count-i-1).text();
                };
                del_row.push({'position': elem_position});
            };
            if (flag==1)
                {
                alert('修改失败，不允许修改元素位置，若需要请删除后新增！');
                return;
                };
            datas = {'page': $('select#page').val(),
                    'modify': JSON.stringify(modify),
                    'add_row': JSON.stringify(add_row),
                    'del_row': JSON.stringify(del_row)}
            $.post('/modify_page', datas, function(data){
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