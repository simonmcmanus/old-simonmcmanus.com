var express = require('express'),
fs = require('fs');
var jqtpl = require( "jqtpl" );
var $ = require( "jquery" );


var stuff = "/mnt/www/simonmcmanus.com/stuff/";

// lifestream bits n 
var rss = require('../rss-aggregator/node-rss.js');
var lifestream = require('../rss-aggregator/sortItems.js');
var pretty = require('../yuie/prettyDates.js');


var app = module.exports = express.createServer();
app.set( "view engine", "html" );
app.register( ".html", jqtpl);


var processItem = function(item) {
	var title = "";
	var body = "";
	switch(item.type)
	{
		case 'twitter':
			title = item.title;
			body = item.body;
		break;
		case 'flickr':
				title = item.title;
			body = item.description+"\n"+item.content;
		  break;			  
			case 'wordpress':
			title = item.title;
//			body = item.description+"\n";
		  break;
  		case 'youtube':
				title = item.title;
//			body = item.description+"\n";
		  break;
		case 'delicious':
			title = item.title;
		  break;
		default:
			title = item.title;
	}
	return 	{
		'title': title,
		'body':body,
		'type':item.type,
		'link':item.link,
		'pubdate':item.pubdate,
		'simpledate':item.simpledate
	};
};

var parseUrl = function(str) {
	return str.replace('&', '&amp;');
};
var buildHtml = function(articles) {
	var lastItemDate = "";
	var ret = [];
	for(i=0; i<articles.length; i++) {
		item = processItem(articles[i]);
		if(item.simpledate != lastItemDate){
			var prettyDate = pretty.prettyDateDaysOnly(item.pubdate);
			if(prettyDate !="undefined" && prettyDate != null ){
				ret.push('<div class="date"><h2>'+pretty.prettyDateDaysOnly(item.pubdate)+"</h2>"+item.simpledate+'</div>');
			}else {
				ret.push('<div class="date"><h2>'+item.simpledate+"</h2></div>");		
			}
			lastItemDate = item.simpledate;
		}
		ret.push('<div class="item '+item.type+'">'+item.title);
		if(item.body !== "" && typeof item.body !== "undefined"  ){
			ret.push('<div class="content">'+item.body+'</div>');
		}	
		ret.push("<ul class='bottom'>"+
			"<li><a href='"+parseUrl(item.link)+"'>"+parseUrl(item.link)+"</a></li></ul></div>");
	}
	return ret.join('');
};



var smm = {
	items: [],
	requests: {
		/**	'reader':'http://www.google.com/reader/public/atom/user%2F02107026956461802093%2Fstate%2Fcom.google%2Fstarred',**/	
		'twitter':'http://twitter.com/statuses/user_timeline/8892842.rss',
		'wordpress':'http://simonmcmanus.wordpress.com/feed/',
		'flickr':'http://api.flickr.com/services/feeds/photos_public.gne?id=22127230@N08&lang=en-us&format=rss_200',
		'youtube':'http://gdata.youtube.com/feeds/base/users/simonmcmanus/uploads?alt\x3drss\x26v\x3d2\x26orderby\x3dpublished\x26client\x3dytapi-youtube-profile'
	},

	requests2: {
		'wordpress':'http://simonmcmanus.wordpress.com/feed/'
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
	var fileCallback = function(data, type) {
		var p = rss.newRssParser(type);
		p.parseString(data);
	};
	// called when all the rss files have been collected
	
	

	var completeCallback = function(arguments) {
		console.log('complete callback');
		smm.items = smm.items.concat(arguments);
		smm.requestCount--;
		if(smm.requestCount == 0){
			var html = buildHtml(lifestream.sortItems(smm.items));
			res.render('template', {
			    locals: {
					subtitle:smm.pages.activity.description,
					content:html,
					activitySelected: 'selected'
			    }
			}, function(a, items) {
				// do jquery bits here to items.
				res.send(items);
			});
		}
	};
	for(var item in smm.requests){
		if (typeof item !== "undefined") {
			smm.requestCount++;
			rss.doGet(smm.requests[item], item, function(data, item) {
				var p = rss.newRssParser(item, completeCallback);
				p.parseString(data);

					
			});
		}	
	}
});


// Folders in stuff
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


// build and render html files in stuff.
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

// download .js/.css/.* files in stuff
app.get('/stuff/:file(*)', function(req, res){
	var file = req.params.file;
	var folder = stuff + file;
	res.download(folder);
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


/*	
app.get('/*.html', function(req, res) {
	var p = req.originalUrl;
	p = p.substring(1, p.length); // strip slash
	var type = p.substring(0, p.length -5)+"Selected";
	console.log('type is : ', type);
	res.render(p,{
		locals: {
			title:smm.pages[p].title,
			subtitle:smm.pages[p].description,
			type: 'selected'
		}
	}, function(a, items) {
//		console.log(items, $(items));
//			var html = $(items).find('a[href$="'+req.originalUrl+'"]').addClass('selected').parents('html');			
			res.send('<html>'+items+'</html>');
	});
});
*/



app.listen(8000);
console.log('Server running at: http://simonmcmanus.com:8000/');

