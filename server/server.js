const express = require('express');

const app = express();
const path = require('path');
const oauthSignature = require('oauth-signature');
const n = require('nonce')();
const qs = require('querystring');
const _ = require('lodash');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const request = require('request-promise');

const results = [];
const set_parameters = {};


app.use(express.static(path.join(__dirname, '../')));
app.listen(3000);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// receives category and coordinates data from front end, makes yelp call
// and returns response to front end
app.post('/', function (req, res) {
  const points = JSON.parse(req.body.points);
  set_parameters.term = req.body.category;
  set_parameters.categories = req.body.category;

  // maps through data and makes a yelp call for each set of coordinates
  Promise.map(points, function (item) {
    const latLong = item.lat + ',' + item.lng;
    set_parameters.ll = latLong;
    return request_yelp(set_parameters).then(function (body) {
      return JSON.parse(body);
    });
  }).then(function (yelpBody) {
    yelpBody.forEach(function (item) {
      results.push({
        rating: item.businesses[0].rating_img_url,
        name: item.businesses[0].name,
        url: item.businesses[0].url,
        location: JSON.stringify(item.businesses[0].location.coordinate),
      })
    });
  // sends yelp results to front end
  }).then(function () {
    res.send(results);
  }).catch(function(e) {
    throw e;
  });
});

// helper function that compiles all the Yelp parameters and makes Yelp call
function request_yelp(set_parameters) {
  const httpMethod = 'GET';
  const url = 'http://api.yelp.com/v2/search';
  // parameter-setting:
  const default_parameters = {
    radius_filter: 8000,
    sort: 1,
    limit: 1,
  };
  const required_parameters = {
    oauth_consumer_key: 'vUOpb1ld_WerWPshBM5sTg',
    oauth_token: 'MY_R1KLLfIyT1_37uqBBlwaH-kxnZJ2w',
    oauth_nonce: n(),
    oauth_timestamp: n().toString().substr(0, 10),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_version: '1.0',
    radius_filter: 8000,
    sort: 1,
    limit: 1,
  };
  const parameters = _.assign(default_parameters, set_parameters, required_parameters);
  // secrets-setting:
  const consumerSecret = '22BcD5jF0ix06E7Vy-l_ttzyf9s';
  const tokenSecret = 'WNeRlfz6_SSHqurnfRHUDpIH0-E';
  // call to Yelp's Oauth server which returns a signature:
  const signature = oauthSignature.generate(httpMethod, url, parameters, consumerSecret,
    tokenSecret, { encodeSignature: false });
  parameters.oauth_signature = signature;
  const paramURL = qs.stringify(parameters);
  const apiURL = url + '?' + paramURL;
  return request(apiURL);
}
