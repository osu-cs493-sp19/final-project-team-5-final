const redis = require('redis');
const redisPort = process.env.REDIS_PORT || 6379;
const redisHost = process.env.REDIS_HOST;
const redisClient = redis.createClient(redisPort, redisHost);

const rateLimitWindowMillis = 60000;
const rateLimitWindowMaxRequests = 5;

const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const api = require('./api');
const app = express();
const port = process.env.PORT || 8000;
const { connectToDB } = require('./lib/mongo');

function getTokenBucket(ip) {
  return new Promise((resolve, reject) => {
    redisClient.hgetall(ip, (err, tokenBucket) => {
      if (err) {
        reject(err);
      } else {
        if (tokenBucket) {
          tokenBucket.tokens = parseFloat(tokenBucket.tokens);
        } else {
          tokenBucket = {
            tokens: rateLimitWindowMaxRequests,
            last: Date.now()
          };
        }
        resolve(tokenBucket);
      }
    });
  });
}

function saveTokenBucket(ip, tokenBucket) {
  return new Promise((resolve, reject) => {
    redisClient.hmset(ip, tokenBucket, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function rateLimit(req, res, next) {
  try {
    const tokenBucket = await getTokenBucket(req.ip);

    const timestamp = Date.now();
    const ellapsedMillis = timestamp - tokenBucket.last;
    const refreshRate = rateLimitWindowMaxRequests / rateLimitWindowMillis;
    tokenBucket.tokens += refreshRate * ellapsedMillis;
    tokenBucket.tokens = Math.min(rateLimitWindowMaxRequests, tokenBucket.tokens);
    tokenBucket.last = timestamp;

    if (tokenBucket.tokens >= 1) {
      tokenBucket.tokens -= 1;
      saveTokenBucket(req.ip, tokenBucket);
      next();
    } else {
      saveTokenBucket(req.ip, tokenBucket);
      res.status(429).send({
        error: "Too many requests per minute"
      });
    }

  } catch (err) {
    console.error(err);
    next();
  }
}

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
        error: "Requested method: " + req.method + "for: " + req.originalUrl + " does not exist"
    });
});

connectToDB(() => {
    app.listen(port, () => {
        console.log("== Server is running on port", port);
    });
});

// launch mongo shell:
// docker run --rm -it --network final-project-team-5-final_default mongo:latest mongo --host mongodb --username tarpaulin --password hunter2 --authenticationDatabase tarpaulin
