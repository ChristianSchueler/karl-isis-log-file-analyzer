import { once } from 'node:events';
import * as fs from 'fs';
import * as readline from 'readline';
import { writeFile } from 'fs/promises';

//const inFile = 'logs/console-2023-12-14.log';
//const outFile = 'logs/cocktails-2023-12-14.csv';
let inFile = "";
let outFile = "";

let args = process.argv.slice(2);

if (args[0]) inFile = args[0];
if (args[1]) outFile = args[1];

if (inFile.length == 0 || outFile.length == 0) {
    console.log("args: infile outfile");
    process.exit(1);
}

const rl = readline.createInterface({
    input: fs.createReadStream(inFile),
    crlfDelay: Infinity
});

const regexLogLine = /(\d{2}:\d{2}:\d{2}\.\d{3}) \- (.*)/
const regexLogLineIngredients = /(\d{2}:\d{2}:\d{2}\.\d{3}) \- Ingredients: ([0-9.]+) ([0-9.]+) ([0-9.]+) ([0-9.]+) ([0-9.]+) ([0-9.]+) ([0-9.]+) ([0-9.]+) ([0-9.]+) ([0-9.]+) ([0-9.]+) ([0-9.]+)/
const regexLogLineRecipe = /(\d{2}:\d{2}:\d{2}\.\d{3}) \- (?<name>.+): (?<recipe>.+)/

let buffer=[];

let cocktails = [];
let dataCSV = "time;name;vodka;gin;rum;blue curacao;ananas juice;cherry juice;orange juice;bitter lemon;tonic water;herbal lemonade;bitter orange sirup;soda;recipe\n";

const debug = false;

console.log("reading from", inFile);

rl.on('line', (line) => {

    buffer[0] = buffer[1];
    buffer[1] = buffer[2];
    buffer[2] = line;
    //console.log(`Line from file: ${line}`);

    //const regex = /\d{2}-\d{2}-\d{2}\.\d{3}/g
    //const regex = /[A-Z]/g;
    //const found = paragraph.match(regex);

    let result = line.match(regexLogLineIngredients);
    if (result) {

        if (debug) console.table(result);
        
        let time = result[1];
        //let ingredients = result[2].split(" ");     // array of amounts

        if (debug) console.log(buffer[0]);
        let result2 = buffer[0].match(regexLogLineRecipe);

        if (result2 == null) {
            result2 = {
                groups: {
                    name: "random cocktail",
                    recipe: "---"
                }
            }
        }

        if (debug) console.table(result2);

        console.log("recipe found:", result2.groups.name, result2.groups.recipe);

        let cocktail = {
            time: time,
            name: result2.groups.name, 
            ingredients: result.splice(2, 13).map((x) => { return x.replace(".", ",")}),
            recipe: result2.groups.recipe
        };

        cocktails.push(cocktail);
        
        // "time,name,ingredients as string,vodka,gin,rum,blue curacao,ananas juice,cherry juice,orange juice,bitter lemon,tonic water,herbal lemonade,bitter orange sirup,soda";
        dataCSV += `${cocktail.time};${cocktail.name};${cocktail.ingredients[0]};${cocktail.ingredients[1]};${cocktail.ingredients[2]};${cocktail.ingredients[3]};${cocktail.ingredients[4]};${cocktail.ingredients[5]};${cocktail.ingredients[6]};${cocktail.ingredients[7]};${cocktail.ingredients[8]};${cocktail.ingredients[9]};${cocktail.ingredients[10]};${cocktail.ingredients[11]};${cocktail.recipe}\n`;

        //let msg = result[2];

        //console.log(msg);
    }
});

await once(rl, 'close');

console.log(cocktails.length, "cocktails found");

// finally, write csv content to a file using Node's fs module
writeFile(outFile, dataCSV, 'utf8')
  .then(() => {
    console.log("output written to", outFile);
  })
  .catch((error) => {

  })

/*
21:32:46.416 - Caribbean Sunset: 3.5 cl rum, 4.0 cl ananas juice, 3.0 cl orange juice, 2.5 cl bitter orange sirup
21:32:46.422 - Starting dispensing recipe 'Caribbean Sunset'...
21:32:46.428 - Ingredients: 0 0 3.5 0 4 0 3 0 0 0 2.5 0
21:32:46.434 - Drink size: 13
21:32:46.442 - Dispensing 3.5 cl of rum over 19.3 s...
21:32:46.445 - Dispensing 4 cl of ananas juice over 22.0 s...
21:32:46.448 - Dispensing 3 cl of orange juice over 16.5 s...
21:32:46.451 - Dispensing 2.5 cl of bitter orange sirup over 13.8 s...
21:33:00.220 - Dispensing bitter orange sirup finished.
21:33:02.971 - Dispensing orange juice finished.
21:33:05.724 - Dispensing rum finished.
21:33:08.476 - Dispensing ananas juice finished.
21:33:08.482 - Recipe 'Caribbean Sunset' dispensed.
21:33:08.489 - Dispensing finished.
21:44:29.026 - OpenAICocktailBot creating random cocktail...
21:44:29.034 - Normalizing drink...
21:44:29.040 - Drink enlarged to 2
21:44:29.048 - Drink normalized
21:44:29.053 - random cocktail: 4.0 cl herbal lemonade, 6.0 cl soda
21:44:29.059 - Starting dispensing recipe 'random cocktail'...
21:44:29.065 - Ingredients: 0 0 0 0 0 0 0 0 0 4 0 6
21:44:29.070 - Drink size: 10
*/