## TwitterMediaStreamer

Monitors a specified twitter user using the streaming API, and stores their media posts in the highest possible resolution (images) & bitrate (video/mp4).

Downloads are stored in individual directories, with the format `./media/{username}`

### Installation
```shell
$ git clone https://github.com/Fshy/TwitterMediaStreamer
$ cd TwitterMediaStreamer
$ npm install
```

### Usage
```shell
# Rename .env.example to .env and fill developer credentials

# Pass username as command-line argument to start
$ npm start @jack
# or
$ node app.js @jack
# or using a process manager
$ nodemon app.js @jack
$ pm2 start app.js -- @jack
```
