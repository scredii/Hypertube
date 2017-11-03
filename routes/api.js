let slug = require('slug');
let rp = require('request-promise');
var rpc = require('request-promise-cache');

function Torrent() {
	this.quality = 'N/A';
	this.url = '';
	this.magnet = '';
	this.hash = '';
	this.seeders = 0;
	this.leechers = 0;
	this.size_bytes = 0;
}

function IMDB() {
	this.title = 'N/A';
	this.slug = 'n-a';
	this.genre = [];
	this.rating = 0.0;
	this.plot = 'N/A';
	this.image = '';
	this.release_date = 'N/A';
	this.year = 0;
	this.runtime = 'N/A';
	this.director = 'N/A';
	this.writer = 'N/A';
	this.cast = 'N/A';
}

function Movie(title) {
	this.raw_title = title;
	this.raw_slug = 'n-a'
	this.id_IMDB = '';
	this.id_API = 0;
	this.torrent = new Torrent();
	this.imdb = new IMDB();
	this.categorie = "Movie";
}

function Serie(title) {
	this.raw_title = title;
	this.season = 0;
	this.episode = 0;
	this.id_IMDB = '';
	this.id_API = 0;
	this.screenshot = '';
	this.torrent = new Torrent();
	this.imdb = new IMDB();
	this.categorie = "Serie";
}

function imdb_fill(imdb_id, cb) {
	if (imdb_id != undefined) {
		rpc({url: 'http://www.omdbapi.com/?apikey=7c212437&i=' + imdb_id, cacheKey: 'http://www.omdbapi.com/?apikey=7c212437&i=' + imdb_id, cache: 60000 * 60 * 24 * 30 })
		    .then(function (rqst) {
				let iminfo = new IMDB();

				let imdb_info = JSON.parse(rqst.body)
				if (imdb_info != undefined) {
					iminfo.title = imdb_info.Title;
					if (imdb_info.Title != undefined) {
						iminfo.slug = slug(imdb_info.Title + ' (' +imdb_info.Year+')').toLowerCase();
					}
					if (imdb_info.Genre != undefined) {
						iminfo.genre = imdb_info.Genre.split(', ');
					}
					if (imdb_info.imdbRating != undefined) {
						iminfo.rating = parseFloat(imdb_info.imdbRating);
					}
					iminfo.plot = imdb_info.Plot;
					iminfo.image = imdb_info.Poster;
					iminfo.release_date = imdb_info.release_date;
					iminfo.year = imdb_info.Year;
					iminfo.runtime = imdb_info.Runtime;
					iminfo.director = imdb_info.Director;
					iminfo.writer = imdb_info.Writer;
					iminfo.cast = imdb_info.Actors;
				}

				cb(iminfo);

			})
			.catch(function (err) {
				if (err.error) {
					console.log("Calling IMDB API Error :", err.error)
				}
		    });
	} else {
		cb(undefined);
	}

}

//  PLURIEL = API GLOBALE
function movies_fill(yts_movies, cb) {
	var movies = [];
	if (yts_movies.data.movie_count == 0) {
		cb([]);
	} else {
		yts_movies.data.movies.forEach(function(file, i) {
	
			var movie = new Movie(yts_movies.data.movies[i].title);
			movie.raw_slug = yts_movies.data.movies[i].slug;
			movie.id_IMDB = yts_movies.data.movies[i].imdb_code;
			movie.id_API = yts_movies.data.movies[i].id;
			var torrents = [];
			yts_movies.data.movies[i].torrents.forEach(function(trt, j) {
				var torrent = new Torrent();
				torrent.quality = trt.quality;
				torrent.url = trt.url;
				torrent.magnet = 'magnet:?xt=urn:btih:'+ trt.hash +'&dn='+ encodeURI(yts_movies.data.movies[i].title);;
				torrent.hash = trt.hash;
				torrent.seeders = trt.seeds;
				torrent.leechers = trt.peers;
				torrent.size_bytes = trt.size_bytes;
	
				torrents.push(torrent)
			});
	
			imdb_fill(file.imdb_code, function(iminfo) {
				movie.torrent = torrents;
				movie.imdb = iminfo;
				movies.push(movie);
	
				if (i == yts_movies.data.movies.length - 1) {
					cb(movies);
				}
			});
	
	
	
	    });
	}
}

