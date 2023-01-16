const express = require('express');
const http = require('http')

let app = express();

let server = http.createServer(app);
let config = {
    "PORT" : "3000"
}

app.use(express.static(__dirname));

const s = server.listen(config.PORT, () => {
    console.info(`Server is running on port ${config.PORT}`)
});
