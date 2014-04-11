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
          "name": trim($("label .ss-q-title",el).text()),
          "required": !!$(".ss-required-asterisk",el).length
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
        $pre = $("<pre><code></code></pre>").css("white-space","pre-wrap"),
        options = {
                    options: {
                      dataSource: {
                        url: "SPREADSHEET KEY GOES HERE",
                        type: "google"
                      },
                      gridSize: 10,
                      xAxis: ["Less X","More X"],
                      yAxis: ["More Y","Less Y"],
                      gridTarget: "gridId",
                      commentsTarget: "commentsId",
                      colors: {
                        name: "Reds",
                        number: 5
                      }
                    },
                    // Spreadsheet form endpoint
                    dataDestination: $("form#ss-form").attr("action"),
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

    if ($.grep(options.fields,function(i){ return (i.name.toLowerCase() == "x"); }).length != 1 || 
        $.grep(options.fields,function(i){ return (i.name.toLowerCase() == "y"); }).length != 1) {
      
      $div.append("<h1>Unable to fetch options. Make sure you have an 'X' and 'Y' field in your form.</h1>");
    
    } else {
      // Add a header and styling for clarity
      $div.append("<h1>Options for Sentiment Tracker:</h1>");

      // Stringify the options with spacing
      $pre.append(JSON.stringify(options,null,"  "));
      $div.append($pre);

    }

    $div.attr("id","sentiment-tracker")
        .css({
              "background-color": "white",
              "border": "1px solid black",
              "padding": "10px",
              "margin": "50px 10px", //Try to get it below the "Edit this form" button
            });

    // Remove an existing one
    $("div#sentiment-tracker").remove();

    // Insert at the top of the page
    $("body").prepend($div);


  }

  function trim(s){ 
    return ( s || '' ).replace( /^\s+|(\s|[*])+$/g, '' ); 
  }
 
})();