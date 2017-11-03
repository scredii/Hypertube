var page = 1;
var movies = [];
var series = [];

// Il faut ajouter le [A VU] sur cette page OU dans l'api et en le refoutant donc ici ^^
// Si serie => /series/:IMDB/:SEASON/:EP (id_API pas id_IMDB! => ici api est le meme qu'imdb mais sans le tt)
// Si film => /movie/:YTS (id_API pas id_IMDB!)

function getData(){
  $.getJSON('/api/'+page, (data)=>{
    movies = data.movies;
    series = data.series;

		var full_array = [];
		full_array = full_array.concat(movies, series);
		full_array.sort((a, b)=> {return b.torrent[0].seeders - a.torrent[0].seeders});
		// console.log(full_array)
    full_array.forEach((elem)=>{
			if (elem.categorie === "Serie"){
      $('.movie-list').append('<div class="col-lg-5 box">\
      <div class="filterDiv '+elem.imdb.genre +' '+ elem.categorie +'">\
    			<div class="thumbnail'+(user.history.indexOf(elem.id_API + elem.season + elem.episode) != -1 ? 'seen' : '')+'" >\
              <img src="'+elem.imdb.image+'" class="img-rounded">\
                  <div class="caption">\
                      <h4>'+elem.imdb.title+'</h4>\
                          '+ (elem.season != 0 ? '<small>Season ' + elem.season + ' - Episode ' + elem.episode + '</small><br />' : '') +
                              (elem.imdb.rating != null ? '<button class="btn btn-default">'+elem.imdb.rating+'/10</button>&nbsp;&nbsp;' : '<button class="btn btn-default">Unrated</button>&nbsp;&nbsp;') +
    													(elem.imdb.year != null ? '<button class="btn btn-default">'+elem.imdb.year+'</button>' : '') +
    													'<a href="/series/'+elem.id_API+'/'+elem.season+'/'+elem.episode+'?hash='+elem.torrent[0].hash+'" id="watch" class="btn btn-success pull-right watchBtn"><i class="fa fa-youtube-play" aria-hidden="true">'+(elem.torrent[0].quality === "SD" ? '</i> SD<br/><small><i>(seed: '+ elem.torrent[0].seeders+')</i></small></a>' : '</i> SD<br/><small><i>(seed: '+ elem.torrent[0].seeders+')</i></small></a>') +
                              (elem.torrent[1] && elem.torrent[1].quality === "HD" ? '<a href="/series/'+elem.id_API+'/'+elem.season+'/'+elem.episode+'?hash='+elem.torrent[1].hash+'" id="watch"  class="btn btn-success pull-right watchBtn"><i class="fa fa-youtube-play" aria-hidden="true"></i> HD<br/><small><i>(seed: '+ elem.torrent[1].seeders+')</i></small></a>': '')+
                                '</div>\
                              </div>\
										        </div>');
    }
		if (elem.categorie === "Movie"){
      $('.movie-list').append('<div class="col-lg-5 box">\
      <div class="filterDiv '+elem.imdb.genre+' '+ elem.categorie+'">\
    								<div class="thumbnail '+(user.history.indexOf(elem.id_IMDB) != -1 ? 'seen' : '')+'">\
	                                  <img src="'+elem.imdb.image+'" class="img-rounded">\
	                                  <div class="caption">\
	                                    <h4>'+elem.imdb.title+'</h4>\
	                                    ' +
	                                    (elem.imdb.rating != null ? '<button class="btn btn-default">'+elem.imdb.rating+'/10</button>&nbsp;&nbsp;' : '<button class="btn btn-default">Unrated</button>&nbsp;&nbsp;') +
								(elem.imdb.year != null ? '<button class="btn btn-default">'+elem.imdb.year+'</button>' : '') +
    							'<a href="/movies/'+elem.id_API+'?hash='+elem.torrent[0].hash+'" id="watch" class="btn btn-success pull-right watchBtn"><i class="fa fa-youtube-play" aria-hidden="true">'+
	    							(elem.torrent[0].quality === "N/A" ?
	    									'</i> Watch<br/><small><i>(seed: '+ elem.torrent[0].seeders+')</i></small></a>' 
	    									: '</i> '+ elem.torrent[0].quality +'<br/><small><i>(seed: '+ elem.torrent[0].seeders+')</i></small></a>') +
									(elem.torrent[1] && elem.torrent[1].quality !== "N/A" && elem.torrent[1].quality !== elem.torrent[0].quality ? 
											'<a href="/movies/'+elem.id_API+'?hash='+elem.torrent[1].hash+'" id="watch"  class="btn btn-success pull-right watchBtn"><i class="fa fa-youtube-play" aria-hidden="true"></i> '+ elem.torrent[1].quality +'<br/><small><i>(seed: '+ elem.torrent[1].seeders+')</i></small></a>'
											: '') +
                                '</div>\
                                      </div>\
																</div>');
		}
 });
 filterSelection("all");
  });
  page++;
};

$(document).ready(()=>{
  getData();


});

$(window).scroll(()=>{
  if ($(window).scrollTop() >= $(document).height() - $(window).height() - 10) {
      getData();
   }
});

$('.jumbotron').on('click', '.watchBtn', ()=>{
  $('#loadModal').modal('show');
});

// FOR CLICK IN TEXTBOX SEARCH BAR

$(document).ready(function(){
  $('#query').keypress(function(e){
    if(e.keyCode==13)
    $('.btn-default').click();
  });
});