function inObject(imdb, se, ep, index, series)
{
	if (imdb == 'tt') {
		return -1;
	}
	for (var i = 0; i < series.length; i++)
	{
		if ('tt'+series[i].imdb_id == imdb && series[i].season == se && series[i].episode == ep && i != index) {
			return i;
		}
	}
	return -1;
}

function series_fill(eztv_series, cb) {
	var series = [];
	var ezseries = eztv_series.torrents;
	if (eztv_series.torrents_count == 0) {
		cb([]);
	} else {
		ezseries.forEach(function(file, i) {
			
			var serie = new Serie(file.title);
			serie.season = parseInt(file.season);
			serie.episode = parseInt(file.episode);
			serie.id_IMDB =  'tt' + file.imdb_id;
			serie.id_API = file.imdb_id;
	
			var torrent = new Torrent();
			torrent.url = file.torrent_url;
			torrent.magnet = file.magnet_url;
			torrent.hash = file.hash;
			torrent.seeders = file.seeds;
			torrent.leechers = file.peers;
			torrent.size_bytes = parseInt(file.size_bytes);
	
	
			let doublon = inObject('tt' + file.imdb_id, file.season, file.episode, i, ezseries);
			if (doublon != -1) {
				var second_torrent = new Torrent();
				second_torrent.url = ezseries[doublon].torrent_url;
				second_torrent.magnet = ezseries[doublon].magnet_url;
				second_torrent.hash = ezseries[doublon].hash;
				second_torrent.seeders = ezseries[doublon].seeds;
				second_torrent.leechers = ezseries[doublon].peers;
				second_torrent.size_bytes = parseInt(ezseries[doublon].size_bytes);
	
	
				if (torrent.size_bytes > second_torrent.size_bytes) {
					torrent.quality = "HD";
					second_torrent.quality = "SD";
				} else {
					torrent.quality = "SD";
					second_torrent.quality = "HD";
				}
			}
	
			imdb_fill('tt' + file.imdb_id, function(iminfo) {
					if (doublon == -1 && iminfo != undefined && file.imdb_id != "") {
						serie.torrent = [torrent];
						serie.imdb = iminfo;
						series.push(serie);
					} else if (doublon > i && file.imdb_id != "") {
						serie.torrent = [torrent, second_torrent];
						serie.imdb = iminfo;
						series.push(serie);
					}
	
					if (i == ezseries.length - 1) {
						cb(series);
					}
				});
	
	
	
	
	    });
	}
}

