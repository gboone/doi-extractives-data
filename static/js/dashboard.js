

var dash_bar_rev_by_commodity = dc.barChart("#dashboard-bar-rev-by-commodity");
//var dash_bar_rev_by_other = dc.barChart("#dashboard-bar-rev-by-other");
var dash_bar_by_rev_source = dc.barChart("#dashboard-bar-rev-source")
var dash_bar_avg_by_rev_source = dc.barChart('#dashboard-bar-avg-by-rev-source');
var dash_bar_avg_by_commodity = dc.barChart('#dashboard-bar-avg-by-commodity');
//var barChartTwo = dc.pieChart("#dashboard-bar-chart-two");
var dashTable   = dc.dataTable("#dashboard-table");
var companyDimension;
var typeDimension;
//var typeDimension;
//d3.csv("https://docs.google.com/spreadsheet/pub?key=0AjPWVMj9wWa6dGw3b1c3ZHRSMW92UTJlNXRLTXZ0RUE&single=true&gid=0&output=csv",function(resource_data){
d3.csv("../static/data/uni_dummySet_apr17.csv",function(resource_data){
    
    resource_data.forEach(function(d){
        d["Revenue"] = clean_monetary_float(d["Revenue"]);
    });

    var ndx = crossfilter(resource_data);


    //Dimensions 
    companyDimension = ndx.dimension(function(d){
        return d["Company Name"];
    });
    typeDimension = ndx.dimension(function(d){
        return d["Commodity"];
    });
    var otherTypeDimension = ndx.dimension(function(d){
        return d["Commodity"];
    })
    var revDimension = ndx.dimension(function(d){
        return d["Revenue Source"];
    })

    //Groups
    var typeDimensionEnergyGroup = typeDimension.group().reduceSum(function(d){
        //var c = d["Commodity"];
       // if (c=="Oil" || c=="Oil & Gas" || c=="Coal" || c=="Gas" || c=="Other Commodities")
            return d["Revenue"];
    });
    // var typeDimensionOtherGroup = otherTypeDimension.group().reduceSum(function(d){
    //     var c = d["Commodity"];
    //     if (c!="Oil" & c!="Oil & Gas" & c!="Coal" & c!="Gas" & c!="Other Commodities" & c!="n/a" & c!="Geothermal"  & c!="Wind")
    //         return d["Revenue"];
    // });

    var revDimensionGroup = revDimension.group().reduceSum(function(d){
        return d["Revenue"]
    });

    var all=ndx.groupAll().reduceSum(function(d){return d["Revenue"];});

    var revDimension_allGroup = revDimension.group().reduce(
            //add
            function(p,v){
                p.name = v["Company Name"];
                p.revenue = v["Revenue"];
                p.type = v["Commodity"]
                p.revenueSource = v["Revenue Source"];
                p.count++;
                p.sum+= v["Revenue"];
                p.average = p.sum/p.count;
                return p;
            },
            //remove
            function(p,v){
                p.name = v["Company Name"];
                p.revenue = v["Revenue"];
                p.type = v["Commodity"]
                p.revenueSource = v["Revenue Source"];
                p.count--;
                p.sum-= v["Revenue"];
                p.average = p.sum/p.count;
                return p;
            },
            //init
            function(p,v){
                return {name : "", revenue : 0, type : "", revenueSource : "", count: 0, sum: 0, average: 0};
            }
        );

    var typeDimension_allGroup = typeDimension.group().reduce(
            //add
            function(p,v){
                p.name = v["Company Name"];
                p.revenue = v["Revenue"];
                p.type = v["Commodity"]
                p.revenueSource = v["Revenue Source"];
                p.count++;
                p.sum+= v["Revenue"];
                p.average = p.sum/p.count;
                return p;
            },
            //remove
            function(p,v){
                p.name = v["Company Name"];
                p.revenue = v["Revenue"];
                p.type = v["Commodity"]
                p.revenueSource = v["Revenue Source"];
                p.count--;
                p.sum-= v["Revenue"];
                p.average = p.sum/p.count;
                return p;
            },
            //init
            function(p,v){
                return {name : "", revenue : 0, type : "", revenueSource : "", count: 0, sum: 0, average: 0};
            }
        );

    //Graphs
    dash_bar_rev_by_commodity
        .width(600).height(400)
        .group(typeDimensionEnergyGroup)
        .dimension(typeDimension)
        .centerBar(false)       
        .elasticY(true)
        .brushOn(false)
        .turnOnControls(true)
        //.x(d3.time.scale().domain([minDate,maxDate]))
        .xUnits(dc.units.ordinal)
        .x(d3.scale.ordinal().domain(["Coal", "Gas", "Oil & Gas", "Oil", "Other Commodities", "Clay", "Geothermal", "Copper", "Gilsonite", "Hardrock", "Oil Shale", "Phosphate", "Sodium", "Potassium", "Wind", "n/a"]))
        .margins({top: 10, right: 10, bottom: 75, left:100})
        .yAxis().tickFormat(function(v){return "$"+ v;});
    dash_bar_rev_by_commodity.on("filtered", function (chart) {
                dc.events.trigger(function () {
                });});

    // dash_bar_rev_by_other
    //     .width(600).height(400)
    //     .group(typeDimensionOtherGroup)
    //     .dimension(otherTypeDimension)
    //     .centerBar(false)       
    //     .elasticY(true)
    //     .brushOn(false)
    //     .renderHorizontalGridLines(true)
    //     //.x(d3.time.scale().domain([minDate,maxDate]))
    //     .xUnits(dc.units.ordinal)
    //     .x(d3.scale.ordinal().domain(["Clay","Copper","Gilsonite","Hardrock","Oil Shale","Phosphate","Sodium",'Potassium']))//.domain(["Coal","Gas","Oil & Gas","Oil"]))
    //     .margins({top: 10, right: 10, bottom: 75, left:100})
    //     .yAxis().tickFormat(function(v){return "$"+ v;});
    // dash_bar_rev_by_other.on("filtered", function (chart) {
    //             dc.events.trigger(function () {
    //             });});

    dash_bar_by_rev_source
        .width(300).height(400)
        .group(revDimensionGroup)
        .dimension(revDimension)
        .centerBar(false)       
        .elasticY(true)
        .brushOn(false)
        .renderHorizontalGridLines(true)
        //.x(d3.time.scale().domain([minDate,maxDate]))
        .xUnits(dc.units.ordinal)
        .x(d3.scale.ordinal())//.domain(["Coal","Gas","Oil & Gas","Oil"]))
        .margins({top: 10, right: 10, bottom: 75, left:100})
        .yAxis().tickFormat(function(v){return "$"+ v;});
    dash_bar_by_rev_source.on("filtered", function (chart) {
                dc.events.trigger(function () {
                });});

    dash_bar_avg_by_rev_source
        .width(300).height(400)
        .group(revDimension_allGroup)
        .dimension(revDimension)
        .centerBar(false)       
        .elasticY(true)
        .brushOn(false)
        .renderHorizontalGridLines(true)
        .valueAccessor(function (p) {
                return p.value.average;
            })
        .xUnits(dc.units.ordinal)
        .x(d3.scale.ordinal())
        .margins({top: 10, right: 10, bottom: 75, left:100})
        .yAxis().tickFormat(function(v){return "$"+ v;});
    dash_bar_avg_by_rev_source.on("filtered", function (chart) {
                dc.events.trigger(function () {
                });});

    dash_bar_avg_by_commodity
        .width(600).height(400)
        .group(typeDimension_allGroup)
        .dimension(typeDimension)
        .centerBar(false)       
        .elasticY(true)
        .brushOn(false)
        .renderHorizontalGridLines(true)
        .valueAccessor(function(p){
            return p.value.average;
        })
        //.x(d3.time.scale().domain([minDate,maxDate]))
        .xUnits(dc.units.ordinal)
        .x(d3.scale.ordinal())
        .margins({top: 10, right: 10, bottom: 75, left:100})
        .yAxis().tickFormat(function(v){return "$"+ v;});
    dash_bar_avg_by_commodity.on("filtered", function (chart) {
                dc.events.trigger(function () {
                });});

    //dash_bar_rev_by_energy.y(d3.scale.sqrt().nice().domain([0.0,7000000000.0]));
    //dash_bar_rev_by_other.y(d3.scale.sqrt().nice().domain([-5000,28000000.0]));

        


    //Table
dashTable.width(800).height(800)
        .dimension(companyDimension)
        .group(function(d){
            return "List of all Selected Companies";
        })
        .size(1774)
        .columns([
                function(d){return d["Company Name"]; },
                function(d){return d["Revenue Source"];},
                function(d){return d["Commodity"];},
                function(d){return "$"+parseFloat(d["Revenue"]).formatMoney(0,'.',',');}
            ])
        .sortBy(function(d){return d["Company Name"]})
        .order(d3.ascending);
dashTable
    .renderlet(function(d){
            d3.select("#totals span").html('$' +all.value().formatMoney(0,'.',','));
        });

    
    dc.renderAll();
    graphCustomizations();
    
    

});

var graphCustomizations = function(){
        d3.selectAll("g.x text")
        .attr("class", "campusLabel")
        .style("text-anchor", "end") 
        .attr("transform", "translate(-10,0)rotate(315)");
    };


