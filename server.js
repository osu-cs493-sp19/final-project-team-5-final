const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const api = require('./api');
const app = express();
const port = process.env.PORT || 8000;
const { connectToDB } = require('./lib/mongo');
const { 
  rateLimit
    } = require('./lib/redis');

app.use(rateLimit);

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/', api);

app.use('*', (err, req, res, next) => {
    console.error(err);
    res.status(500).send({
        error: "Internal server error. Try again later."
    });
});

app.use('*', (req, res, next) => {
    res.status(404).json({
        error: "Requested resource does not exists for: " + req.method + " " + req.originalUrl
    });
});

connectToDB(() => {
    app.listen(port, () => {
        console.log("== Server is running on port", port);
    });
});

// launch mongo shell:
// docker run --rm -it --network final-project-team-5-final_default mongo:latest mongo --host mongodb --username tarpaulin --password hunter2 --authenticationDatabase tarpaulin
