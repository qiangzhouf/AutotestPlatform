$(document).ready(function(){
    //建立websocket链接
    var websocket_url = 'http://' + document.domain + ':' + location.port + '/task_refresh';
    var socket = io.connect(websocket_url);

    //监听推送消息
    socket.on('rec_push',function(data){
        if (data.code == '200'){
            var j_msg = JSON.parse(data.msg)
            var conut = j_msg.length
            for (var j=0;j<conut;j++){
                var array_task = j_msg[j];
                var tr = $('#'+array_task[0]);
                var inp = tr.find('td').eq(10).find('input').eq(0)
                var tds = tr.find("td");
                tds.eq(5).text(array_task[5]);
                if (array_task[5] == '已完成'){
                    inp.attr("disabled", "disabled");
                    inp.attr("value", "已完成");
                }
                var div = tds.eq(6).find("div div");
                div.attr("style", "width:" + array_task[6]);
                div.text(array_task[6]);
                tds.eq(8).text(array_task[8]);
                tds.eq(9).text(array_task[9]);
            }
        }
        else{
            alert('ERROR: ' + 'push server failed');
        }
    });

    //页面关闭时执行，关闭链接
    $(window).on('unload',function(){
        socket.emit('disconnect');
    });
});
