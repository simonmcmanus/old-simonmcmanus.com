exports.processItem = function(item) {
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



exports.buildDateObj = function(articles) {
	var lastItemDate = "";
	var dateObj = {};
	for(i=0; i<articles.length; i++) {
		item = exports.processItem(articles[i]);
		if(item.simpledate == lastItemDate){
			dateObj[item.simpledate].push(item);
		} else {			
			dateObj[item.simpledate] = [item];
			lastItemDate = item.simpledate;
		}
	}
	return dateObj;
};


