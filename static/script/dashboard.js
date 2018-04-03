window.onload
{
    Plotly.d3.json("/names", function(err, na) {
        if(err){return console.warn(err);}

        var sampleNames = document.getElementById("selDataset");
        
        na.forEach(function(e, i){
            var option = document.createElement("option")
            if(i===0){
                option.defaultSelected=true
            }
            option.value = e;
            option.label = e;
            sampleNames.append(option);
        });
    });
}

function optionChanged(sample_name) {
    if(sample_name!=="select sample"){
        //update MetaData info    
        Plotly.d3.json('/metadata/'+sample_name, function displayMetaData(err, response){ 
            var MetaDataList = document.getElementById("metaDataList");
            var txt = '';
            //update list element
            if (Object.entries(response).length > 0){
                MetaDataList.innerHTML = ""
                for (const item in response){
                    var li = document.createElement("li");
                    txt = item+ ':  ' + response[item];
                    li.innerText = txt;
                    MetaDataList.append(li);
                }    
            }
        });
        //update plots
        d3.queue()
            .defer(d3.request, "/samples/"+sample_name)
            .defer(d3.request, "/otu")
            .defer(d3.request, "/wfreq/"+sample_name)
            .await(analyze);

        function analyze(error, data, desc, wfreq) {
            if(error) { console.log(error); }

            var Data = JSON.parse(data.response);
            var txt = JSON.parse(desc.response);
            if (document.getElementById("pieChart").innerHTML == "")
            {
                var data = [{
                        values: Data[0]["sample_values"],
                        labels: Data[0]["otu_ids"],
                        text: txt,
                        hoverinfo: "label+text+value",
                        textinfo: "percent",
                        type: "pie"
                    }];                
                var layout = {
                        height: 470,
                        width: 400,
                        margin:{l: 50,r: 0,b: 0,t: 0,pad: 0},
                        autosize :false,
                        autoexpand :false,
                        hovermode: "closest",
                        hoverdistance: 0,
        
                    };

                Plotly.newPlot("pieChart", data, layout);
            }
            else {
                var update = {
                        values: [Data[0]["sample_values"]],
                        labels: [Data[0]["otu_ids"]],
                        text: txt,
                        hoverinfo: "label+text+value",
                        textinfo: "percent",
                    }
                Plotly.restyle("pieChart", update, [0]);
            }
            // bubble chart
            if (document.getElementById('bubbleChart').innerHTML == "")
            {
                var trace1 = {
                        x: Data[0]["otu_ids"],
                        y: Data[0]["sample_values"],
                        mode: 'markers',
                        marker: {
                            size: Data[0]["sample_values"],
                            color: Data[0]["otu_ids"],   
                        },
                        text: txt,
                    };

                var data = [trace1];

                var layout = {
                        margin: {t: 20},
                        xaxis: {
                            title: "Otu ID",
                        }
                    };
                Plotly.newPlot("bubbleChart", data, layout);
            }
            else {
                var update = {
                    x: [Data[0]["otu_ids"]],
                    y: [Data[0]["sample_values"]],
                    "marker.size": [Data[0]["sample_values"]],
                    "marker.color": [Data[0]["otu_ids"]],
                    text: txt,  
                }
                Plotly.restyle("bubbleChart", update, [0]);
            }
            //gauge chart
            var level = JSON.parse(wfreq.response);

            // Trig to calc meter point
            var degrees = 180 - (level * 20),
                radius = .5;
            var radians = degrees * Math.PI / 180;
            var x = radius * Math.cos(radians);
            var y = radius * Math.sin(radians);

            // Path: may have to change to create a better triangle
            var mainPath = 'M -.05 -0.05 L .05 0.05 L ' //'M -.015 -0.015 L .015 0.015 L ',
                pathX = String(x),
                space = ' ',
                pathY = String(y),
                pathEnd = ' Z';
            var path = mainPath.concat(pathX,space,pathY,pathEnd);

            var data = [{ type: 'scatter',
                x: [0], y:[0],
                    marker: {size: 28, color:'850000'},
                    showlegend: false,
                    name: 'Wash Freq',
                    text: level,
                    hoverinfo: 'text+name'},
                { values: [1,1,1,1,1,1,1,1,1,9],
                    rotation: 90,
                    text: ['8-9', '7-8', '6-7', '5-6', '4-5', '3-4', '2-3', '1-2','0-1',''],
                    textinfo: 'text',
                    textposition:'inside',
                    //marker: {colors:['rgba(14, 127, 0, .5)','rgba(210, 216, 182, .5)','rgba(167, 196, 141, .5)', 
                    //                    'rgba(110, 154, 22, .5)','rgba(170, 202, 42, .5)', 'rgba(202, 209, 95, .5)',
                    //                    'rgba(210, 206, 145, .5)','rgba(232, 226, 202, .5)','rgba(255, 255, 255, 0)']},
                    marker: {colors:['rgba(14, 127, 0, .5)','rgba(110, 154, 22, .5)','rgba(153, 186, 111, .5)','rgba(167, 196, 141, .5)', 
                                        'rgba(170, 202, 42, .5)', 'rgba(202, 209, 95, .5)','rgba(210, 216, 182, .5)',
                                        'rgba(210, 206, 145, .5)','rgba(232, 226, 202, .5)','rgba(255, 255, 255, 0)']},                                        
                    labels: ['8-9', '7-8', '6-7', '5-6', '4-5', '3-4', '2-3', '1-2','0-1',],
                    hoverinfo: 'label',
                    hole: .5,
                    type: 'pie',
                    showlegend: false
                }];

            var layout = {
            shapes:[{
                    type: 'path',
                    path: path,
                    fillcolor: '850000',
                    line: {
                        color: '850000'
                    }
                }],
            title: '<b><br>Belly Button Washing Frequency</b> <br> Scrubs per Week',
            height: 475,
            width: 500,
            xaxis: {zeroline:false, showticklabels:false,
                        showgrid: false, range: [-1, 1]},
            yaxis: {zeroline:false, showticklabels:false,
                        showgrid: false, range: [-1, 1]},
            margin: {t: 75,b: 0, pad: 0},
            };

            Plotly.newPlot('gauge', data, layout);
        };
    }
}
