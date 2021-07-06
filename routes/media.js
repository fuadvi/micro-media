const express = require('express');
const router = express.Router();
const isBase64 = require('is-base64');
const base64Img = require('base64-img');
const { Media } = require('../models');
const fs = require('fs');

router.get('/', async(req,res) => {
  const media = await Media.findAll({
    attributes:['id','image']
  });

  const mappedMedia = media.map((m)=>{
    m.image = `${req.get('host')}/${m.image}`
    return m;
  });

  return res.json({
    status:"success",
    data: mappedMedia
  });
});

router.post('/',(req,res)=>{
  const image = req.body.image;

  if (!isBase64(image,{ mimeRequired:true})) {
    return res.status(400).json({status:'error', massage:'invalid base64'})
  }

  base64Img.img(image,'./public/images',Date.now(), async (err,filepath) => {

    if (err) {
      return res.status(400).json({status:'error', massage: err.massage});
    }

    const filename = filepath.split("\\").pop().split("/").pop();

    const media = await Media.create( { image: `images/${filename}` } );

    return res.json({
      status: 'success',
      data:{
        id:media.id,
        image: `${req.get('host')}/images/${filename}`
      }
    });
  })
});

router.delete('/:id', async (red, res) => {
  const id = red.params.id;
  const media = await Media.findByPk(id);

  if (!media) {
    return res.status(404).json({status:'error', massage:'media not found'});
  }

  fs.unlink(`./public/${media.image}`, async (err) => {
    if (err) {
      return res.status(400).json({status:'error',massage:err.massage});
    }
    await media.destroy();

    return res.json({
      status:'success',
      massage:'image deleted'
    });
  })


})

module.exports = router;
