//页面加载时运行
$(function(){
    //选择项目后，动态加载项目下的所有场景用例
    $('select#project').change(function(){
        if ($(this).val() != 'none'){
            $.post('/interf_scene', {
                project: $(this).val(),
                type: 'get_scene_list'
            }, function(data){
                var select = $('select#scene');
                select.empty()
                var html = '<option value="none">请选择场景</option>'
                for (i=0;i<data.scene.length;i++){
                    html = html + '<option value="' + data.scene[i] + '">' + data.scene[i] + '</option>';   
                };
                select.html(html)
            });
        };
    });
    
    //选择场景后，加载场景参数
    $('select#scene').change(function(){
        if ($(this).val() != 'none'){
            $('div#sence_data').show()
            $.post('/interf_scene', {
                project: $('select#project').val(),
                scene: $(this).val(),
                type: 'get_scene_data'
            }, function(data){
                $('tr.dam').remove()
                var tr = $('tr#case_params')
                var html = ''
                for (i=0;i<data.cases.length;i++){
                    html = html + '<tr class="dam"><td>' + (i+1) + '</td>'
                    for (j=0;j<6;j++){
                        html = html + '<td class="dam">' + data.cases[i][j] + '</td>'; 
                    };
                    html = html + '<td align="center"><button class="btn btn-info" id="g" style="padding:0px 8px"><font size="3">x</font> </button></td></tr>';
                };
                tr.after(html)
            });
        }
        else{
            $('div#sence_data').hide()
        };
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
});