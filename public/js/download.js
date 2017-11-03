var ready = 0;

$(function() {
  var socket = io();
  $(document).ready(()=>{
    socket.emit('subscribe', {user: user, room: room});
  });
  
  socket.on('progress', (status)=>{
    var vid = document.getElementById("video");
    //  console.log("Loading value", status.value)
    if (status.value > 10 && ready === 0) {
      vid.autoplay = true;
      vid.load();
      ready = 1;
      $('#progress').css('display', 'none');
    } 
    else {
      	$('#progressbar').css('width', status.value*10+'%');
      	$("#progressbar").attr({"aria-valuenow" : status.value*10});
    }
  });
});

function getComment(link){
  $.ajax({
    type: 'GET',
    contentType: 'application/json',
    url: 'http://localhost:3030/comment/'+link,
    success: function(data) {
      if (data !== "Error")
      {
        $("#commentSection").html("");
        $("#commentSection").prepend(data);
      }
    }
  });
}

$(document).ready(()=>{
  $('#commentForm').submit((ev)=>{
    ev.preventDefault();
    $.ajax({
      type: 'POST',
      data: JSON.stringify({comment: $("#newComment").val(), imdb: link}),
      contentType: 'application/json',
      url: 'http://localhost:3030/comment',
      success: function(data) {
        if (data !== "Error")
          $("#commentSection").prepend(data);
      }
    });
    $("#newComment").val('');
  });

  getComment(link);
  setInterval(()=>{getComment(link)}, 1000);
});
