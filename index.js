const express = require("express"),
  bodyParser = require("body-parser"),
  app = express().use(bodyParser.json());
const uuidv1 = require("uuid/v1");
const request = require("request");

const apiai = require("apiai");

const apiaiApp = apiai(process.env.APIAI_ACCESS_TOKEN);

const MapAndQuestionService = require("./MapAndQuestionService");

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GOOGLE_MAP_API_KEY = process.env.GOOGLE_MAP_API_KEY;

const APPLE_MAP = {
  attachment: {
    type: "template",
    payload: {
      template_type: "generic",
      elements: {
        element: {
          title: "Your current location",
          image_url:
            "https://maps.googleapis.com/maps/api/staticmap?center=Brooklyn+Bridge,New+York,NY&zoom=13&size=600x300&maptype=roadmap&markers=color:blue%7Clabel:S%7C40.702147,-74.015794&markers=color:green%7Clabel:G%7C40.711614,-74.012318&markers=color:red%7Clabel:C%7C40.718217,-73.998284&key=" +
            GOOGLE_MAP_API_KEY,
          item_url:
            "http://www.google.com/maps/@30.4803952,114.4054483,14z?hl=en"
        }
      }
    }
  }
};

const GOOGLE_MAP_IMAGE = {
  attachment: {
    type: "template",
    payload: {
      template_type: "generic",
      elements: [
        {
          title: "Location Shared By Bot",
          subtitle: "Location Subtitle",
          image_url:
            "https://maps.googleapis.com/maps/api/staticmap?center=Brooklyn+Bridge,New+York,NY&zoom=13&size=600x300&maptype=roadmap&markers=color:blue%7Clabel:S%7C40.702147,-74.015794&markers=color:green%7Clabel:G%7C40.711614,-74.012318&markers=color:red%7Clabel:C%7C40.718217,-73.998284&key=" +
            GOOGLE_MAP_API_KEY
        }
      ]
    }
  }
};

function handleOptin(sender_psid, received_message) {
  // Check if the message contains text
  if (received_message) {
    callSendAPI(sender_psid, {
      text: received_message
    });
  }
}

// Handles messages events
function handleMessage(sender_psid, received_message) {
  // Check if the message contains text
  if (received_message.text) {
    var request = apiaiApp.textRequest(received_message.text, {
      sessionId: uuidv1()
    });

    request.on("response", function(response) {
      callSendAPI(sender_psid, {
        text: response.result.fulfillment.speech
      });
      // MapAndQuestionService.callSendAPI(sender_psid)
    });

    request.on("error", function(error) {
      console.log("error", error);
    });

    request.end();
  }
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid
    },
    message: {
      text: "Hello, my friend, \nplease return a line, \nhhhh \nyouoyouou"
    }
  };

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: "https://graph.facebook.com/v2.6/me/messages",
      qs: {
        access_token: PAGE_ACCESS_TOKEN
      },
      method: "POST",
      json: request_body
    },
    (err, res, body) => {
      console.log(err, res, body);
      if (!err) {
      } else {
      }
    }
  );
}

// Creates the endpoint for our webhook
app.post("/webhook", (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  console.log(JSON.stringify(body));

  // Check the webhook event is from a Page subscription
  if (body.object === "page") {
    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;

      console.log(JSON.stringify(webhook_event));

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      } else if (webhook_event.optin) {
        handleOptin(
          sender_psid,
          "Hi, I just heard from you in " + webhook_event.optin.ref
        );
      }
    });

    // Return a '200 OK' response to all events
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// Adds support for GET requests to our webhook
app.get("/webhook", (req, res) => {
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "XpRZVxhAih3zeT";

  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

app.listen(process.env.PORT || 8080, () => console.log("webhook is listening"));
