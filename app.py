import datetime as dt
import numpy as np
import pandas as pd
import json

from flask import (
    Flask,
    render_template,
    jsonify,
    request,
    url_for,
    redirect,
    make_response)

#################################################
# Flask Setup
#################################################
app = Flask(__name__)

#################################################
# Database Setup
#################################################
from flask_sqlalchemy import SQLAlchemy
# The database URI

# Create database tables
#@app.before_first_request
#def setup():
    # Reflect the database

    
    
#################################################
# Flask Routes
#################################################
@app.route('/')
def index():
    """Return the dashboard homepage."""
    #sample_names = getSampleNames()
    return render_template('index.html')#, sample_names=sample_names)
@app.route('/names')
def getSampleNames():
    """List of sample names.

    Returns a list of sample names in the format
    [
        "BB_940",
        "BB_941",
        "BB_943",
        "BB_944",
        "BB_945",
        "BB_946",
        "BB_947",
        ...
    ]

    """
    sample_names = samples.c.keys()
    sample_names[0] = 'select sample'
    return make_response(json.dumps(sample_names))
@app.route('/otu')
def getOtuDesc():
    """List of OTU descriptions.

    Returns a list of OTU descriptions in the following format

    [
        "Archaea;Euryarchaeota;Halobacteria;Halobacteriales;Halobacteriaceae;Halococcus",
        "Archaea;Euryarchaeota;Halobacteria;Halobacteriales;Halobacteriaceae;Halococcus",
        "Bacteria",
        "Bacteria",
        "Bacteria",
        ...
    ]
    """
    return make_response(json.dumps(otuDesc))
@app.route('/metadata/<sample>')
def getMetadataSample(sample):
    """MetaData for a given sample.

    Args: Sample in the format: `BB_940`

    Returns a json dictionary of sample metadata in the format

    {
        AGE: 24,
        BBTYPE: "I",
        ETHNICITY: "Caucasian",
        GENDER: "F",
        LOCATION: "Beaufort/NC",
        SAMPLEID: 940
    }
    """

    res = db.session.query(samples_metadata).filter(samples_metadata.c.SAMPLEID==sample[3:])
    value = []
    for result in res:
        value.append(result)
    return jsonify(AGE=value[0][4],
        BBTYPE=value[0][6],
        ETHNICITY=value[0][2],
        GENDER=value[0][3],
        LOCATION= value[0][7],
        SAMPLEID=value[0][0])
@app.route('/wfreq/<sample>')
def getWfreq(sample):
    """Weekly Washing Frequency as a number.

    Args: Sample in the format: `BB_940`

    Returns an integer value for the weekly washing frequency `WFREQ`
    """
    results = db.session.query(samples_metadata.c.WFREQ) \
                        .filter(samples_metadata.c.SAMPLEID==sample[3:]).all()
    result = [res[0] for res  in results]
    return make_response(json.dumps(result))
@app.route('/samples/<sample>')
def getOtuId_Samples(sample):
    """OTU IDs and Sample Values for a given sample.

    Sort your Pandas DataFrame (OTU ID and Sample Value)
    in Descending Order by Sample Value

    Return a list of dictionaries containing sorted lists  for `otu_ids`
    and `sample_values`

    [
        {
            otu_ids: [
                1166,
                2858,
                481,
                ...
            ],
            sample_values: [
                163,
                126,
                113,
                ...
            ]
        }
    ]
    """
    #create dataframes from tables (samples and otu)
    samplesDF =pd.read_sql_table('samples', db.session.bind)
    otuDF =pd.read_sql_table('otu', db.session.bind)
    DF = pd.merge(samplesDF, otuDF, on='otu_id')
    #get top 10
    global otuDesc
    tempDF = DF.sort_values(by=sample, ascending=False).head(10)
    otu_ids = [int(x) for x  in tempDF['otu_id'].values]
    sample_values = [int(x) for x  in tempDF[sample].values]
    otuDesc = list(tempDF['lowest_taxonomic_unit_found'].values)

    return make_response(json.dumps([{'otu_ids': otu_ids, 'sample_values': sample_values}]))


if __name__ == '__main__':
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///DataSets/belly_button_biodiversity.sqlite"

    db = SQLAlchemy(app)

    db.metadata.reflect(db.engine)
    #create tables
    samples = db.metadata.tables['samples']
    otu = db.metadata.tables['otu']
    samples_metadata = db.metadata.tables['samples_metadata']

    #app.run(debug=True)
    app.run()
