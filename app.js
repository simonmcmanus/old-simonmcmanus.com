var express = require('express'),
fs = require('fs');
var jqtpl = require( "jqtpl" );
var $ = require( "jquery" );



// lifestream bits 
var rss = require('../rss-aggregator/node-rss.js');
var lifestream = require('../rss-aggregator/sortItems.js');
var pretty = require('../yuie/prettyDates.js');
var agg = require('./smm-aggregator.js');

// Express config 
var app = module.exports = express.createServer();
app.set( "view engine", "html" );
app.register( ".html", jqtpl);

// REQUIRED TO RUN WITH UPSTART 
app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('views');
 });


// App Settings 
var stuff = "/mnt/www/simonmcmanus.com/stuff/";

var smm = {
	items: [],
	requests: {
		/**	'reader':'http://www.google.com/reader/public/atom/user%2F02107026956461802093%2Fstate%2Fcom.google%2Fstarred',**/	
		'twitter':'http://twitter.com/statuses/user_timeline/8892842.rss',
		'wordpress':'http://simonmcmanus.wordpress.com/feed/',
		'flickr':'http://api.flickr.com/services/feeds/photos_public.gne?id=22127230@N08&lang=en-us&format=rss_200',
		'youtube':'http://gdata.youtube.com/feeds/base/users/simonmcmanus/uploads?alt\x3drss\x26v\x3d2\x26orderby\x3dpublished\x26client\x3dytapi-youtube-profile'
	},
	requestCount:0,
	pages: {
		'contact':{
			'title':'Simon McManus - Contact',
			'description': 'How to contact me'
		}, 
		'about':{
			'title':'Simon McManus - About ',
			'description':'About me'
		},
		'activity':{
			'title':'Simon McManus - Activity',
			'description':'A summary of my recent online activity'
		}
	}	
};

app.get('/', function(req, res) {	
	smm.items = []; // reset items 
	var completeCallback = function(arguments) {
		smm.items = smm.items.concat(arguments);
		smm.requestCount--;
		if(smm.requestCount == 0){
			res.render('activity', {
			    locals: {
					title:smm.pages.activity.title,
					subtitle:smm.pages.activity.description,
					activitySelected: 'selected',
					items: agg.buildDateObj(lifestream.sortItems(smm.items))
			    }
			});
		}
	};
	
	for(var item in smm.requests){
		smm.requestCount++;
		rss.doGet(smm.requests[item], item, function(data, item) {
			var p = rss.newRssParser(item, completeCallback);
			p.parseString(data);
		});
	}
});



app.get('/about.html', function(req, res) {
	res.render('about.html',{
		locals: {
			title:smm.pages['about'].title,
			subtitle:smm.pages['about'].description,
			'aboutSelected': 'selected'
		}
	});
});

app.get('/contact.html', function(req, res) {
	res.render('contact.html',{
		locals: {
			title:smm.pages['contact'].title,
			subtitle:smm.pages['contact'].description,
			'contactSelected': 'selected'
		}
	});
});


//download .js/.css/.* files in stuff
app.get('/stuff/:file(*)', function(req, res){
	var file = req.params.file;
	var folder = stuff + file;
	res.download(folder);
});    


//Folders in stuff
app.get('/stuff:file(*/)', function(req, res){
	var html = ['<ul>'];
	var file = req.params.file;
	var folder = stuff + file
	var files = fs.readdir(folder, function(err, files) {
		var c = files.length;
		var f,link;
		while(c--){	
			f = files[c];	
			var l = f.length;
			// strip html
			var ext = f.substring(l-5, l);
			if(ext.indexOf('.') == -1){
				link = f + "/";
			}else {
				link = f;
			}
			html.push('<li><a href="'+link+'">'+f+'</a></li>');
		}
		html.push('</ul>');
		res.render('template.html', {
 	    locals: {
    		     content: html.join()
     	}
 	});
	});	
}); 


//build and render html files in stuff.
app.get('/stuff/:file(*.html)', function(req, res){
	var file = req.params.file;
	var folder = stuff + file
	var l = folder.length;
	res.render(folder, {
		locals: {
     	title: file,
			'contact': 'selected'
 	}
 });
});
	

app.listen(8000);
console.log('Server running at: http://simonmcmanus.com:8000/');

