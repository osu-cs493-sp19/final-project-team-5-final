const router = require('express').Router();

const { getDownloadStreamByFilename } = require('../models/assignment');

router.get('/:filename', (req, res, next) => {
    getDownloadStreamByFilename(req.params.filename)
      .pipe(res)
      .on('error', (err) => {
        if (err.code === 'ENOENT') {
          next();
        } else {
          next(err);
        }
      })
      .on('file', (file) => {
        res.status(200).type(file.metadata.contentType);
      });
});

module.exports = router;