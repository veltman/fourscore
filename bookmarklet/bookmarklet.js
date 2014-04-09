(function(){
  
  //get jQuery
  if (window.jQuery === undefined) {
    var done = false;
    var script = document.createElement("script");
    script.src = "https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js";
    script.onload = script.onreadystatechange = function(){
      if (!done && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete")) {
        done = true;
        initBookmarklet();
      }
    };
    document.getElementsByTagName("head")[0].appendChild(script);
  } else {
    initBookmarklet();
  }
 
  function initBookmarklet() {

    //Empty div, empty pre, form options
    var $div = $("<div></div>"),
        $pre = $("<pre><code></code></pre>"),
        options = {
                    // Spreadsheet form endpoint
                    action: $("form#ss-form").attr("action"),
                    // Mapped array of {name: "foo", field: "bar"}
                    // name = human field name (e.g. "ZIP Code")
                    // field = Google form field ID (e.g. input.a099i12j09ds2)
                    fields: $("form#ss-form div.ss-form-question div.ss-form-entry").map(function(){
                        return {
                          "name": trim($("label .ss-q-title",this).text()),
                          "field": $("input",this).attr("name")
                        }
                      }).get()
                  };

    // Stringify the options with spacing
    $pre.append(JSON.stringify(options,null,"  "));

    // Add a header and styling for clarity
    $div.append("<h1>Options for Sentiment Tracker:</h1>");

    $div.attr("id","sentiment-tracker")
        .css({
              "background-color": "white",
              "border": "1px solid black",
              "padding": "10px",
              "margin": "50px 10px", //Try to get it below the "Edit this form" button
            })
        .append($pre);

    // Remove an existing one
    $("div#sentiment-tracker").remove();

    // Insert at the top of the page
    $("body").prepend($div);


  }

  function trim(s){ 
    return ( s || '' ).replace( /^\s+|\s+$/g, '' ); 
  }
 
})();