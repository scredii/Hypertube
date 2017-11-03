// FILTER \\
function filterSelection(c) {
  var x, i;
  x = document.getElementsByClassName("filterDiv");
  if (c == "all") c = "";
  // Add the "show" class (display:block) to the filtered elements, and remove the "show" class from the elements that are not selected
  for (i = 0; i < x.length; i++) {
    w3RemoveClass(x[i], "show");
    if (x[i].className.indexOf(c) > -1) w3AddClass(x[i], "show");
  }
}

// Show filtered elements
function w3AddClass(element, name) {
  var i, arr1, arr2;
  arr1 = element.className.split(" ");
  arr2 = name.split(" ");
  for (i = 0; i < arr2.length; i++) {
    if (arr1.indexOf(arr2[i]) == -1) {
      element.className += " " + arr2[i];
    }
  }
}

// Hide elements that are not selected
function w3RemoveClass(element, name) {
  var i, arr1, arr2;
  arr1 = element.className.split(" ");
  arr2 = name.split(" ");
  for (i = 0; i < arr2.length; i++) {
    while (arr1.indexOf(arr2[i]) > -1) {
      arr1.splice(arr1.indexOf(arr2[i]), 1);
    }
  }
  element.className = arr1.join(" ");
}


// SEARCH QUERY \\

function getData_query(query){
  $.getJSON('/api/search/'+query, (data)=>{
    movies = data.movies;
    series = data.series;
    // console.log(data);
    var full_array = [];
    if (series != null && movies != null)
    	full_array = full_array.concat(movies, series);
    else if (series != null )
		  full_array = series;
	  else if (movies != null )
      	full_array = movies;
	full_array.sort((a, b)=> {return b.torrent[0].seeders - a.torrent[0].seeders});
    // console.log(full_array)
    $('.box').hide();
    full_array.forEach((elem)=>{
			if (elem.categorie === "Serie"){
      $('.movie-list').append('<div class="col-lg-5 box">\
      <div class="filterDiv '+elem.imdb.genre+'">\
    			<div class="thumbnail'+(user.history.indexOf(elem.id_API + elem.season + elem.episode) != -1 ? 'seen' : '')+'" >\
              <img src="'+elem.imdb.image+'" class="img-rounded">\
                  <div class="caption">\
                      <h4>'+elem.imdb.title+'</h4>\
                          '+ (elem.season != 0 ? '<small>Season ' + elem.season + ' - Episode ' + elem.episode + '</small><br />' : '') +
                              (elem.imdb.rating != null ? '<button class="btn btn-default">'+elem.imdb.rating+'/10</button>&nbsp;&nbsp;' : '<button class="btn btn-default">Unrated</button>&nbsp;&nbsp;') +
    													(elem.imdb.year != null ? '<button class="btn btn-default">'+elem.imdb.year+'</button>' : '') +
    													'<a href="/series/'+elem.id_API+'/'+elem.season+'/'+elem.episode+'?hash='+elem.torrent[0].hash+'" class="btn btn-success pull-right watchBtn"><i class="fa fa-youtube-play" aria-hidden="true">'+(elem.torrent[0].quality === "SD" ? '</i>SD</a>' : '</i>SD</a>') +
                              (elem.torrent[1] && elem.torrent[1].quality === "HD" ? '<a href="/series/'+elem.id_API+'/'+elem.season+'/'+elem.episode+'?hash='+elem.torrent[1].hash+'" class="btn btn-success pull-right watchBtn"><i class="fa fa-youtube-play" aria-hidden="true"></i>HD</a>': '')+
                                '</div>\
                              </div>\
										        </div>');
    }
		if (elem.categorie === "Movie"){
      $('.movie-list').append('<div class="col-lg-5 box">\
      <div class="filterDiv '+elem.imdb.genre+'">\
    								<div class="thumbnail '+(user.history.indexOf(elem.id_IMDB) != -1 ? 'seen' : '')+'">\
	                                  <img src="'+elem.imdb.image+'" class="img-rounded">\
	                                  <div class="caption">\
	                                    <h4>'+elem.imdb.title+'</h4>\
	                                    ' +
	                                    (elem.imdb.rating != null ? '<button class="btn btn-default">'+elem.imdb.rating+'/10</button>&nbsp;&nbsp;' : '<button class="btn btn-default">Unrated</button>&nbsp;&nbsp;') +
																			(elem.imdb.year != null ? '<button class="btn btn-default">'+elem.imdb.year+'</button>' : '') +
																			('<a href="/movies/'+elem.id_API+'" class="btn btn-success pull-right watchBtn"><i class="fa fa-youtube-play" aria-hidden="true"></i> Watch </a>') +
                                      '</div>\
                                      </div>\
																</div>');
		}
 });
 filterSelection("all");
  });
  page++;
};

// $(document).ready(()=>{
//   getData_query(query);


// });

// $(window).scroll(()=>{
//   if ($(window).scrollTop() >= $(document).height() - $(window).height() - 10) {
//     getData_query(query);
//    }
// });
