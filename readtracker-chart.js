function overlaps(r1, r2) {
  return !(r2.x > (r1.x + r1.width) || 
           (r2.x + r2.width) < r1.x || 
           r2.y > (r1.y + r1.height) ||
           (r2.y + r2.height) < r1.y);
}

function showChart(selector, text) {
  // selector is used to select the svg element; text contains
  // the content of readtracker.json (which might be ill-formed)
  var svg = d3.select(selector),
      margin = {top: 20, right: 250, bottom: 30, left: 50},
      width = svg.attr("width") - margin.left - margin.right,
      height = svg.attr("height") - margin.top - margin.bottom,
      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var foci = [],
    labels = [];


  var parseTime = d3.timeParse("%Y-%m-%d");

  var x = d3.scaleTime().range([0, width]),
      y = d3.scaleLinear().range([height, 0]),
      z = d3.scaleOrdinal(d3.schemeCategory10);

  var line = d3.line()
      .curve(d3.curveBasis)
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.progress); });

  var monthdayformat = d3.timeFormat('%b %e');

  var data = JSON.parse(text)['books'];

  var books = data.map(function(d) {
    return {
      id: d['title'],
      values: d['sessions'].map(function(s) {
        return {
          colour: z(d['title']),
          date: new Date(new Date(s['timestamp']).setHours(0,0,0,0)), 
          progress: s['end_position']};
      })
    };
  })
  // remove books with no sessions
  .filter(function(b) { return b.values.length > 0 });

  mergedarrays = d3.merge(books.map(function(b) {
    return b.values;
  }));

  x.domain(d3.extent(mergedarrays, function(d) { return d.date }));

  y.domain([
    d3.min(books, function(c) { return 0 }),
    d3.max(books, function(c) { return 1 })
  ]);

  z.domain(books.map(function(c) { return c.id; }));

  g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x)
      .ticks(d3.timeMonth.every(1))      
      .tickFormat(d3.timeFormat("%B"))
    )
    .selectAll(".tick text")
      .style("text-anchor", "start")
      .attr("x", 6)
      .attr("y", 6);

    g.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(y))
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("fill", "#000")
      .text("Progress");

    var book = g.selectAll(".book")
      .data(books)
    .enter().append("g")
      .attr("class", "book")

    book.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return z(d.id); });

    var texts = [];
    var bboxes = [];
    book.append("text")
      .attr("transform", function(d) {
        // anchor is last data point
        anchor = d.values[d.values.length-1];
        tr = "translate(" + x(anchor.date) + "," + y(anchor.progress) + ")";
        return tr;
      })
      .attr("dx", ".35em")
      .attr("dy", ".35em")
      .attr("text-anchor", "start")
      .style("fill", function(d) { return z(d.id); })
      .text(function(d) { 
        label = d.id;
        last = d.values[d.values.length-1];
        if (last.progress == 1.0) label += " (finished " + monthdayformat(last.date) + ")";
        texts.push(this);
        return label; 
      })
      .each(function() {
        // get original translate values and width values
        transform = d3.select(this).attr('transform');
        translate = transform.substring(transform.indexOf("(")+1, transform.indexOf(")")).split(",");
        translate = [parseFloat(translate[0]), parseFloat(translate[1])]
        bbox = this.getBBox();

        // determine whether the text extends beyond the svg width
        edge = translate[0] + bbox.width;
        var xoffset = 0;
        if (edge > width) {
          xoffset = bbox.width + 12;
        };

        var finalbbox = {
          "x": translate[0]-xoffset,
          "y": translate[1],
          "width": bbox.width,
          "height": bbox.height
        }

        var yoffset = 0;
        // look for overlap with previously positioned texts
        bboxes.forEach(function(b){
          if (overlaps(b, finalbbox, yoffset)) {
            yoffset = yoffset + b.height + 2;
          }
        });

        // set transform to new x,y values
        d3.select(this).attr('transform', function(d){
          return "translate(" + (translate[0]-xoffset) + "," + (translate[1]+yoffset) + ")";
        })
        // insert into bboxes, ordering by y descending
        bboxeslength = bboxes.length;
        for (var i = 0; i < bboxes.length; i++) {
          if (finalbbox.y <= bboxes[i].y) {
            bboxes.splice(i, 0, finalbbox);
            break;
          }
        } 
        if (bboxes.length == bboxeslength)
          bboxes.push(finalbbox);           
      });

    book.selectAll(".point")
      // returns array of points
      .data(function(d) { return d.values; })
    .enter().append("circle")
      .attr("class", "point")
      .attr("r", 4.5)
      .attr("cx", function(d) { return x(d.date); })
      .attr("cy", function(d) { return y(d.progress); })
      .style("fill", function(d) {
        if (d.progress == 1.0) 
          return "white"
        else
          return d.colour; 
      })
      .style("stroke", function(d) {
        if (d.progress == 1.0) 
          return "black"
        else
          return d.colour; 
      });

}
