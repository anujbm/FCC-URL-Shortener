require('dotenv').config();
const express = require('express');
var bodyParser = require('body-parser');
const cors = require('cors');

const { Model } = require('mongoose');
const mongoose = require('mongoose');
try{
  if(mongoose.connect(process.env.MONGO_URI)){
    console.log("successfully connected to the mongodb")
  }

}catch (e){
  console.log(e)
}

const Schema = mongoose.Schema;

const urlSchema = new Schema({
  short_url: {type: String, required: true, unique:true},
  original_url: {type: String, required: true, unique: true }
});

const URL = mongoose.model("URL",urlSchema);

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());


app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req, res)=>{
  const original_url = addhttp(req.body.url);
  var urls = {};
  if(isValidUrl(original_url)){
      var document_count = await URL.countDocuments({'original_url':original_url});
      if(document_count){
        var url = await URL.findOne({'original_url': original_url}).exec()
        urls ={
          'original_url': url.original_url,
          'short_url' : url.short_url
        }
      }else{
        var short_url = generateString(6)

        while(await duplicate_short_url(short_url)){
          short_url = generateString(6)
        }
        

        var url = new URL({'original_url':original_url, 'short_url': short_url})
        await url.save();
        urls = {'original_url': url.original_url, "short_url":url.short_url};
      }
  }else {
    urls={
      'error' : 'invalid url'
    }
  }
  res.json(urls)
});

app.get('/api/shorturl/:short_url', async (req, res) =>{
  const short_url = req.params.short_url;
  var document_count = await URL.countDocuments({'short_url':short_url});
  if(document_count){
    var url = await URL.findOne({'short_url': short_url}).exec()
    return res.redirect(301,url.original_url);
  }else{
    res.json({'error':'invalid short code'})
  }
})


let isValidUrl =(userInput)=> {
  let res = userInput.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
  if(res == null){
    console.log('invalid url tested')
    return false;
  }
  else{
    console.log('valid url tested')
    return true;
  }
}
// res.redirect('/user');
let duplicate_short_url = async (short_url)=>{
  result =false;
  var document_count = await URL.countDocuments({'short_url':short_url});
  if(document_count){
    result =true
  }else{
    result= false
  }
  return result
}
function addhttp(url) {
  if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
      url = "http://" + url;
  }
  return url;
}
const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateString(length) {
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
