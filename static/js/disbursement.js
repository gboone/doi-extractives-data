var offshoreYearDim;
var onshoreYearDim;
d3.csv("static/data/disbursement-summary-data.csv",function(disbursement_data){
    var onshoreX = crossfilter(disbursement_data);
    var offshoreX = crossfilter(disbursement_data);

    onshoreYearDim = onshoreX.dimension(function(d){
        return d["Year"]
    });
    onshoreYearDim.filter(function(d) {
        if (d == '2012')
            return true;
    })

    offshoreYearDim = offshoreX.dimension(function(d){
       return d["Year"]
    });

    offshoreYearDim.filter(function(d) {
        if (d == '2012')
            return true;
    });

    var onshoreShoreDim = onshoreX.dimension(function(d) {
        return d["Offshore/Onshore"]
    });

    onshoreShoreDim.filter(function(d) {
        if (d == 'Onshore')
            return true;
    });

    var offshoreShoreDim = offshoreX.dimension(function(d) {
        return d["Offshore/Onshore"]
    });

    offshoreShoreDim.filter(function(d) {
        if (d == 'Offshore')
            return true;
    });

    function get_total(data, data2){
        var r=0.0;
        for(var i = 0; i<data.length; i++)
        {
            r+=parseFloat(data[i]["Total"]);
        }
        for(var i = 0; i<data2.length; i++)
        {
            r+=parseFloat(data2[i]["Total"]);
        }
        return r;
    }

    function order_data(data, key){
       
        return data.sort(function(a,b){
            return parseFloat(b[key])-parseFloat(a[key]);
        });
    }


    var w = 500;
    var h = 500;
    var offshoreBarChart = d3.select("#disbursment_totals_bar > div.offshore_bar").selectAll("div.disbursement_bar")
        .data(order_data(offshoreYearDim.top(Infinity),"Total"))
        .enter()
        .append("div")
        .attr("class", "disbursement_bar")
        .attr("title", function(d){
            return d["Bubble Name"]
        })
        .style("width", function(d){
            return (d["Total"]/get_total(offshoreYearDim.top(Infinity),onshoreYearDim.top(Infinity)))*.94*960+"px";
        })
        .html(function(d){
            return "<p>$"+parseFloat(d["Total"]).formatMoney(0,'.',',')+"</p>";
        });

    var onshoreBarChart = d3.select("#disbursment_totals_bar > div.onshore_bar").selectAll("div.disbursement_bar")
        .data(order_data(onshoreYearDim.top(Infinity), "Total"))
        .enter()
        .append("div")
        .attr("class", "disbursement_bar")
        .attr("title", function(d){
            return d["Bubble Name"]
        })
        .style("width", function(d){
            return (d["Total"]/get_total(offshoreYearDim.top(Infinity),onshoreYearDim.top(Infinity)))*.94*960+"px";
        })
        .html(function(d){
            return "<p>$"+parseFloat(d["Total"]).formatMoney(0,'.',',')+"</p>";
        });


    var offShoreChart = d3.select(".stats-offshore").selectAll("div.disbursement_bubble")
        .data(offshoreYearDim.top(Infinity))
        .enter()
        .append("div")
        .attr("class", "disbursement_bubble statsOffshore")
        .style("height", function(d) {
            //return d["Total"]*.00000005 + "px";
            return restrict_size(d["Total"], .00000005, 50, 300);
        })
        .style("width", function(d) {
            return restrict_size(d["Total"], .00000005, 50, 300);
        })
        .html(function(d) {
            return "<div class='disbursement_bubble_content'>" + d["Bubble Name"] + "</div>" + "<div class='disbursement_bubble_rollover'>Total: $" + parseFloat(d["Total"]).formatMoney(2, '.', ',') + "</div>";
        });

    var onShoreChart = d3.select(".stats-onshore").selectAll("div.disbursement_bubble")
        .data(onshoreShoreDim.top(Infinity))
        .enter()
        .append("div")
        .attr("class", "disbursement_bubble statsOnshore")
        .style("height", function(d) {
            return restrict_size(d["Total"], .00000005, 50, 300);
        })
        .style("width", function(d) {
            return restrict_size(d["Total"], .00000005, 50, 300);
        })
        .html(function(d) {
            return "<div class='disbursement_bubble_content'>" + d["Bubble Name"] + "</div>" + "<div class='disbursement_bubble_rollover'>Total: $" + parseFloat(d["Total"]).formatMoney(2, '.', ',') + "</div>";
        });
    
    var circleTip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "$" + parseFloat(d["Total"]).formatMoney(2, '.', ',');
        });

    function restrict_size(d, s, min, max) {
        var n = d * s;
        n = n * 3;

        if (n > max)
            return max + "px";
        if (n < min)
            return (min + n) + "px";
        return n + "px";
    };

    /*************************
    Setup Year Select Links
    *************************/
    $("#disbursement_year_select a:first").css("font-weight","Bold");
    $("#disbursement_year_select a").click(function(){
        function get_total(data, data2){
            var r=0.0;
            for(var i = 0; i<data.length; i++)
            {
                r+=parseFloat(data[i]["Total"]);
            }
            for(var i = 0; i<data2.length; i++)
            {
                r+=parseFloat(data2[i]["Total"]);
            }
            return r;
        }
        $(this).css("font-weight","Bold");
        $(this).siblings().css("font-weight","Normal");
        var year = $(this).attr('data-year');
        onshoreYearDim.filterAll();
        offshoreYearDim.filterAll();
        onshoreYearDim.filter(function(d){
            if(d == year)
                return d; 
        });
        offshoreYearDim.filter(function(d){
            if(d == year)
                return d;
        });
        var statsOffshore = d3.selectAll(".stats-offshore").selectAll(".disbursement_bubble");
        statsOffshore.data(offshoreYearDim.top(Infinity))
                    .transition()
                    .style("height", function(d) {
                        return restrict_size(d["Total"],.00000005,50,300);
                    })
                    .style("width",function(d){
                        return restrict_size(d["Total"],.00000005,50,300);
                    });
        statsOffshore.html(function(d){
            return "<div class='disbursement_bubble_content'>" + d["Bubble Name"] +"</div>"
                    +"<div class='disbursement_bubble_rollover'>Total: $"+parseFloat(d["Total"]).formatMoney(2,'.',',')+"</div>";
        });
        var statsOnshore = d3.selectAll(".stats-onshore").selectAll(".disbursement_bubble");
        statsOnshore.data(onshoreYearDim.top(Infinity))
            .transition()
            .style("height",function(d){
                return restrict_size(d["Total"],.00000005,50,300);
            })
            .style("width",function(d){
                return restrict_size(d["Total"],.00000005,50,300);
            });
        statsOnshore.html(function(d){
            return "<div class='disbursement_bubble_content'>" + d["Bubble Name"] +"</div>"
                    +"<div class='disbursement_bubble_rollover'>Total: $"+parseFloat(d["Total"]).formatMoney(2,'.',',')+"</div>";
        });

        var offshoreBarChart = d3.select("#disbursment_totals_bar > div.offshore_bar").selectAll("div.disbursement_bar")
            .data(order_data(offshoreYearDim.top(Infinity), "Total"))
            .html(function(d){
                return "<p>$"+parseFloat(d["Total"]).formatMoney(0,'.',',')+"</p>";
            })
            .transition()
            .style("width", function(d){
                return (d["Total"]/get_total(offshoreYearDim.top(Infinity),onshoreYearDim.top(Infinity)))*.94*960+"px";
            });

        var onshoreBarChart = d3.select("#disbursment_totals_bar > div.onshore_bar").selectAll("div.disbursement_bar")
            .data(order_data(onshoreYearDim.top(Infinity), "Total"))
            .html(function(d){
                return "<p>$"+parseFloat(d["Total"]).formatMoney(0,'.',',')+"</p>";
            })
            .transition()
            .style("width", function(d){
                return (d["Total"]/get_total(offshoreYearDim.top(Infinity),onshoreYearDim.top(Infinity)))*.94*960+"px";
            });

    });
    /*************************
    End Year Select link Setup
    *************************/

    //displays the disbursement_bubble_rollover div
    $(".disbursement_bubble").on('mouseover',function(){
        $('div.disbursement_bubble_rollover', this).show();
    });
    //hides the disbursement_bubble_rollover div
    $(".disbursement_bubble").on('mouseout',function(){
        $('div.disbursement_bubble_rollover', this).hide();
    });
    $(".info_bubble").click(function(){
        var dTime = 500; //duration time for the animation
        $(this).siblings(".disbursement_bubble").animate({
            opacity:1.0
        });
        $(this).animate({
            width:0,
            height:0
        },
        {
            duration:dTime,
            complete:function(){
                $(this).hide();
                $(this).children().html("");
            }
        });

    })
    //Click Functionality for the bubble divs
    $(".disbursement_bubble").click(function() {
        var newSize = 500; //new size of circle
        var dTime = 500; //duration time for the animation
        var thisClass = $(this).hasClass('statsOffshore') ? 'statsOffshore' : 'statsOnshore'; //Figures out if the bubble is offshore or onshore
        var thisContentDiv = $('div.disbursement_bubble_content', this); //Gets the content div of the bubble
        var thisRel = typeof($(this).attr('rel')) != 'undefined' ? $(this).attr('rel') : findRel($(this), thisClass, thisContentDiv.html(), where_stats_data); //gets rel attribute of bubble, sets if not found

        //This checks the json object for Img3 to determine which object variables to access.
        //There is probably a better way of doing this.
        var thisDetail = where_stats_data[thisClass][thisRel]['Content'];

        var thisName = where_stats_data[thisClass][thisRel]['Title']; //Get the name of the bubble, IE the text for the content div when the bubble is shrunk

        //setting a special attribute called prevSize so I can reset the bubble to its original side without accessing the data again
        if (!$(this).attr('prevSize'))
            $(this).attr('prevSize', $(this).width());
        $(this).siblings(".info_bubble").hide();
        $(this).siblings(".info_bubble").css("width","0");
        $(this).siblings(".info_bubble").css("height","0")
        $(this).siblings(".info_bubble").children().html("");

        //This is called to shrink all the other bubbles when a different bubble is clicked. So you don't end up with multiple expanded bubbles
        $(this).siblings(".disbursement_bubble").each(function(){
            if ($(this).attr('prevSize'))
            {
               // $(this).css({"position":"relative", "z-index":"1"});
                $('div.disbursement_bubble_content',this).html(where_stats_data[thisClass][$(this).attr('rel')]['Title']);
                $(this).animate(
                {
                    // width: $(this).attr('prevSize'),
                    // height: $(this).attr('prevSize')
                    opacity:1.0
                }, {
                    duration: dTime,
                    complete: function() {

                    }
                })
            }
        })

        //The size isn't exactly the new size because of padding and margin, add some buffer (-10) and grow it to the new size with an animate call
        if ($(this).width() < newSize - 10) //Grow bubble on click
        {
            //$(this).css({"position":"absolute","z-index":"100"});
            $(this).siblings(".info_bubble").show();
            $(this).siblings(".info_bubble").animate({
                width: newSize,
                height: newSize
            });
            $(this).animate(
            {
                // width: newSize,
                // height: newSize,
                opacity:0.0
            }, {
                duration: dTime,
                complete: function() {
                    $(this).siblings("div.info_bubble").children().html(thisDetail) //after the animation is done, insert the new text into the content div
                }
            })
        } else //Shrink clicked bubble 
        {
            //$(this).css({"position":"relative", "z-index":"1"});
            thisContentDiv.html(thisName)
            $(this).animate({
                // width: $(this).attr('prevSize'),
                // height: $(this).attr('prevSize'),
                opacity:1.0
            }, {
                duration: dTime,
                complete: function() {
                    //Placeholder, may want to call another function after the animation has shrunk the bubble
                }
            });
        }
    });

});

