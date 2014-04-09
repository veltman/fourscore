sentiment-tracker
=================

An open-source version of the WNYC sentiment tracker.

**Bookmarklet:**

When viewing a Google form, this bookmarklet extracts the field names and input IDs as a set of JSON options that could be supplied to the Sentiment Tracker.

<a href='javascript:(function(){if(window.jQuery===undefined){var done=false;var script=document.createElement("script");script.src="https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js";script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;initBookmarklet()}};document.getElementsByTagName("head")[0].appendChild(script)}else{initBookmarklet()}function initBookmarklet(){var $div=$("<div></div>"),$pre=$("<pre><code></code></pre>"),options={action:$("form#ss-form").attr("action"),fields:$("form#ss-form div.ss-form-question div.ss-form-entry").map(function(){return{name:trim($("label .ss-q-title",this).text()),field:$("input",this).attr("name")}}).get()};$pre.append(JSON.stringify(options,null,"  "));$div.append("<h1>Options for Sentiment Tracker:</h1>");$div.attr("id","sentiment-tracker").css({"background-color":"white",border:"1px solid black",padding:"10px",margin:"50px 10px"}).append($pre);$("div#sentiment-tracker").remove();$("body").prepend($div)}function trim(s){return(s||"").replace(/^\s+|\s+$/g,"")}})();'>Bookmarklet</a>