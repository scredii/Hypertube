// SERIES...
router.get('/series/:api/:season/:ep', middleware.loggedIn(), (req, res) => {
	var room = req.params.id + encodeURI(Math.trunc(Math.random() * 10000000));
	var info = request('http://127.0.0.1:3030/api/eztv/' + req.params.api + '/' + req.params.season + '/' + req.params.ep, function(err, response, body) {
		if (!response) {
			console.log("EZTV down erreur", " @video.js:8")
			res.redirect('/404');
		} else {
			body = JSON.parse(body);
		}

		let hash = req.query.hash;
		if (!hash || !body.serie || !body.serie.torrent) {
			res.redirect('/404');
		} else if (!(body.serie.torrent.filter(torrent => torrent.hash == hash).length > 0)) {
			res.redirect('/404');
		} else {
			let seeds = 0;
			let leechs = 0;
			let quality = 'N/A';
			for (var i = 0, len = body.serie.torrent.length; i < len; i++) {
				if (body.serie.torrent[i].hash == hash) {
					seeds = body.serie.torrent[i].seeders;
					leechs = body.serie.torrent[i].leechers;
				}
			}
			var magnet = 'magnet:?xt=urn:btih:' + hash + '&dn=' + encodeURI(body.serie.raw_title);
			var engine = torrentStream(magnet, {
				name: body.serie.imdb.slug,
				path: '/tmp/hypertube-files/' + body.serie.imdb.slug + '/' + req.params.season + '/' + req.params.ep,
				trackers: ["udp://glotorrents.pw:6969/announce",
					"udp://tracker.opentrackr.org:1337/announce",
					"udp://torrent.gresille.org:80/announce",
					"udp://tracker.openbittorrent.com:80",
					"udp://tracker.coppersurfer.tk:6969",
					"udp://tracker.leechers-paradise.org:6969",
					"udp://p4p.arenabg.ch:1337",
					"udp://tracker.internetwarriors.net:1337"
				]
			});
			//////////////////////////// SUBTITLES //////////////////////////////////////////////
			OpenSubtitles.login()
				.then(res => {})
				.catch(err => {
					console.log(err);
				});
			var lang = ['fre', 'eng'];
			var path_sub_fr = '/srt?path=' + body.serie.imdb.slug + '/' + req.params.season + '/' + req.params.ep + '/' + body.serie.imdb.slug + '/fr.vtt';
			var path_sub_en = '/srt?path=' + body.serie.imdb.slug + '/' + req.params.season + '/' + req.params.ep + '/' + body.serie.imdb.slug + '/en.vtt';
			OpenSubtitles.search({
					sublanguageid: lang.join(),
					hash: hash,
					season: req.params.season ? req.params.season : null,
					episode: req.params.ep ? req.params.ep : null,
					extensions: ['srt', 'vtt'],
					limit: 'best',
					imdbid: body.serie.id_IMDB
				}).then(subtitles => {
					if (subtitles && subtitles.fr && subtitles.fr.url && body && body.serie) {
						download(subtitles.fr.url, '/tmp/hypertube-files/' + body.serie.imdb.slug + '/' + req.params.season + '/' + req.params.ep + '/' + body.serie.imdb.slug, {
							filename: "fr.srt"
						}).then(() => {
							fs.stat('/tmp/hypertube-files/' + body.serie.imdb.slug + '/' + req.params.season + '/' + req.params.ep + '/' + body.serie.imdb.slug + "/fr.srt", (err) => {
								if (err === null) {
									fs.createReadStream('/tmp/hypertube-files/' + body.serie.imdb.slug + '/' + req.params.season + '/' + req.params.ep + '/' + body.serie.imdb.slug + '/fr.srt')
										.pipe(srt2vtt())
										.pipe(fs.createWriteStream('/tmp/hypertube-files/' + body.serie.imdb.slug + '/' + req.params.season + '/' + req.params.ep + '/' + body.serie.imdb.slug + '/fr.vtt'));
								}
							});
						});
					} else {
						path_sub_fr = 'indisp.';
					}
					if (subtitles && subtitles.en && subtitles.en.url && body && body.serie) {
						download(subtitles.en.url, '/tmp/hypertube-files/' + body.serie.imdb.slug + '/' + req.params.season + '/' + req.params.ep + '/' + body.serie.imdb.slug, {
							filename: "en.srt"
						}).then(() => {
							fs.stat('/tmp/hypertube-files/' + body.serie.imdb.slug + '/' + req.params.season + '/' + req.params.ep + '/' + body.serie.imdb.slug + "/en.srt", (err) => {
								if (err === null) {
									fs.createReadStream('/tmp/hypertube-files/' + body.serie.imdb.slug + '/' + req.params.season + '/' + req.params.ep + '/' + body.serie.imdb.slug + '/en.srt')
										.pipe(srt2vtt())
										.pipe(fs.createWriteStream('/tmp/hypertube-files/' + body.serie.imdb.slug + '/' + req.params.season + '/' + req.params.ep + '/' + body.serie.imdb.slug + '/en.vtt'));

								}
							});
						});
					} else {
						path_sub_en = 'indisp.';
					}
					engine.on('ready', () => {

						const max = engine.files.reduce((prev, current) => {
							return (prev.length > current.length) ? prev : current;
						});

						engine.torrent.name = body.serie.imdb.slug; // Since we use a custom folder with HYPERtorrent-stream, we have to change it here otherwise it will load the old url.
						engine.files.forEach((file) => {

							file.path = body.serie.imdb.slug + '/' + req.params.season + '/' + req.params.ep + '/' + body.serie.imdb.slug + '/' + file.name; // Since we use a custom folder with HYPERtorrent-stream, we have to change it here otherwise it will load the old url.
							if (file !== max) {
								file.deselect();
								fs.unlink('/tmp/hypertube-files/' + file.path, () => {});
							} else {
								var stream = file.createReadStream();

								add_movie('/tmp/hypertube-files/' + file.path);
								if (body.serie.imdb.title) {
									res.render('movie/download', {
										title: body.serie.imdb.title,
										link: req.params.api + req.params.season + req.params.ep,
										room: room,
										user: req.user,
										path: encodeURI(file.path),
										imdb: body.serie.id_IMDB,
										info: body.serie.imdb,
										path_sub_fr: path_sub_fr,
										path_sub_en: path_sub_en,
										season: req.params.season,
										episode: req.params.ep,
										seeds: seeds,
										leechs: leechs
									});
								} else {
										res.redirect('/404');
								}
								setTimeout(function() {
									percent(engine, file, res, room)
								}, 2000);
								addToHistory(req, body.serie.id_IMDB);
							}
						});
					});
				})
				.catch(err => {
					console.log("Erreur dans le THEN d'Opensubtitles Search", err);
				});
		}
	});
});

