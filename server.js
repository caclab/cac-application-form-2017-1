var http = require('http');
var fs = require('fs');
var formidable = require("formidable");
var util = require('util');

var server = http.createServer(function(req, res) {
    if (req.method.toLowerCase() == 'get') {
        if (req.url == '/') {
            displayForm(res);
        }
    } else if (req.method.toLowerCase() == 'post') {
        //processAllFieldsOfTheForm(req, res);
        processFormFieldsIndividual(req, res);
    }
});

function displayForm(res) {
    fs.readFile('form.html', function(err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': data.length
        });
        res.write(data);
        res.end();
    });
}

function processAllFieldsOfTheForm(req, res) {
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
        //Store the data from the fields in your data store.
        //The data store could be a file or database or any other store based
        //on your application.
        res.writeHead(200, {
            'content-type': 'text/plain'
        });
        res.write('received the data:\n\n');
        res.end(util.inspect({
            fields: fields,
            files: files
        }));
    });
}

function processFormFieldsIndividual(req, res) {
    //Store the data from the fields in your data store.
    //The data store could be a file or database or any other store based
    //on your application.
    var fields = [];
    var allData = {};
    var form = new formidable.IncomingForm();
    var newFolder;
    //Call back when each field in the form is parsed.
    form.on('field', function(field, value) {
        //console.log(field);
        if (field == 'name') {
            // fs.mkdirSync(__dirname + /uploads/ + value);
            newFolder = __dirname + '/public/applications/' + value.split(' ').join('_').toLowerCase();
            if (!fs.existsSync(newFolder)) {
                fs.mkdirSync(newFolder);
            } else {
                var d = new Date();
                var n = d.getTime();
                newFolder = newFolder + '_' + n.toString();
                fs.mkdirSync(newFolder);
            }
        }
        //console.log(value);
        fields[field] = value;
        allData = fields;
    });
    //Call back when each file in the form is parsed.
    form.on('file', function(name, file) {
        fields[name] = file;
        var tmpPath = file['path'];

        fs.readFile(tmpPath, function(err, data) {
            var newPath = newFolder + '/' + file['name'].split(' ').join('_').toLowerCase();
            fs.writeFile(newPath, data, function(err) {
                if (err) {
                    console.log("ERROR: " + err);
                } else {
                    console.log("FILE saved to: " + newPath);
                    fs.unlink(tmpPath, function() {
                        console.log("TMP deleted from: " + tmpPath);
                    });
                }
            });
        });

    });

    //Call back for file upload progress.
    form.on('progress', function(bytesReceived, bytesExpected) {
        var progress = {
            type: 'progress',
            bytesReceived: bytesReceived,
            bytesExpected: bytesExpected
        };
        console.log(progress);
        //Logging the progress on console.
        //Depending on your application you can either send the progress to client
        //for some visual feedback or perform some other operation.
    });

    //Call back at the end of the form.
    form.on('end', function() {
        makeHTML(allData, newFolder);
        res.writeHead(200, {
            // 'content-type': 'text/plain'
            'content-type': 'text/html'
        });
        // res.write('received the data:\n\n');
        // res.end(util.inspect({
        //     fields: fields
        // }));
        res.end('<h1>Thank You!</h1>' +
            '<p>Your submission was received. We will contact you soon!</p>');
    });

    form.parse(req);

}

function makeHTML(json, pathToSave) {
    var htmlData = '<!DOCTYPE html>' +
        '<head>' +
        '<link rel="stylesheet" href="https://formden.com/static/cdn/bootstrap-iso.css" />' +
        '</head>' +
        '<body>' +
        '<p class=bootstrap-iso><strong>Name: </strong>' + json["name"] + '</p>' +
        '<p class=bootstrap-iso><strong>Email: </strong>' + json["email"] + '</p>' +
        '<p class=bootstrap-iso><strong>Address: </strong>' + json["address"] + '</p>' +
        '<p class=bootstrap-iso><strong>Telephone: </strong>' + json["telephone"] + '</p>' +
        '<p class=bootstrap-iso><strong>Birth Date: </strong>' + json["birth"] + '</p>' +
        '<p class=bootstrap-iso><strong>Nationality: </strong>' + json["nationality"] + '</p>' +
        '<p class=bootstrap-iso><strong>Website: </strong>' + json["portfolio"] + '</p>' +
        '<p class=bootstrap-iso><strong>Extra Links: </strong>' + json["links"] + '</p>' +
        '<p class=bootstrap-iso><strong>Bio: </strong>' + json["bio"] + '</p>' +
        '<p class=bootstrap-iso><strong>Skills: </strong>' + json["skills"] + '</p>' +
        '<p class=bootstrap-iso><strong>Name of Project: </strong>' + json["pname"] + '</p>' +
        '<p class=bootstrap-iso><strong>Abstract: </strong>' + json["pabstract"] + '</p>' +
        '<p class=bootstrap-iso><strong>Attached CV File: </strong><a href=' + json["cv"]["name"] + '>CV</a></p>' +
        '<p class=bootstrap-iso><strong>Attached Proposal File: </strong><a class=bootstrap-iso href=' + json["proposal"]["name"] + '>PROPOSAL</a></p>' +
        '</body>';

    var fileName = pathToSave + '/index.html';
    var stream = fs.createWriteStream(fileName);

    stream.once('open', function(fd) {
        stream.end(htmlData);
    });
}

var PORT = 3000;
server.listen(PORT);
console.log("server listening on " + PORT);
