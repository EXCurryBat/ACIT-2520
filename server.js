const express = require('express');
const request = require('request');
const hbs = require('hbs');
const fs = require('fs');

var app = express();
var weather = ''; //variable to hold the weather info

var getAddress = (address) => {
	return new Promise((resolve, reject) => {
		request({
			url: `http://maps.googleapis.com/maps/api/geocode/json?address=`+ 
			encodeURIComponent(address),
			json: true
		}, (error, response, body) => {
			if (error) {
				reject('Cannot connect to Google Maps');
			} else if (body.status === 'ZERO__RESULTS') {
				reject('Cannot find requested address');
			} else if (body.status === 'OK') {
				resolve(body.results[0].geometry.location.lat+','+body.results[0].geometry.location.lng);
			}
		});
	});
};

var getWeather = (address) => {
	return new Promise((resolve, reject) => {
		request({
			url: `https://api.darksky.net/forecast/f52a6f1873893dbde13523c135911c9f/`+ 
			encodeURIComponent(address),
			json: true
		}, (error, response, body) => {
			if (error) {
				reject('Cannot connect to darksky.net');
			} else if (body.code === 400) {
				reject(body.error);
			} else {
				resolve(body);
			}
		});
	});
};

//---------------------------------------------------------------------------
app.use((request, response, next) => {
	response.render('maintenance.hbs', {

	});
});

app.use((request, response, next) => {
	var time = new Date().toString();
	// console.log(`${time}: ${request.method} ${request.url}`);
	var log = `${time}: ${request.method} ${request.url}`;
	fs.appendFile('server.log', log+ '\n', (error) => {
		if (error) {
			console.log('Unable to log message');
		}
	});
	next();
});

hbs.registerPartials(__dirname+ '/views/partials');

app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public'));

hbs.registerHelper('getCurrentYear', () => {
	return new Date().getFullYear();
});

hbs.registerHelper('message', (text) => {
	return text.toUpperCase();
})

// here add routes
app.get('/', (request, response) => {
	response.sendFile(__dirname + '/public/main.html')
});

app.get('/about', (request, response) => {
	response.sendFile(__dirname + '/public/about.html')
});


app.get('/weather', (request, response) => {
	// var weatherString = `The temperature in Vancouver is ${weather.currently.temperature} and is ${weather.currently.summary}`
	response.send(
		// weatherString,
		weather
	)
});

app.get('/info', (request, response) => {
	response.render('about.hbs', {
		title: 'Awesome me',
		year: new Date().getFullYear(),
		about: 'About me',
		goodbye: 'Goodbye!',
		link: 'start',
		page: 'Main page',
		myimg: 'https://steamuserimages-a.akamaihd.net/ugc/861727094491823008/BF4D73E6F5FCA88686AC1FFB496BC6B180E20335/'
	});
});

app.get('/start', (request, response) => {
	response.render('main.hbs', {
		title: 'Main page',
		year: new Date().getFullYear(),
		about: 'Welcome to my main page',
		goodbye: 'Goodbye!',
		link: 'info',
		page: 'About me',
		tWeather: weather,
		myimg: 'https://upload.wikimedia.org/wikipedia/commons/0/06/Kitten_in_Rizal_Park%2C_Manila.jpg'
	});
});

app.listen(8080, () => {
    console.log('Server is up on the port 8080');
    // here add the logic to return the weather based on the statically provided location and save it inside the weather variable
    getAddress('Vancouver').then((result) => {
		return getWeather(result);
	}).then((result) => {
		weather = `The temperature in Vancouver is ${result.currently.temperature} and is ${result.currently.summary}`;
	}).catch((error) => {
		console.log('Error:', error);
	});
});