// MOVIES...
router.get('/movies/:id', middleware.loggedIn(), (req, res) => {
	var room = req.params.id + encodeURI(Math.trunc(Math.random() * 10000000));
	var info = request('http://127.0.0.1:3030/api/yts/' + req.params.id, function(err, response, body) {
		body = JSON.parse(body);

		let hash = req.query.hash;
		if (!hash || !body.movie || !body.movie.torrent) {
			res.redirect('/404');
		} else if (!(body.movie.torrent.filter(torrent => torrent.hash == hash).length > 0)) {
			res.redirect('/404');
		} else {
			let seeds = 0;
			let leechs = 0;
			let quality = 'N/A';
			for (var i = 0, len = body.movie.torrent.length; i < len; i++) {
				if (body.movie.torrent[i].hash == hash) {
					seeds = body.movie.torrent[i].seeders;
					leechs = body.movie.torrent[i].leechers;
				}
			}
			var magnet = 'magnet:?xt=urn:btih:' + hash + '&dn=' + encodeURI(body.movie.raw_title);
			var engine = torrentStream(magnet, {
				name: body.movie.imdb.slug,
				path: '/tmp/hypertube-files',
				trackers: ["udp://glotorrents.pw:6969/announce",
					"udp://tracker.opentrackr.org:1337/announce",
					"udp://torrent.gresille.org:80/announce",
					"udp://tracker.openbittorrent.com:80",
					"udp://tracker.coppersurfer.tk:6969",
					"udp://tracker.leechers-paradise.org:6969",
					"udp://p4p.arenabg.ch:1337",
					"udp://tracker.internetwarriors.net:1337"
				]
			});
			//////////////////////////// SUBTITLES //////////////////////////////////////////////
			OpenSubtitles.login()
				.then(res => {})
				.catch(err => {
					console.log(err);
				});
			var lang = ['fre', 'eng'];
			var path_sub_fr = '/srt?path=' + body.movie.imdb.slug + '/fr.vtt';
			var path_sub_en = '/srt?path=' + body.movie.imdb.slug + '/en.vtt';
			OpenSubtitles.search({
				sublanguageid: lang.join(),
				hash: hash,
				extensions: ['srt', 'vtt'],
				limit: 'best',
				imdbid: body.movie.id_IMDB
			}).then(function(result) {
				if (result.fr.url) {
					download(result.fr.url, '/tmp/hypertube-files/' + body.movie.imdb.slug, {
						filename: "fr.srt"
					}).then(() => {
						fs.stat('/tmp/hypertube-files/' + body.movie.imdb.slug + "/fr.srt", (err) => {
							if (err === null) {
								fs.createReadStream('/tmp/hypertube-files/' + body.movie.imdb.slug + '/fr.srt')
									.pipe(srt2vtt())
									.pipe(fs.createWriteStream('/tmp/hypertube-files/' + body.movie.imdb.slug + '/fr.vtt'));
							}
						});
					});
				}
				if (result.en.url) {
					download(result.en.url, '/tmp/hypertube-files/' + body.movie.imdb.slug, {
						filename: "en.srt"
					}).then(() => {
						fs.stat('/tmp/hypertube-files/' + body.movie.imdb.slug + "/en.srt", (err) => {
							if (err === null) {
								fs.createReadStream('/tmp/hypertube-files/' + body.movie.imdb.slug + '/en.srt')
									.pipe(srt2vtt())
									.pipe(fs.createWriteStream('/tmp/hypertube-files/' + body.movie.imdb.slug + '/en.vtt'));
							}
						});
					});
				}
				engine.on('ready', () => {
					const max = engine.files.reduce((prev, current) => {
						return (prev.length > current.length) ? prev : current;
					});
					engine.torrent.name = body.movie.imdb.slug; // Since we use a custom folder with HYPERtorrent-stream, we have to change it here otherwise it will load the old url.
					engine.files.forEach((file) => {
						file.path = body.movie.imdb.slug + '/' + file.name; // Since we use a custom folder with HYPERtorrent-stream, we have to change it here otherwise it will load the old url.
						// Since we use a custom folder with HYPERtorrent-stream, we have to change it here otherwise it will load the old url.
						if (file !== max) {
							file.deselect();
							fs.unlink('/tmp/hypertube-files/' + file.path, () => {});
						} else {
							var stream = file.createReadStream();

							add_movie('/tmp/hypertube-files/' + file.path);

							res.render('movie/download', {
								title: body.movie.raw_title,
								room: room,
								user: req.user,
								path: encodeURI(file.path),
								link: body.movie.id_IMDB,
								imdb: body.movie.id_IMDB,
								info: body.movie.imdb,
								path_sub_fr: path_sub_fr,
								path_sub_en: path_sub_en,
								seeds: seeds,
								leechs: leechs
							});
							setTimeout(function() {
								percent(engine, file, res, room)
							}, 2000);
							addToHistory(req, body.movie.id_IMDB);
						}
					});
				});
			});
		}
	});
});

