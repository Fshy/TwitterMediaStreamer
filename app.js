const dotenv = require('dotenv').config()
const argv   = require('minimist')(process.argv.slice(2))
const colors = require('ansicolors')
const Twit   = require('twit')

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
  console.log(colors.brightGreen(`> Authenticated API Credentials`))
  console.log(colors.brightMagenta(`* Target User: ${data[0].name} (@${data[0].screen_name})`))
  console.log(colors.brightMagenta(`* Target User ID: ${data[0].id_str}`))
  let tweetStream = T.stream('statuses/filter', {follow:data[0].id_str})

  tweetStream.on('connect', function (request) {
    console.log(colors.brightBlue(`> Attempting to Connect to Stream`))
  })

  tweetStream.on('connected', function (response) {
    console.log(colors.brightGreen(`> Connected to Stream`))
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
      if (mediaArr[i].type==='photo')
        console.log(`${colors.brightYellow('* IMG')}: ${mediaArr[i].media_url}:orig`)
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
      }
    }
  })
})