const express = require('express');

const app = express();
const path = require('path');

const oauthSignature = require('oauth-signature');
const n = require('nonce')();
const qs = require('querystring');
const _ = require('lodash');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));

const results = [];

app.use(express.static(path.join(__dirname, '../')));
app.listen(3000);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const set_parameters = {};

function request_yelp(set_parameters) {
  /* The type of request */
  const httpMethod = 'GET';
  /* The url we are using for the request */
  const url = 'http://api.yelp.com/v2/search';
  /* We can setup default parameters here */
  const default_parameters = {
  	radius_filter: 8000,
		sort: 1,
		limit: 1,
  };
  /* We set the require parameters here */
  const required_parameters = {
    oauth_consumer_key : 'vUOpb1ld_WerWPshBM5sTg',
    oauth_token : 'MY_R1KLLfIyT1_37uqBBlwaH-kxnZJ2w',
    oauth_nonce : n(),
    oauth_timestamp : n().toString().substr(0,10),
    oauth_signature_method : 'HMAC-SHA1',
    oauth_version : '1.0'
  };
  const parameters = _.assign(default_parameters, set_parameters, required_parameters);
  /* We set our secrets here */
  const consumerSecret = '22BcD5jF0ix06E7Vy-l_ttzyf9s';
  const tokenSecret = 'WNeRlfz6_SSHqurnfRHUDpIH0-E';
  /* Then we call Yelp's Oauth 1.0a server, and it returns a signature */
  /* Note: This signature is only good for 300 seconds after the oauth_timestamp */
  const signature = oauthSignature.generate(httpMethod, url, parameters,
    consumerSecret, tokenSecret, { encodeSignature: false });
  /* We add the signature to the list of paramters */
  parameters.oauth_signature = signature;
  /* Then we turn the paramters object, to a query string */
  const paramURL = qs.stringify(parameters);
  /* Add the query string to the url */
  const apiURL = url + '?' + paramURL;
  /* make API Request to Yelp */
  return request.getAsync(apiURL);
}


app.post('/', function(req, res){

	// function handleData (error, body) {
	// 	if (error) console.log(error);
	// 	else {
	// 	// console.log("handledata "+JSON.stringify(JSON.parse(body).businesses));
	// 	JSON.parse(body).businesses.map(function(item) {
	// 		results.push({
	// 			rating: item.rating_img_url,
	// 			name: item.name,
	// 			url: item.url,
	// 			location: item.location.coordinate,
	// 		});
	// 	});
	//   }
	// 	if (i == (length - 1)) {
	// 	 console.log("results", JSON.stringify(results));
	// 	 res.send(results);
	// 	}
	// }
	//
	// console.log("points: "+req.body.points);
	// console.log("category: "+req.body.category);
	//
	// var length = JSON.parse(req.body.points).length;
	// console.log('length', length);
	// console.log(JSON.parse(req.body.points)[0].lat);
	// console.log(JSON.parse(req.body.points)[0].lng);
	//
	// for (i = 0; i < length; i++) {
	// 	(function (i) {
	// 		console.log("i", i);
	// 		var latLong = JSON.parse(req.body.points)[i].lat+','+JSON.parse(req.body.points)[i].lng;
	// 		set_parameters.term = req.body.category;
	// 		set_parameters.categories = req.body.category;
	// 		set_parameters.ll = latLong;
	// 		request_yelp(set_parameters, handleData);
	// 	})(i);
	// }

	let points = JSON.parse(req.body.points);
	set_parameters.term = req.body.category;
	set_parameters.categories = req.body.category;

  Promise.map(points, function (item) {
    const latLong = item.lat + ',' + item.lng;
    set_parameters.ll = latLong;
    return request_yelp(set_parameters);
  })
  .then(function (yelpData) {
  console.log('done');

  yelpData.forEach(function (item) {
    console.log(yelpData.body);
  });



	// body.businesses.forEach(function(item) {
	// 	results.push({
	// 		rating: item.rating_img_url,
	// 		name: item.name,
	// 		url: item.url,
	// 		location: item.location.coordinate,
	// 	});
	// })
})
.catch(function(e){
	console.log(e);
})
console.log(results);
// });

// getYelpResults(points);

});

// module.exports = server;
