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
                    html = html + '<tr style="height:200px" class="dam"><td  style="width:10%">' + (i+1) + '</td>'
                    for (j=0;j<6;j++){
                        if (j==1 || j==2){
                            html = html + '<td style="width:20%;overflow: hidden" class="dam">' + data.cases[i][j] + '</td>'
                        }
                        else{html = html + '<td style="width:10%;margin: 80px 0px;" class="dam">' + data.cases[i][j] + '</td>'}; 
                    };
                    html = html + '<td  style="width:10%" align="center"><button class="btn btn-default" id="g" style="padding:0px 8px;margin: 80px 0px;"><font size="3">x</font> </button></td></tr>';
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
        if (e_index != 1){
            ori_data = $(this).text()
            $(this).empty()
            $(this).html("<textarea class='dam' style='width:100%;height:200px'>");
            $(this).attr('id', 'click');
            $(this).find('textarea').val(ori_data)
            $(this).find('textarea').focus()
        }
        else{
            var org_val = $(this).text()
            var obj = $(this)
            $.post('/project_api', {'get': 'api', 'project_name': $('select#project').val(), 'type': 'list'}, function(data){
                var tmp_html = '<select style="width:100%" class="dam" id="interf">'
                for (var i=0;i<data.api_list.length;i++){
                    if (data.api_list[i] == org_val){tmp_html = tmp_html + '<option class="dam" selected="selected" value="' + data.api_list[i] + '">' +
                    data.api_list[i] + '</option>'
                    }
                    else{
                    tmp_html = tmp_html + '<option class="dam" value="' + data.api_list[i] + '">' +
                    data.api_list[i] + '</option>';};
                };
                tmp_html = tmp_html + '</select>';
                obj.html(tmp_html);
                obj.attr('id', 'click');
                obj.find('select').focus()
            ;});
        };
    });

    //焦点丢失时修改成功，只是前端缓存
    $('table').on('blur', 'td#click', function(){
        var e_index = $(this).parent().find('td').index(this)
        var obj = $(this)
        if (e_index == 1){
          var value = obj.find('select').val()  
        }
        else{
            var value = obj.find('textarea').val()}
        obj.empty()
        obj.text(value)
        obj.attr('id', '');
    });
});