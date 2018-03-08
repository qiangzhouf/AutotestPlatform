$(function(){
    //日志信息获取
    $('a').on('click',function(data){
        var logfile = $(this).attr('id');
        var id = $(this).attr('data-target').replace('#', '');
        if ($('tr#'+id).find('textarea').val()==''){
            $.post('/interf_log', {'logfile': logfile}, function(data){
                $('tr#'+id).find('textarea').val(data.log);
            });
        }
    });
    
});