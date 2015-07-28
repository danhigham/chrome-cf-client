(function () {
  'use strict';

  angular.module('d3.directives')
  .directive('waitSpinner', ['d3', '$rootScope', function(d3, $rootScope) {
    return {
      restrict: 'EA',
      scope: {
        width:  "@",
        height: "@",
      },
      link: function(scope, iElement, iAttrs) {

        var radius = Math.min(scope.width, scope.height) / 2;
        var tau = 2 * Math.PI;

        var arc = d3.svg.arc()
            .innerRadius(radius*0.4)
            .outerRadius(radius*0.6)
            .startAngle(0);

        var elem = d3.select(iElement[0]);

        var svg = elem.append("svg")
            .attr("width", scope.width)
            .attr("height", scope.height);

        var g = svg.append("g")
            .attr("transform", "translate(" + scope.width / 2 + "," + scope.height / 2 + ")");

        var background = g.append("path")
            .datum({endAngle: 0.33*tau})
            .style("fill", "#4D4D4D")
            .attr("d", arc)
            .call(spin, 750);

        $rootScope.$on('page-busy', function(event, next ) {
          elem.style("display", "block");
        });

        $rootScope.$on('page-loaded', function(event, next ) {
          elem.style("display", "none");
        });

        function spin(selection, duration) {
            svg.style("top", window.scrollY + ((window.innerHeight - parseInt(scope.height)) / 2))

            selection.transition()
                .ease("linear")
                .duration(duration)
                .attrTween("transform", function() {
                    return d3.interpolateString("rotate(0)", "rotate(360)");
                });

            setTimeout(function() { spin(selection, duration); }, duration);
        }

        function transitionFunction(path) {
            path.transition()
                .duration(7500)
                .attrTween("stroke-dasharray", tweenDash)
                .each("end", function() { d3.select(this).call(transition); });
        }
      }
    }
  }])
  .directive('spaceDonut', ['d3', '$rootScope', '$state', function(d3, $rootScope, $state) {
    return {
      restrict: 'EA',
      scope: {
        space: "@",
        width:  "@",
        height: "@",
        data:   "="
      },
      link: function(scope, iElement, iAttrs) {
        var width = 450,
            height = 450,
            radius = Math.min(width, height) / 2.1;

        var color = d3.scale.ordinal()
            .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

        // var color = d3.scale.category10();

        var arc = d3.svg.arc()
            .outerRadius(radius - 10)
            .innerRadius(radius - 100);

        var zoomArc = d3.svg.arc()
            .outerRadius(radius)
            .innerRadius(radius - 110);

        var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) { return d.memory * d.instances; });

        var svg = d3.select(iElement[0]).append("svg")
            .attr("width", "100%")
            .attr("height", height)
          .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        scaleSVG();

        addSpaceLabel();

        var data = pie(scope.data);

        var g = svg.selectAll(".arc")
          .data(data)
          .enter().append("g")
          .attr("d", arc)
          .attr("class", "arc")
          .on("mouseover", function (){
            var d = d3.select(this);
            d.select("path").attr("d", zoomArc);
            drawUsage(d);
          })
          .on("mouseout", function (){
            var d = d3.select(this);
            d.select("path").attr("d" , arc);
            addSpaceLabel();
          });

        g.append("path")
          .attr("class", "space-donut-app")
          .attr("d", arc)
          .style("fill", function(d) { return color(d.data.name); })
          .on("click", function() {
            var d = d3.select(this);
            console.log (d);
            var guid = d[0][0].__data__.data.guid
            $state.go('app.application', {id: guid});
          });

        // svg.selectAll("text.app-label").data(data)
        // .enter()
        // .append("text")
        // .attr("class", "app-label")
        // .attr("text-anchor", "middle")
        // .attr("x", function(d) {
        //     var a = d.startAngle + (d.endAngle - d.startAngle)/2 - Math.PI/2;
        //     d.cx = Math.cos(a) * (radius - 40);
        //     return d.x = Math.cos(a) * (radius + 60);
        // })
        // .attr("y", function(d) {
        //     var a = d.startAngle + (d.endAngle - d.startAngle)/2 - Math.PI/2;
        //     d.cy = Math.sin(a) * (radius - 40);
        //     return d.y = Math.sin(a) * (radius + 20);
        // })
        // .text(function(d) { return d.data.name; })
        // .each(function(d) {
        //   var bbox = this.getBBox();
        //   d.sx = d.x - bbox.width/2 - 2;
        //   d.ox = d.x + bbox.width/2 + 2;
        //   d.sy = d.oy = d.y + 5;
        // });
        //
        // svg.append("defs").append("marker")
        //   .attr("id", "circ")
        //   .attr("markerWidth", 6)
        //   .attr("markerHeight", 6)
        //   .attr("refX", 3)
        //   .attr("refY", 3)
        //   .append("circle")
        //   .attr("cx", 3)
        //   .attr("cy", 3)
        //   .attr("r", 3);
        //
        // svg.selectAll("path.pointer").data(data).enter()
        //   .append("path")
        //   .attr("class", "pointer")
        //   .style("fill", "none")
        //   .style("stroke", "black")
        //   .attr("marker-end", "url(#circ)")
        //   .attr("d", function(d) {
        //       if(d.cx > d.ox) {
        //           return "M" + d.sx + "," + d.sy + "L" + d.ox + "," + d.oy + " " + d.cx + "," + d.cy;
        //       } else {
        //           return "M" + d.ox + "," + d.oy + "L" + d.sx + "," + d.sy + " " + d.cx + "," + d.cy;
        //       }
        //   });

        scope.$watch(function(){
            return angular.element(window)[0].innerWidth;
          }, function(){
            return scaleSVG();
          }
        );

        // on window resize, re-render d3 canvas
        window.onresize = function() {
          return scope.$apply();
        };

        function scaleSVG() {

          var containerWidth = d3.select(iElement[0])[0][0].offsetWidth;
          var scale = containerWidth / width;

          d3.select("svg").attr("height", height * scale);

          svg.attr("transform", "scale(" + scale + "," + scale + ") translate(" + width / 2 + "," + height / 2 + ") ")
        }

        function addSpaceLabel() {
          svg.selectAll(".usage-arc").remove();
          svg.selectAll(".app-info").remove();

          svg.append("text")
            .text(scope.space)
            .attr("class", "space-label")
            .attr("transform", "translate(0,5)");
        }

        function addAppInfo(app) {

          svg.selectAll(".app-info").remove();

          var label = svg.append("g")
            .attr("class", "app-info")
            .attr("transform", "translate(0,-10)");

          label.append("text")
            .text(app.name)
            .attr("class", "app-name");

          label.append("text")
            .text(app.instances + " x " + app.memory + "M")
            .attr("class", "app-size")
            .attr("transform", "translate(0,20)");

          label.append("text")
            .text(app.state)
            .attr("class", "app-state")
            .attr("transform", "translate(0,40)");;

        }

        function drawUsage(d) {
          // draw app info
          var app = d[0][0].__data__.data;

          svg.selectAll(".space-label").remove();

          addAppInfo(app);

          // draw memory arc
          var usageArc = d3.svg.arc()
              .outerRadius(radius - 100)
              .innerRadius(radius - 120);

          var usagePie = d3.layout.pie()
              .sort(null)
              .value(function(d) { return d.value; });

          var usagePieData = usagePie([
            {
              metric: 'free',
              value: _.reduce(app.stats, function(memo, s){ return memo + (s.stats.mem_quota - s.stats.usage.mem); }, 0)
            },
            {
              metric: 'used',
              value: _.reduce(app.stats, function(memo, s){ return memo + s.stats.usage.mem; }, 0)
            }
          ]);

          svg.selectAll(".usage-arc").remove();

          var usageG = svg.selectAll(".usage-arc")
            .data(usagePieData)
            .enter().insert("g", ":first-child")
            .attr("d", usageArc)
            .attr("class", "usage-arc")
            .attr("transform", "scale(-1,1)")

          usageG.append("path")
            .attr("d", usageArc)
            .style("fill", function(d) { return d.data.metric == "used" ? "#f00" : "rgba(0,0,0,0.0)"; });

        }
      }
    }
  }])
  .directive('cpuChart', ['d3', function(d3) {
    return {
      restrict: 'EA',
      scope: {
        metricFilter:  "@",
        metricDivisor: "@",
        yAxisLabel:    "@",
        data:          "=",
        label:         "@",
        onClick:       "&"
      },
      link: function(scope, iElement, iAttrs) {

        var svg = d3.select(iElement[0])
            .append("svg")
            .attr("width", "100%");

        var svgMain;

        var data = scope.data;

        var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S +0000").parse;

        var margin = {top: 20, right: 80, bottom: 30, left: 80},
            width,
            height = 350 - margin.top - margin.bottom;

        var x;

        var y = d3.scale.linear()
            .range([height, 0]);

        var color = d3.scale.category10();

        var xAxis;

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var line = d3.svg.line()
            .interpolate("basis")
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y(d.metric); });

        scope.$watch('data', function(newVals, oldVals) {
          return scope.tick(newVals);
        }, true);

        scope.$watch(function(){
            return angular.element(window)[0].innerWidth;
          }, function(){
            return scope.render(scope.data);
          }
        );

        // on window resize, re-render d3 canvas
        window.onresize = function() {
          return scope.$apply();
        };

        scope.render = function(data) {

          svg.selectAll("*").remove();

          width = d3.select(iElement[0])[0][0].offsetWidth - margin.left - margin.right,

          x = d3.time.scale()
            .range([0, width]);

          xAxis = d3.svg.axis()
              .scale(x)
              .orient("bottom");

          svgMain = svg.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          scope.tick(data);

        }

        scope.tick = function(data) {

          svgMain.selectAll("*").remove();

          color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));

          var metrics = color.domain().map(function(name) {
            return {
              name: name,
              values: data.map(function(d) {
                return {date: d.date, metric: (+d[name] / parseFloat(scope.metricDivisor)) };
              })
            };
          });

          metrics = _.reject(metrics, function(metric){ return metric.name.indexOf(scope.metricFilter) == -1; });

          x.domain(d3.extent(data, function(d) { return d.date; }));

          y.domain([
            d3.min(metrics, function(c) { return d3.min(c.values, function(v) { return v.metric; }); }),
            d3.max(metrics, function(c) { return d3.max(c.values, function(v) { return v.metric; }); })
          ]);

          svgMain.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis);

          svgMain.append("g")
              .attr("class", "y axis")
              .call(yAxis)
            .append("text")
              .attr("transform", "rotate(-90)")
              .attr("y", 6)
              .attr("dy", ".71em")
              .style("text-anchor", "end")
              .text(scope.yAxisLabel);

          svgMain.selectAll("line.horizontalGrid").data(y.ticks(4)).enter()
          .append("line")
          .attr(
          {
              "class":"horizontalGrid",
              "x1" : 0,
              "x2" : width,
              "y1" : function(d){ return y(d);},
              "y2" : function(d){ return y(d);},
              "fill" : "none",
              "shape-rendering" : "crispEdges",
              "stroke-width" : "1px"
          });

          svgMain.selectAll("line.verticalGrid").data(x.ticks(8)).enter()
          .append("line")
          .attr(
          {
              "class":"verticalGrid",
              "x1" : function(d){ return x(d);},
              "x2" : function(d){ return x(d);},
              "y1" : 0,
              "y2" : height,
              "fill" : "none",
              "shape-rendering" : "crispEdges",
              "stroke-width" : "1px"
          });


          var metric = svgMain.selectAll(".metric")
              .data(metrics)
            .enter().append("g")
              .attr("class", "metric");

          metric.append("path")
              .attr("class", "line")
              .attr("d", function(d) { return line(d.values); })
              .style("stroke", function(d) { return color(d.name); });

          metric.append("text")
            .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
            .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.metric) + ")"; })
            .attr("x", 3)
            .attr("dy", ".35em")
            .text(function(d) { return d.name; });

        };

        scope.render(scope.data);

      }
    };
  }]);

}());
