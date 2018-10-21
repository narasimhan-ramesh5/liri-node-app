/**
 * liri.js
 * 
 * Usage:
 *      node liri.js spotify-this-song '<song name here>'
 *      node liri.js concert-this '<artist/band name here>'
 * 
 * This app lets you
 *     1. Search for a song in Spotify
 *     2. Search for upcoming concerts of a band/musician
 */

require("dotenv").config();

var Request = require('request');
var Spotify = require('node-spotify-api');

var fs = require('fs');

var LIRI_INPUT_FILE = "random.txt";

var spotify_credentials = require('./keys').spotify;
var omdb_credentials = require('./keys').omdb;

function show_usage(){
	console.log("************** LIRI App Usage **************");
	console.log("To search for a song in spotify");
	console.log("  node liri.js spotify-this-song '<song name here>'");
	console.log("Or to find a concert");
	console.log("  node liri.js concert-this '<artist/band name here>'");
	console.log("********************************************\n");
}

function liri_main(){

	var num_args = process.argv.length - 2;

	/* Step 1 : parse arguments */
	if(num_args < 1){
		return show_usage();
	}

	/* Get the command
		 - spotify-this-song
		 - concert-this
		 - movie-this
		 - do-what-it-says
	 */
	which_command = process.argv[2].toLowerCase();

	if(which_command === "spotify-this-song"){
		let song_name = (process.argv.slice(3, process.argv.length)).join(" ");
		if(!song_name){
			song_name = "The Sign Ace Of Base";
		}
		liri_spotify_lookup(song_name);
	} 
	
	else if (which_command === "concert-this"){
		let artist_name = (process.argv.slice(3, process.argv.length)).join(" ");
		if(!artist_name){
			return console.log("Please enter a musician/band name for concertn lookup");
		}
		liri_concert_lookup(artist_name);
	} 
	
	else if(which_command === "movie-this"){
		let movie_name = (process.argv.slice(3, process.argv.length)).join(" ");
		if(!movie_name){
			movie_name = "Mr. Nobody";
		}
		liri_movie_lookup(movie_name);
	} 
	
	else if(which_command === "do-what-it-says"){
		liri_do_what_it_says();
	}

	else{
		console.log("Don't recognize this command - " + which_command);
		return show_usage();
	}

}

function liri_spotify_lookup(song_name){
	var spotify_obj = new Spotify(spotify_credentials);
	if(!spotify_obj){
		return console.log("Error couldn't connect to Spotify API");
	}

	spotify_obj.search({ type: 'track', query: song_name, limit : 1 }, function(err, data) {
		if (err) {
			return console.log('Error occurred: ' + err);
		}
		song_info = data.tracks.items[0];
		
		console.log("\n************ SONG INFO ************");
		console.log("Artist : " + song_info.artists[0].name);
		console.log("Song name : " + song_info.name);
		console.log("Preview on spotify : " + song_info.external_urls.spotify);
		console.log("Album name : " + song_info.album.name);
		console.log("\n");
		//console.log("---------------------------------------------------------");
	});
}

function liri_concert_lookup(artist_name){
	console.log("Still waiting for a key from BandsInTown :(");
}

function liri_movie_lookup(movie_name){
	var queryURL = "https://www.omdbapi.com/?t=" + movie_name + "&apikey=" + omdb_credentials.apikey;
	var rotten_tomatoes_rating;

	Request(queryURL, function(error, response, body){
		if(error){
			throw error;
		}

		//console.log(body);
		movie_info = JSON.parse(body);

		response = movie_info.Response.toLowerCase();
		if(response === "false"){
			return console.log(movie_info.Error);
		}

		// Look up Rotten Tomatoes rating
		for(var i = 0; i < movie_info.Ratings.length; i++){
			if(movie_info.Ratings[i].Source === "Rotten Tomatoes"){
				rotten_tomatoes_rating = movie_info.Ratings[i].Value;
			}
		}

		if(!rotten_tomatoes_rating){
			rotten_tomatoes_rating = "Not Available";
		}

		console.log("\n************ MOVIE INFO ************");
		console.log("Movie name : " + movie_info.Title);
		console.log("Year of release : " + movie_info.Year);
		console.log("IMDB Rating : " + movie_info.imdbRating);
		console.log("Rotten Tomatoes Rating : " + rotten_tomatoes_rating);
		console.log("Country : " + movie_info.Country);
		console.log("Language : " + movie_info.Language);
		console.log("Plot : " + movie_info.Plot);
		console.log("Actors : " + movie_info.Actors);
		console.log("\n");

	});
}

function liri_do_what_it_says(){

	/* Read the contents of the file */
	fs.readFile(LIRI_INPUT_FILE, "utf8", async function(err, data){
		if(err){
			throw err;
		}
		//console.log(data);
		file_lines = data.split("\r\n");
		//console.log(file_lines);

		/* Loop through the array containing the file lines
		   and process each line */
		for(var i = 0; i < file_lines.length; i++){
			let entry_arr = file_lines[i].split(",");
			let which_command = entry_arr[0].toLowerCase();
			let args = entry_arr[1].toLowerCase();

			/* Remove the quotes from the movie name/song name/artist name */
			args.replace('"','');
		
			if(!which_command){
				return console.log("error - couldn't find a command in line " + (i+1));
			}

			switch(which_command){
				case "spotify-this-song":
					liri_function = liri_spotify_lookup;
					if(!args){
						args = "The Sign Ace of Base";
					}
					break;
				case "movie-this":
					liri_function = liri_movie_lookup;
					if(!args){
						args = "Mr. Nobody";
					}
					break;
				case "concert-this":
					liri_function = liri_concert_lookup;
					break;
				default:
					console.log("Unsupported command  - " + which_command);
			}

			/*var promise = new Promise(function(lookup_complete, lookup_failed){
				liri_function(args, lookup_complete, lookup_failed);
			});*/

			liri_function(args);

			//await promise;
		
			//console.log("Command " + (i+1) + " = " + command);
		}
	});
}

function lookup_complete(){
}

function lookup_failed(){
}

liri_main();
