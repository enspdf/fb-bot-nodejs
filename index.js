var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');

const APP_TOKEN = 'YOUR_FB_APP_TOKEN';

var app = express();
app.use(bodyParser.json());

app.listen(3000, () => console.log('El servidor se encuentra en el puerto 3000'));

app.get('/', (req, res) => {
    res.send('Bienvenido al taller');
});

app.get('/webhook', (req, res) => {
    if (req.query['hub.verify_token'] === 'test_token_say_hello') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('El token no es valido');
    }
});

app.post('/webhook', (req, res) => {
    var data = req.body;
    if (data.object == 'page') {
        data.entry.forEach((pageEntry) => {
            pageEntry.messaging.forEach((messagingEvent) => {
                if (messagingEvent.message) {
                    receiveMessage(messagingEvent);
                }
            });
        });
        res.sendStatus(200);
    }
});

receiveMessage = (event) => {
    var senderID =  event.sender.id;
    var messageText = event.message.text;

    evaluateMessage(senderID, messageText);
}

evaluateMessage = (recipientId, message) => {
    var finalMessage = '';

    if (isContain(message, 'ayuda')) {
        finalMessage = 'Por el momento no te puedo ayudar';
    } else if (isContain(message, 'gato')) {
        sendMessageImage(recipientId);
    } else if (isContain(message, 'clima')) {
        getWeather((temperature) => {
            message = getMessageWeather(temperature);
            sendMessageText(recipientId, message);
        });
    } else if (isContain(message, 'info')) {
        sendMessageTemplate(recipientId);
    } else {
        finalMessage = 'Solo sé repetir las cosas: ' + message;
    }
    sendMessageText(recipientId, finalMessage);
}

sendMessageText = (recipientId, message) => {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: message
        }
    };
    callSendAPI(messageData);
}

sendMessageImage = (recipientId) => {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "image",
                payload: {
                    url: "http://i.imgur.com/SOFXhd6.jpg"
                }
            }
        }
    };
    callSendAPI(messageData);
}

sendMessageTemplate = (recipientId) => {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [ elementTemplate() ]
                }
            }
        }
    };
    callSendAPI(messageData);
}

elementTemplate = () => {
    return {
        title: "Shackox Manzza",
        subtitle: "CodeWarrior - Developer",
        item_url: "https://www.facebook.com/enspdf",
        image_url: "http://i.imgur.com/SOFXhd6.jpg",
        buttons: [ buttonTemplate() ],
    }
}

buttonTemplate = () => {
    return {
        type: "web_url",
        url: "https://www.facebook.com/enspdf",
        title: "Shackox"
    }
}

callSendAPI = (messageData) => {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: APP_TOKEN
        },
        method: 'POST',
        json: messageData
    }, (err, response, data) => {
        if (err) {
            console.log('No es posible enviar el mensaje' + err);
        } else {
            console.log('El mensaje fue enviado');
        }
    });
}

getMessageWeather = (temperature) => {
    if (temperature > 30)
        return "Nos encontramos a " + temperature + " ºC hace mucho calor para salir"; 
    return "Nos encontramos a " + temperature + " ºC es un bonito día para salir";
}

getWeather = (callback) => {
    request('http://api.geonames.org/findNearByWeatherJSON?lat=6.2359&lng=-75.5751&username=shackox', (error, response, data) => {
        if (!error) {
            response = JSON.parse(data);
            var temperature = response.weatherObservation.temperature;
            callback(temperature);
        }
    });
}

isContain = (sentence, word) => {
    return sentence.indexOf(word) > - 1;
}