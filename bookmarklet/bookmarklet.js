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

  function getInput(el) {

    var item = {
          "name": trim($("label .ss-q-title",el).text())
        },
        $i = $("input",el),
        $s = $("select:first",el),
        $t = $("textarea:first",el);

    //Exclude grids by ignoring tables
    if ($i.length && !$("table",el).length) {

      item.type = $i.first().attr("type");
      item.field = $i.first().attr("name");

      //Get choices for radio and checkbox
      if (item.type == "radio" || item.type == "checkbox") {
        item.choices = $i.map(function(){
            return $(this).val();
          })
          .get();
      }

    } else if ($s.length) {

      item.type = "select";
      item.field = $s.attr("name");

      //Get choices for select
      item.choices = $s.find("option").map(function(){
          return $(this).val();
        })
        .get();

    } else if ($t.length) {

      item.type = "textarea";
      item.field = $t.attr("name");

    }

    return ("type" in item) ? item : null;

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
                    fields: $("form#ss-form div.ss-form-question div.ss-form-entry").map(function() {
                        return getInput(this);
                      })
                      .get()
                      .filter(function(d){
                        return d !== null;
                      })
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