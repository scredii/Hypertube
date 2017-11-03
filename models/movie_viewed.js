var movieSchema = mongoose.Schema({
    movie_path	: String,
    date		: {type: Date, default: Date.now}
});


module.exports = mongoose.model('Movie', movieSchema);