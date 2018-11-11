/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
var https = require('https');

function httpGet(options) {
  return new Promise(((resolve, reject) => {

    const request = https.request(options, (response) => {
      response.setEncoding('utf8');
      let returnData = '';

      if (response.statusCode < 200 || response.statusCode >= 300) {
        console.log(response.statusCode + " " + response.req.getHeader('host') + " " + response.req.path);
        return reject(new Error(`${response.statusCode}: ${response.req.getHeader('host')} ${response.req.path}`));
      }

      response.on('data', (chunk) => {
        returnData += chunk;
      });

      response.on('end', () => {
        resolve(returnData); //JSON.parse(returnData));
      });

      response.on('error', (error) => {
        reject(error);
      });
    });
    
    request.on('error', function (error) {
      reject(error);
    });
    
    request.end();
  }));
}

const GetNewFactHandler = {
  canHandle(handlerInput) {
    console.log('A');
    const request = handlerInput.requestEnvelope.request;
    console.log('B');
    return request.type === 'LaunchRequest'
      || (request.type === 'IntentRequest'
        && request.intent.name === 'GetNewFactIntent');
  },
  handle(handlerInput) {
    var options = {
      host: 'transloc-api-1-2.p.mashape.com',
      port: 443,
      //testing with tigers path: '/arrival-estimates.json?agencies=84',
      path: '/arrival-estimates.json?agencies=52&stops=4192954', //the real deal
      method: 'GET',
      headers: {
      'X-Mashape-Key': 'gQ8jMOp9BlmshvaqV2OEIvPZurdtp1PwcvXjsnRMDCRzAE1bjl',
      'Accept': 'application/json',
      }
    };
    console.log('Made Call');
    return new Promise((resolve, reject) => {
     httpGet(options).then((response) => {
       console.log('SUCCESS ' + response);
       var jsonObject = JSON.parse(response);
       
       var statementstring = "Let's See... ";
       var cardstring = "Upcoming: \n";
       if (jsonObject.data.length === 0){
          statementstring = statementstring + "Wa, wa, wa, nothing seems to be coming right now.";
          cardstring = cardstring + "none :/";
       }
       else{
         //LATER TODO: Check not null
          for (var i in jsonObject.data) {
            var shuttletype = "Shuttle";
            cardstring = cardstring + " " + shuttletype + " @ "+ jsonObject.data[i].arrivals[0].arrival_at.substring(11,16);
            statementstring = statementstring + 
            "Using a " + jsonObject.data[i].arrivals[0].type + " estimate " + 
            "there's a " + shuttletype + " arriving at " + jsonObject.data[i].arrivals[0].arrival_at.substring(11,16) + ", ";
          }
        statementstring = statementstring + "and that's it so far.";
       }
       
       resolve(handlerInput.responseBuilder.speak(statementstring).withSimpleCard(SKILL_NAME, cardstring).getResponse());
       //resolve(handlerInput.responseBuilder.speak(jsonObject.generated_on).getResponse());
       //resolve(handlerInput.responseBuilder.speak(response).getResponse());
     }).catch((error) => {
       console.log('Call Error');
        resolve(handlerInput.responseBuilder.speak("The shuttle tracker is currently just a meme. Try again later!")
        .getResponse());
      });
    });
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, an error occurred.')
      .reprompt('Sorry, an error occurred.')
      .getResponse();
  },
};

const SKILL_NAME = 'Harvard Shuttle';
const HELP_MESSAGE = 'Ask me things like, when\'s the next shuttle coming?';
const HELP_REPROMPT = 'Ask me about when the next shuttle is coming!';
const STOP_MESSAGE = 'Have a good one!';

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    GetNewFactHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