app.get('/api/search/:rqst', middleware.loggedIn(), (req, res)=>{
	let yts_api = {uri: 'https://yts.ag/api/v2/list_movies.json?sort_by=like_count&with_rt_ratings=true&query_term=' + req.params.rqst, headers: {'User-Agent': 'Request-Promise'}, json: true };

	rp(yts_api)
    .then(function (yts_movies) {
	    movies_fill(yts_movies, function(movies) {
		    rp({uri: 'http://www.omdbapi.com/?apikey=7c212437&type=series&t=' + req.params.rqst, headers: {'User-Agent': 'Request-Promise'} })
		    .then(function (imdb_code) {
			    if (imdb_code && JSON.parse(imdb_code).imdbID) {
				    let eztv_api = {uri: 'https://eztv.unblocked.pro/api/get-torrents?imdb_id=' + JSON.parse(imdb_code).imdbID.substring(2), headers: {'User-Agent': 'Request-Promise'}, json: true };
				    rp(eztv_api)
					.then(function (eztv_series) {
						series_fill(eztv_series, function(series) {
					        let hypertube_api = {title: 'HyperTube API Search', request: req.params.rqst, version: 1.0, date: Date.now(), status: "ok", status_message: "Query was successful", status_code: 200, movies: movies, series: series};
					        res.setHeader('Content-Type', 'application/json');
							res.send(JSON.stringify(hypertube_api));
						});
					})
					.catch(function (err) {
				        console.log("Calling EZTV API Error :", err)
				    });
				} else {
					let hypertube_api = {title: 'HyperTube API Search', request: req.params.rqst, version: 1.0, date: Date.now(), status: "ok", status_message: "Query was successful", status_code: 200, movies: movies, series: null};
			        res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify(hypertube_api));
				}
		    })
		    .catch(function (err) {
			    if (err.statusCode != 200) {
				    console.log("Attention EZTV est down ! (indépendant de notre volonté) Il nous sort une " + err.statusCode)
				    let hypertube_api = {title: 'HyperTube API', page: req.params.page, version: 1.0, date: Date.now(), status: "ok", status_message: "Query was successful (unless for EZTV which is DOWN: " + err.statusCode+ ")", status_code: 200, movies: movies, series: []};
			        res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify(hypertube_api));
			    } else {
		        	console.log("Calling EZTV Series API Error :", err)
		        }
		    });
		});

    })
    .catch(function (err) {
		if (err && err.statusCode != 200) {
		    console.log("Attention YTS est down ! (indépendant de notre volonté) Il nous sort une " + err.statusCode, "ET", err)
		    let hypertube_api = {title: 'HyperTube API', page: req.params.page, version: 1.0, date: Date.now(), status: "ok", status_message: "Query was successful (unless for YTS which is DOWN: " + err.statusCode+ ")", status_code: 200, movies: [], series: []};
	        res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(hypertube_api));
	    } else {
        	console.log("Calling EZTV Series API Error :", err)
        }
    });

});


app.get('/api/:page', middleware.loggedIn(), (req, res)=>{
	let yts_api = {uri: 'https://yts.ag/api/v2/list_movies.json?sort_by=like_count&with_rt_ratings=true&limit=70&page=' + req.params.page, headers: {'User-Agent': 'Request-Promise'}, json: true };
	let eztv_api = {uri: 'https://eztv.unblocked.pro/api/get-torrents?limit=100&page=' + req.params.page, headers: {'User-Agent': 'Request-Promise'}, json: true };

	rp(yts_api)
    .then(function (yts_movies) {
	    movies_fill(yts_movies, function(movies) {
	        rp(eztv_api)
		    .then(function (eztv_series) {
				series_fill(eztv_series, function(series) {
			        let hypertube_api = {title: 'HyperTube API', page: req.params.page, version: 1.0, date: Date.now(), status: "ok", status_message: "Query was successful", status_code: 200, movies: movies, series: series};
			        res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify(hypertube_api));
				});

		    })
		    .catch(function (err) {
			    if (err.statusCode != 200) {
				    console.log("Attention EZTV est down ! (indépendant de notre volonté) Il nous sort une " + err.statusCode)
				    let hypertube_api = {title: 'HyperTube API', page: req.params.page, version: 1.0, date: Date.now(), status: "ok", status_message: "Query was successful (unless for EZTV which is DOWN: " + err.statusCode+ ")", status_code: 200, movies: movies, series: []};
			        res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify(hypertube_api));
			    } else {
		        	console.log("Calling EZTV Series API Error :", err)
		        }
		    });
		});

    })
    .catch(function (err) {
		if (err.statusCode != 200) {
		    console.log("Attention YTS est down ! (indépendant de notre volonté) Il nous sort une " + err.statusCode)
		    let hypertube_api = {title: 'HyperTube API', page: req.params.page, version: 1.0, date: Date.now(), status: "ok", status_message: "Query was successful (unless for YTS which is DOWN: " + err.statusCode+ ")", status_code: 200, movies: [], series: series};
	        res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(hypertube_api));
	    } else {
        	console.log("Calling EZTV Series API Error :", err)
        }
    });

});

// SINGULAR = SPECIAL

