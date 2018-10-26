const dotenv  = require('dotenv').config()
const argv    = require('minimist')(process.argv.slice(2))
const fs      = require('fs')
const path    = require('path')
const mkdirp  = require('mkdirp')
const colors  = require('ansicolors')
const request = require('request')
const Twit    = require('twit')

// Pass user as command-line arguments
let user
for (var i = 0; i < argv._.length; i++)
  if (argv._[i].startsWith('@')){
    user = argv._[i].replace('@','')
    break
  }
if (!user) return console.log(colors.brightRed(`> ERROR: Specify a user via command-line argument to begin streaming\n> e.g. node app.js @jack`))

let T = new Twit({
  consumer_key:       process.env.CONSUMER_KEY,
  consumer_secret:    process.env.CONSUMER_SECRET,
  access_token:       process.env.ACCESS_TOKEN,
  access_token_secret:process.env.ACCESS_TOKEN_SECRET,
  timeout_ms:         60*1000,
})
T.get('users/lookup', {screen_name: `${user}`},  function (e, data, res) {
  if (e) return console.log(e.message)
  let screenName = data[0].screen_name
  console.log(colors.brightGreen(`> Authenticated API Credentials`))
  console.log(colors.brightMagenta(`* Target User: ${data[0].name} (@${screenName})`))
  console.log(colors.brightMagenta(`* Target User ID: ${data[0].id_str}`))
  let tweetStream = T.stream('statuses/filter', {follow:data[0].id_str})

  T.get('statuses/user_timeline', {
    user_id:data[0].id_str,
    count: 200,
    exclude_replies: false,
    include_rts: true
  }, function (err, data) {
    for (let i = 0; i < data.length; i++) {
      const element = data[i]
      if (element.entities.media) {
        for (let x = 0; x < element.entities.media.length; x++) {
          const media = element.entities.media[x];
           // Twitter Media - Image - Original Size
          if (media.type==='photo'){
            console.log(`${colors.brightYellow('* IMG')}: ${media.media_url}:orig`)
            let filename = media.media_url.split('/').pop()
            request(`${media.media_url}:orig`)
              .pipe(fs.createWriteStream(path.join(__dirname,'media',screenName,filename)))
              .on('close', () => {
                console.log(colors.brightGreen(`> Saved to '${path.join(__dirname,'media',screenName,filename)}'`))
              })
              .on('error', (err) => {
                console.log(colors.brightRed(`> ${err}`))
              })
          }
          // Twitter Media - Video - Highest Bitrate MP4
          else if (media.type==='video' || media.type==='animated_gif'){
            let videoArr = media.video_info.variants
            let highestBitrate = {index: -1, value: -1}
            for (var j = 0; j < videoArr.length; j++) {
              if (videoArr[j].content_type==='video/mp4' && videoArr[j].bitrate>highestBitrate.value){
                highestBitrate.index = j
                highestBitrate.value = videoArr[j].bitrate
              }
            }
            console.log(`${colors.brightYellow('* MP4')}: ${videoArr[highestBitrate.index].url}`)
            let filename = (videoArr[highestBitrate.index].url.split('?')[0]).split('/').pop()
            request(videoArr[highestBitrate.index].url)
              .pipe(fs.createWriteStream(path.join(__dirname,'media',screenName,filename)))
              .on('close', () => {
                console.log(colors.brightGreen(`> Saved to '${path.join(__dirname,'media',screenName,filename)}'`))
              })
              .on('error', (err) => {
                console.log(colors.brightRed(`> ${err}`))
              })
          }
        }
      } 
    }
  })

  tweetStream.on('connect', function (request) {
    console.log(colors.brightBlue(`> Attempting to Connect to Stream`))
  })

  tweetStream.on('connected', function (response) {
    console.log(colors.brightGreen(`> Connected to Stream`))
    mkdirp(`media/${screenName}`, function (err) {
      if (err) return console.log(colors.brightRed(`> ${err}`))
      console.log(colors.brightGreen(`> Download directory initialized at './media/${screenName}'`))
    })
  })

  tweetStream.on('disconnect', function (message) {
    console.log(colors.brightRed(`> Disconnected from Stream : ${message}`))
  })

  tweetStream.on('error', function (err) {
    console.log(colors.brightRed(`> ERROR ${err.code}: ${err.message}`))
  })

  tweetStream.on('tweet', function (tweet) {
    if (!tweet.extended_entities) return
    if (tweet.extended_entities.media && tweet.extended_entities.media.length<1) return
    let mediaArr = tweet.extended_entities.media
    for (var i = 0; i < mediaArr.length; i++) {
      // Twitter Media - Image - Original Size
      if (mediaArr[i].type==='photo'){
        console.log(`${colors.brightYellow('* IMG')}: ${mediaArr[i].media_url}:orig`)
        let filename = (mediaArr[i].media_url.split('?')[0]).split('/').pop()
        request(`${mediaArr[i].media_url}:orig`)
          .pipe(fs.createWriteStream(path.join(__dirname,'media',screenName,filename)))
          .on('close', () => {
            console.log(colors.brightGreen(`> Saved to '${path.join(__dirname,'media',screenName,filename)}'`))
          })
          .on('error', (err) => {
            console.log(colors.brightRed(`> ${err}`))
          })
      }
      // Twitter Media - Video - Highest Bitrate MP4
      else if (mediaArr[i].type==='video' || mediaArr[i].type==='animated_gif'){
        let videoArr = mediaArr[i].video_info.variants
        let highestBitrate = {index: -1, value: -1}
        for (var j = 0; j < videoArr.length; j++) {
          if (videoArr[j].content_type==='video/mp4' && videoArr[j].bitrate>highestBitrate.value){
            highestBitrate.index = j
            highestBitrate.value = videoArr[j].bitrate
          }
        }
        console.log(`${colors.brightYellow('* MP4')}: ${videoArr[highestBitrate.index].url}`)
        let filename = videoArr[highestBitrate.index].url.split('/').pop()
        request(videoArr[highestBitrate.index].url)
          .pipe(fs.createWriteStream(path.join(__dirname,'media',screenName,filename)))
          .on('close', () => {
            console.log(colors.brightGreen(`> Saved to '${path.join(__dirname,'media',screenName,filename)}'`))
          })
          .on('error', (err) => {
            console.log(colors.brightRed(`> ${err}`))
          })
      }
    }
  })
})
