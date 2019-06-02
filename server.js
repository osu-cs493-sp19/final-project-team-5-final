const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const api = require('./api');
const app = express();
const port = process.env.PORT || 8000;

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
        error: "Requested method: " + req.method + "for: " + req.originalUrl + " does not exist"
    });
});

//CONNECT TO MYSQL SERVER FROM DOCKER-COMPOSE:
// sudo docker run --rm -it --network final-project-team-5-final_default mysql:5 mysql -h mysql -u tarpaulin -p
// will prompt for mysql password: hunter2

