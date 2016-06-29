// The following code appends a title to the page
// document.createElement creates an element that can be altered and then inserted into the DOM
// document.body.appendChild places a node as a child under the body element
var title = document.createElement('div');
title.innerHTML = 'Social Calendar';
document.body.appendChild(title);



var html = "";

for (var i = 0; i < schedule.length; i++) {
  	console.log(schedule[i].day);
    html += "<ul id='list'>"
    html += "<li>Unit: " + schedule[i].unit + "</li>"
    html += "<li>Challenge: "+ schedule[i].challenge + "</li>"
    html += "<li>Goals: " + schedule[i].goals + "</li>"
    html += "</ul>"
  	$('table').find('#' + schedule[i].week).find('#' + schedule[i].day).append(html);
  	html = "";
}
// var day1 = document.createElement('div');


// Your schedule can be accessed through the global object "schedule"
// console.log(schedule);