/***************************
/Function: findRel
/Description: Finds the array position in the JSON object and sets the elements rel value to that index
***************************/
function findRel(that, thatClass, searchTerm, obj) {
    rel = '';
    for (var i = 0; i < obj[thatClass].length; i++) {

        if (obj[thatClass][i]['Title'] == searchTerm) {
            rel = i;
            i += obj[thatClass].length;
        }

    }
    that.attr('rel', rel);
    return rel;
}

//JSON content
var where_stats_data = {
    //More info on click 
    "statsOffshore": [
        //Remember that the count starts at zero 
        //NOTE: img links are currently hard coded to gh pages site -- fix later -- figure out how to make these relative given that Jekyll won't parse JS files and so can't use {{ site.url }} 
        {
            //Array ID -> 0 
            "Title": "U.S. Treasury",
            "Content": "<div class=\"disbursement_bubble_details\" style=\"padding-top: 20px;\"><h1>U.S. Treasury</h1><p>Some offshore revenue goes into the <a href=\"http://www.gasb.org/cs/ContentServer?pagename=GASB/GASBContent_C/UsersArticlePage&cid=1176156735732\">U.S. General Fund</a>, which is the same place that money from individual and corporate income taxes go. A general fund is a government's basic operating fund and accounts for everything not accounted for in another fund. The U.S. General Fund pays for roughly two-thirds of all federal expenditures, including:</p><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_1397.svg\" alt=\"Dogtags\"><h2>U.S. Military</h2></div><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_13130.svg\" alt=\"Park\"><h2>U.S. Parks</h2></div><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_1567.svg\" alt=\"Book and test tube\"><h2>U.S. Schools</h2></div></div>",
        }, {
            //Array ID -> 1 
            "Title": "States",
            "Content": "<div class=\"disbursement_bubble_details\" style=\"padding-top: 20px;\"><h1>States</h1><p>Offshore revenues go to states in several different ways. If the revenues are from leases the <a href=\"http\://statistics.onrr.gov/PDF/FAQs.pdf\">8(g) region</a>, they go straight to states. If they are in the <a href=\"http\://www.boem.gov/Oil-and-Gas-Energy-Program/Energy-Economics/Revenue-Sharing/Index.aspx\">GOMESA region</a>, some of these funds go directly to 'Coastal Political Subdivions' such as counties and parishes. It is up to the county, parish or state to decide how to use the revenues.</p><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_4572.svg\" alt=\"Offshore oil rig\"><h2><a href=\"http\://statistics.onrr.gov/PDF/FAQs.pdf\">Learn about 8(g) &#8594;</a></h2></div><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_8676.svg\" alt=\"Coast\"><h2><a href=\"http\://www.boem.gov/Oil-and-Gas-Energy-Program/Energy-Economics/Revenue-Sharing/Index.aspx\">Learn about GOMESA &#8594;</a></h2></div></div>",
        }, {
            //Array ID -> 2
            "Title": "Historic Preservation Fund",
            "Content": "<div class=\"disbursement_bubble_details\"><h1>Historic Preservation Fund</h1><p>The <a href=\"http\://www.nps.gov/history/hpg/\">Historic Preservation Fund</a> helps preserve U.S. historical and archaeological sites and cultural heritage through grants to State and Tribal Historic Preservation Offices. Some examples of activities include:</p><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_1566.svg\" alt=\"City buildings\"><h2><a href=\"http\://www.michiganmodern.org/\">Survey Modernist Architecture, Michigan &#8594;</a></h2></div><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_10119.svg\" alt=\"Schoolhouse\"><h2><a href=\"http\://ncptt.nps.gov/blog/tribal-heritage-grants/\">Restore Peoria Schoolhouse, Peoria Tribe of Indians, Oklahoma &#8594;</a></h2></div><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_7038.svg\" alt=\"Video camera\"><h2><a href=\"http\://ncptt.nps.gov/blog/tribal-heritage-grants/\">Document Yup’ik Songs & Dances, Calista Elders Council of Alaska &#8594;</a></h2></div></div>",
        }, {
            //Array ID -> 3
            "Title": "Land &amp; Water Conservation Fund",
            "Content": "<div class=\"disbursement_bubble_details\"><h1>Land &amp; Water Conservation Fund</h1><p>The <a href=\"http\://www.nps.gov/lwcf/\">Land & Water Conservation Fund</a> provides matching grants to states and local governments to buy and develop public outdoor recreation areas. It has supported projects in all 50 states and U.S. territories, creating community parks and trails and protecting clean water sources. Here are a few places that were funded by the LWCF:</p><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_16251.svg\" alt=\"Mountains\"><h2><a href=\"http\://www.emnrd.state.nm.us/SPD/eaglenestlakestatepark.html\">Eagle Nest Lake State Park, New Mexico &#8594;</a></h2></div><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_26235.svg\" alt=\"Playground\"><h2><a href=\"http\://www.mitchellparkdc.org/history.html\">Mitchell Park, District of Columbia &#8594;</a></h2></div><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_25079.svg\" alt=\"Baseball field\"><h2><a href=\"http\://www.ofallon.org/parks/pages/family-sports-park\">Family Sports Park, Illinois &#8594;</a></h2></div></div>",
        }, {
            //Array ID -> 2
            "Title": "Other Funds",
            "Content": "<div class=\"disbursement_bubble_details\" style=\"padding-top: 20px;\"><h1>Other Funds</h1><p>Some revenue from offshore locations returns to the Federal agency that manages the area.</p><div class=\"disbursement_bubble_details_images\"><h2><a href=\"http://www.boem.gov/\">Bureau of Ocean Energy Management &#8594;</a></h2></div><div class=\"disbursement_bubble_details_images\"><h2><a href=\"http://www.bsee.gov/\">Bureau of Safety and Environmental Enforcement &#8594;</a></h2></div></div>",
        },
    ],

    "statsOnshore": [
        //Remember that the count starts at zero 
        //NOTE: img links are currently hard coded to gh pages site -- fix later -- figure out how to make these relative given that Jekyll won't parse JS files and so can't use {{ site.url }} 
        {
            //Array ID -> 0 
            "Title": "States",
            "Content": "<div class=\"disbursement_bubble_details\"><h1>States</h1><p>The state share of onshore revenues mostly go directly to states, with percentages going to several other funds and state entities. For example, some revenue from geothermal resources goes directly to counties; some revenue from Federal land management agencies returns to each; some is used for flood control. It's up to each county and state to decide how to use the revenue.</p><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_2070.svg\" alt=\"Geothermal energy plant\"><h2><a href=\"http://www.blm.gov/wo/st/en/prog/energy/geothermal.html\">Some geothermal energy revenues go directly to counties &#8594;</a></h2></div><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_38222.svg\" alt=\"U.S. States\"><h2><a href=\"http://statistics.onrr.gov/\">Other resource revenues go to states &#8594;</a></h2></div></div>",
        }, {
            //Array ID -> 1 
            "Title": "Reclamation Fund",
            "Content": "<div class=\"disbursement_bubble_details\" style=\"padding-top: 20px;\"><h1>Reclamation Fund</h1><p><a href=\"http://www.nps.gov/nr/travel/ReclamationDamsAndWaterProjects/Mission_of_the_Bureau_of_Reclamation.html\">The Reclamation Fund</a> is a special fund established by the United States Congress under the Reclamation Act of 1902 to pay for Bureau of Reclamation projects. The Bureau of Reclamation is best known for its dams and power plants which provide:</p><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_18711.svg\" alt=\"Farm\"><h2><a href=\"http://www.usbr.gov/facts.html\">Irrigation water for 10 million acres of farmland &#8594;</a></h2></div><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_265.svg\" alt=\"Dam\"><h2><a href=\"http://www.usbr.gov/facts.html\">40 billion kilowatt hours of energy produced from hydroelectric power &#8594;</a></h2></div></div>",
        }, {
            //Array ID -> 2
            "Title": "U.S. Treasury",
            "Content": "<div class=\"disbursement_bubble_details\" style=\"padding-top: 20px;\"><h1>U.S. Treasury</h1><p>Some offshore revenue goes into the <a href=\"http://www.gasb.org/cs/ContentServer?pagename=GASB/GASBContent_C/UsersArticlePage&cid=1176156735732\">U.S. General Fund</a>, which is the same place that money from individual and corporate income taxes go. A general fund is a government's basic operating fund and accounts for everything not accounted for in another fund. The U.S. General Fund pays for roughly two-thirds of all federal expenditures, including:</p><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_1397.svg\" alt=\"Dogtags\"><h2>U.S. Military</h2></div><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_13130.svg\" alt=\"Park\"><h2>U.S. Parks</h2></div><div class=\"disbursement_bubble_details_images\"><img src=\"http://meiqimichelle.github.io/d3-minihack/assets/img/icon_1567.svg\" alt=\"Book and test tube\"><h2>U.S. Schools</h2></div></div>",
        }, {
            //Array ID -> 2
            "Title": "American Indian Tribes",
            "Content": "<div class=\"disbursement_bubble_details\" style=\"padding-top: 20px;\"><h1>American Indian Tribes</h1><p>Information coming soon!</p></div>",
        }, {
            //Array ID -> 2
            "Title": "Other Funds",
            "Content": "<div class=\"disbursement_bubble_details\" style=\"padding-top: 20px;\"><h1>Other Funds</h1><p>Some revenue from onshore locations returns to the Federal agency that manages the land. In addition, $50 million dollars each go to two legislated funds, the <a href=\"http://energy.gov/fe/science-innovation/oil-gas/ultra-deepwater-and-unconventional-natural-gas-and-other-petroleum\">Ultra-Deepwater Research Program</a> and the <a href=\"http://www.bia.gov/WhoWeAre/RegionalOffices/Navajo/What/index.htm\">Mescal Settlement Agreement</a>.</p><div class=\"disbursement_bubble_details_images\"><h2><a href=\"http://www.blm.gov/\">Bureau of Land Management &#8594;</a></h2></div><div class=\"disbursement_bubble_details_images\"><h2><a href=\"http://www.fws.gov/\">U.S. Fish & Wildlife Service &#8594;</a></h2></div><div class=\"disbursement_bubble_details_images\"><h2><a href=\"http://www.fs.fed.us/\">U.S. Forest Service &#8594;</a></h2></div></div>",
        }
    ]
}