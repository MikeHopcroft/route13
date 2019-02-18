const chalk = require('chalk');
import * as fs from 'fs';
import * as JSONStream from 'jsonstream';
const replace = require('stream-replace');

const infile = '../airport-data/itinerary.json';
const outfile = '../airport-data/itinerary-formatted.json';
// const text = fs.readFileSync(infile, 'utf8');
// console.log(`text.length = ${text.length}`);
// console.log(`"${text.slice(9900, 10000)}"`);
// const json = JSON.parse(text);
// const formatted = JSON.stringify(json, null, 4);
// // console.log(formatted);
// fs.writeFileSync(outfile, formatted);
// console.log('finished');

// When we read in the Array, we want to emit a "data" event for every item in
// the serialized record-set. As such, we are going to use the path "*".
const transformStream = JSONStream.parse("*");
const inputStream = fs.createReadStream(infile);

interface Job {
    quantity: number;
    destination: string;
}

const flights: { [id: string]: Job[] } = {};

// Once we pipe the input stream into the TRANSFORM stream, the parser will
// start working it's magic. We can bind to the "data" event to handle each
// top-level item as it is parsed.
inputStream
    .pipe(replace(/\bNaN\b/g, "null"))
    
    .pipe(transformStream)

    // Each "data" event will emit one item in our record-set.
    .on(
        "data",
        function handleRecord( data: any ) {
            // console.log( chalk.red( "Record (event):" ), data );
            const inFlight = data.Inbound.Flight_Code;
            console.log(inFlight);
            if (data.Outbound) {
                const job = {
                    quantity: data.NumBags,
                    destination: data.Outbound.Flight_Code
                };

                if (flights[inFlight]) {
                    flights[inFlight].push(job);
                }
                else {
                    flights[inFlight] = [job];
                }
            }
        }
    )

    // Once the JSONStream has parsed all the input, let's indicate done.
    .on(
        "end",
        function handleEnd() {

            console.log( "- - - - - - - - - - - - - - - - - - - - - - -" );
            console.log( chalk.green( "JSONStream parsing complete!" ) );

        }
    );

    console.log('done');