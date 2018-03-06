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
                            if (data.cases[i][j]==''){
                                var tmp = ''
                            }
                            else{
                              var tmp = JSON.stringify(JSON.parse(data.cases[i][j]),null,4)
                            };
                            html = html + '<td style="width:20%;overflow: hidden" class="dam"><textarea class="dam" style="width:100%;height:200px">' + tmp + '</textarea></td>';
                        }
                        else{html = html + '<td style="width:10%;margin: 80px 0px;overflow: hidden" class="dam">' + data.cases[i][j] + '</td>'}; 
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
        if (e_index != 1 && e_index != 2 && e_index != 3){
            ori_data = $(this).text()
            $(this).empty()
            $(this).html("<textarea class='dam' style='width:100%;height:200px'>");
            $(this).attr('id', 'click');
            $(this).find('textarea').val(ori_data)
            $(this).find('textarea').focus()
        }
        else if(e_index == 1){
            var org_val = $(this).text()
            var obj = $(this)
            $.post('/project_api', {'get': 'api', 'project_name': $('select#project').val(), 'type': 'list'}, function(data){
                var tmp_html = '<select style="width:100%" class="dam" id="api_name">'
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
    
    //删除接口
    $('table').on('click', 'button#g', function(){
        var tb = $(this).parents('table')
        $(this).parents('tr').remove();
        var trs = tb.find('tr.dam');
        for (i=0;i<trs.length;i++){
            trs.eq(i).find('td').eq(0).text(i+1)
        }
    });
    
    //新增接口
    $('table').on('click', 'button#n', function(){
        var trs = $(this).parents('table').find('tr')
        var html = '<tr style="height:200px" class="dam"><td  style="width:10%">'+trs.length+'</td>'
        for (i=0;i<6;i++){
            if (i==1 || i==2){html += '<td style="width:20%;overflow: hidden" class="dam"><textarea class="dam" style="width:100%;height:200px"></textarea></td>'}
            else{html += '<td style="width:10%;overflow: hidden" class="dam"></td>'}
        };
        html += '<td  style="width:10%" align="center"><button class="btn btn-default" id="g" style="padding:0px 8px;margin: 80px 0px;"><font size="3">x</font> </button></td></tr>';
        trs.last().after(html);
    });
    
    //接口名选择时，动态加载可选参数和可检验参数
    $('table').on('change', 'select#api_name', function(){
        var td1 = $(this).parents('tr').find('td').eq(2).find('textarea')
        var td2 = $(this).parents('tr').find('td').eq(3).find('textarea')
        $.post('/project_api', {'api_name': $(this).val(), 'project_name': $('select#project').val(), 'get': 'api_data'}, function(data){
            td1.val(JSON.stringify(data.data, null, 4));
            td2.val(JSON.stringify(data.assert_data, null, 4));
        });
    });
    
    //新增场景
    $('button#new_scene').on('click', function(){
        if ($('select#project').val() == 'none'){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text("请选择要保存到的项目！");
            $("button#send_alert").trigger("click");
            return
        };
        if ($('input#scene_name').val() == ''){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text("场景名不能为空！");
            $("button#send_alert").trigger("click");
            return
        };
        $.post('/interf_scene', {'type': 'new', 'name': $('input#scene_name').val(), 'project': $('select#project').val()}, function(data){
            if (data.code==200){
                $('div#sence_data').hide()
                $('div#sence_data').find('tr.dam').remove()
                $('div#sence_data').show()
                $("h4#myModalLabel").text("提示");
                $("div.modal-body").text("场景《"+$('input#scene_name').val()+"》新建成功，请补充用例！" );
                $("button#send_alert").trigger("click");
                if ($('select#project').val() != 'none'){
                    $.post('/interf_scene', {
                        project: $('select#project').val(),
                        type: 'get_scene_list'
                    }, function(data){
                        var select = $('select#scene');
                        select.empty()
                        var html = '<option value="none">请选择场景</option>'
                        for (i=0;i<data.scene.length;i++){
                            if (data.scene[i] == $('input#scene_name').val()){
                                html = html + '<option selected="selected" value="' + data.scene[i] + '">' + data.scene[i] + '</option>';
                            }
                            else{html = html + '<option value="' + data.scene[i] + '">' + data.scene[i] + '</option>';};   
                        };
                        select.html(html)
                        $('input#scene_name').val('')
                    });
                };
            }
            else
            {
                $("h4#myModalLabel").text("错误");
                $("div.modal-body").text("场景名重复！");
                $("button#send_alert").trigger("click");
            };
        });
        
    });
    
    //修改场景
    $('button#zmd').on('click', function(){
        var trs = $('div#sence_data').find('tr.dam');
        var data = [];
        var case_data = {};
        for (i=0;i<trs.length;i++){
            var tds = trs.eq(i).find('td.dam');
            var case_ = []
            var key = ''
            for (j=0;j<tds.length;j++){
                if (j==0){
                    case_[j] = tds.eq(j).text().replace(/\n/g, '').replace(/ /g, '');
                    key = case_[j] 
                }
                else if (j==1 || j==2){
                    case_[j] = tds.eq(j).find('textarea').val().replace(/\n/g, '').replace(/ /g, '');
                }
                else{
                    case_[j] = tds.eq(j).text().replace(/\n/g, '').replace(/ /g, '');
                };
            };
            case_data[key] = case_;
            data[i] = key;
        };
        $.post('/interf_scene', {'type': 'modify', 'data': JSON.stringify(data), 'case_data': JSON.stringify(case_data), 'project': $('select#project').val(), 'scene': $('select#scene').val()}, function(data){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text(data.message);
            $("button#send_alert").trigger("click");
        });
    });
});