function movie_fill(yts_movie, cb) {
	var torrents = [];

	if (yts_movie && yts_movie.data && yts_movie.data.movie && yts_movie.data.movie.title && yts_movie.data.movie.id != 0 && yts_movie.data.movie.torrents) {
		var movie = new Movie(yts_movie.data.movie.title);
		movie.raw_slug = yts_movie.data.movie.slug;
		movie.id_IMDB = yts_movie.data.movie.imdb_code;
		movie.id_API = yts_movie.data.movie.id;
	
		yts_movie.data.movie.torrents.forEach(function(trt, j) {
			var torrent = new Torrent();
			torrent.quality = trt.quality;
			torrent.url = trt.url;
			torrent.magnet = 'magnet:?xt=urn:btih:'+ trt.hash +'&dn='+ encodeURI(yts_movie.data.movie.title);;
			torrent.hash = trt.hash;
			torrent.seeders = trt.seeds;
			torrent.leechers = trt.peers;
			torrent.size_bytes = trt.size_bytes;

			torrents.push(torrent)
		});

		imdb_fill(yts_movie.data.movie.imdb_code, function(iminfo) {
			movie.torrent = torrents;
			movie.imdb = iminfo;

			cb(movie);
		});
	} else {
		cb(null);
	}
}


app.get('/api/yts/:code', (req, res)=>{
	let yts_api = {uri: 'https://yts.ag/api/v2/movie_details.json?movie_id=' + req.params.code, headers: {'User-Agent': 'Request-Promise'}, json: true };


	rp(yts_api)
    .then(function (yts_movie) {
	    movie_fill(yts_movie, function(movie) {
			    let yts_api = {title: 'HyperTube (YTS) API', version: 1.0, date: Date.now(), status: "ok", status_message: "Query was successful", status_code: 200, movie: movie};
			    res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify(yts_api));
			});
    })
    .catch(function (err) {
        console.log("Calling YTS Movie API Error :", err)
    });

});

function inObject(imdb, se, ep, index, series)
{
	if (imdb == 'tt') {
		return -1;
	}
	for (var i = 0; i < series.length; i++)
	{
		if ('tt'+series[i].imdb_id == imdb && series[i].season == se && series[i].episode == ep && i != index) {
			return i;
		}
	}
	return -1;
}

function serie_episode_fill(eztv_serie, imdb, R_season, R_episode, cb) {
	var torrents = [];

	var ezseries = eztv_serie.torrents;
	if (ezseries && ezseries[0] && ezseries[0].title) {
		var serie = new Serie(ezseries[0].title);
		serie.season = R_season;
		serie.episode = R_episode;
		serie.id_IMDB =  'tt' + imdb;
		serie.id_API = imdb;


		ezseries.forEach(function(file, i) {
			var torrent = new Torrent();
			torrent.url = file.torrent_url;
			torrent.magnet = file.magnet_url;
			torrent.hash = file.hash;
			torrent.seeders = file.seeds;
			torrent.leechers = file.peers;
			torrent.size_bytes = parseInt(file.size_bytes);

			if (parseInt(file.season) == R_season && parseInt(file.episode) == R_episode) {
				torrents.push(torrent);
			}

			if (i == ezseries.length - 1) {
				imdb_fill('tt' + file.imdb_id, function(iminfo) {
					serie.torrent = torrents;
					serie.imdb = iminfo;
					cb(serie);
				});
			}

		});
	} else {
		cb(null);
	}

};

app.get('/api/eztv/:code/:season/:episode', (req, res)=>{
	let eztv_api = {uri: 'https://eztv.unblocked.pro/api/get-torrents?limit=100&imdb_id=' + req.params.code, headers: {'User-Agent': 'Request-Promise'}, json: true };


	rp(eztv_api)
    .then(function (eztv_output) {
	    serie_episode_fill(eztv_output, req.params.code, parseInt(req.params.season),  parseInt(req.params.episode), function(serie) {
		    let eztv_api = {title: 'HyperTube (EZTV) API', version: 1.0, date: Date.now(), status: "ok", status_message: "Query was successful", status_code: 200, serie: serie};
		    res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(eztv_api));
		});
    })
    .catch(function (err) {
        console.log("Calling EZTV Series API Error :", err)
    });

});

module.exports = router;