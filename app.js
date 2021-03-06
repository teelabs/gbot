const http  = require('http');
const Koa   = require('koa');
const router = require('koa-router')();
const request = require('request');
const debug   = require('debug')('bot');
const bodyParser = require('koa-body');

const PORT = process.env.PORT || 6500;

const app = new Koa();

const VERIFY_TOKEN = '';
const PAGE_ACCESS_TOKEN = '';

router.get('/webhook', function* verifyHook(next) {
  if(this.query['hub.mode'] === 'subscribe' &&
     this.query['hub.verify_token'] === VERIFY_TOKEN) {
    console.log('Validating Webhook');

    this.body = this.query['hub.challenge'];

  } else {
    this.status = 403;
    this.body = 'Verification failed!';
  }
});


router.post('/webhook', function* receiveMessages(next) {
  let body = this.request.body;

  if(body.object === 'page') {
    for(let entry of body.entry) {
      let pageID = entry.id;
      let timeOfEvent = entry.time;

      for(let event of entry.messaging) {
        if(event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      }
    }

    this.status = 200;
    this.body = '';
  }
});

app.use(bodyParser());

app.use(router.routes());

function receivedMessage(event) {
  let senderID = event.sender.id;
  let recipientID = event.recipient.id;
  let timeOfMessage = event.timestamp;
  let message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
              senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  let messageId = message.mid;

  let messageText = message.text;
  let messageAttachments = message.attachments;

  if(messageText) {
    switch (messageText) {
      case 'Locations':
        sendLocationsMessage(senderID);
      break;

    //default:
      //sendTextMessage(senderID, messageText);
    }
  } else if(messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function sendLocationsMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "Addis Ababa",
            subtitle: "Woreda 02, Sinan Building 2nd Floor, Bole Subcity, Addis Ababa, Ethiopia",
            item_url: "http://gebeya.com/",
            image_url: "https://media.licdn.com/mpr/mpr/shrink_200_200/AAEAAQAAAAAAAAftAAAAJDc1Njg1NmE3LTY0MDMtNGVmOS04YjM2LWIzYWRmZDgwMDU4NA.png",
            buttons: [{
              type: "web_url",
              url: "https://gebeya.com",
              title: "Go to site"
            }],
          }, {
            title: "Nairobi",
            subtitle: "Ground Floor, Riara Corporate Suites, Riara Road, Nairobi, Kenya",
            item_url: "http://gebeya.com",
            image_url: "https://media.licdn.com/mpr/mpr/shrink_200_200/AAEAAQAAAAAAAAftAAAAJDc1Njg1NmE3LTY0MDMtNGVmOS04YjM2LWIzYWRmZDgwMDU4NA.png",
            buttons: [{
              type: "web_url",
              url: "https://gebeya.com",
              title: "Go to site"
            }]
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
                  messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}


server = http.createServer(app.callback());

// Listen on provided port, on all network interfaces
server.listen(PORT);

// Set handler for 'listening' event
server.on('listening', () => {
  let addr = server.address();
  let bind = (typeof PORT === 'string') ? `Pipe ${PORT}` : `Port ${PORT}`;

  debug(`Listening on ${bind}`);

});