router.get('/srt', middleware.loggedIn(), (req, res) => {
	res.set('Content-Type', 'text/vtt');
	res.sendFile('/tmp/hypertube-files/' + decodeURI(req.query.path));
});

router.get('/video', middleware.loggedIn(), (req, res) => {
	let file = '/tmp/hypertube-files/' + decodeURI(req.query.path);
	fs.stat(file, function(err, stats) {
		if (err)
			return res.sendStatus(404);
		let range = req.headers.range;
		if (!range)
			return res.sendStatus(416);
		let positions = range.replace(/bytes=/, '').split('-');
		let start = parseInt(positions[0], 10);
		let file_size = stats.size;
		let end = positions[1] ? parseInt(positions[1], 10) : file_size - 1;
		end = end > (file_size - 1) ? file_size - 1 : end;
		let chunksize = (end - start) + 1;
		let head = {
			'Content-Range': 'bytes ' + start + '-' + end + '/' + file_size,
			'Accept-Ranges': 'bytes',
			'Content-Length': chunksize,
			'Content-Type': 'video/mp4'
		}
		res.writeHead(206, head);
		if (start > end) {
			start = 0;
			end = 0;
		}
		let stream_position = {
			start: start,
			end: end
		}
		let stream = fs.createReadStream(file, stream_position)
		stream.on('open', function() {
			stream.pipe(res);
		})
		stream.on('error', function(err) {
			return res.sendStatus(404);
		});
	});
});

function percent(engine, file, res, room) {
	io.sockets.in(room).emit('progress', {
		value: Math.round((engine.swarm.downloaded / file.length) * 100)
	});
	setTimeout(function() {
		percent(engine, file, res, room)
	}, 3000);
};

io.on('connection', (socket) => {
	socket.on('subscribe', (data) => {
		socket.pseudo = data.user;
		socket.join(data.room);
	});
});

function add_movie(movie_path) {
	var now = new Date(Date.now());
	Movie.findOne({
		'movie_path': movie_path
	}, (err, result) => {
		if (!result || result.length === 0) {
			Movie.create({
				movie_path: movie_path,
				date: now
			}, (err) => {
				if (err)
					res.send("Error");
			});
		} else {
			Movie.update({
				movie_path: movie_path
			}, {
				date: now
			}, (err) => {
				if (err)
					res.send("Error");
			});
		}
	});
}

function addToHistory(req, videoID) {
	User.findOneAndUpdate({
		_id: req.user._id
	}, {
		$push: {
			history: videoID
		}
	}, (err, result) => {
		if (!err) {
			req.user.history = result.history;
		}
	});
};

module.exports = router;