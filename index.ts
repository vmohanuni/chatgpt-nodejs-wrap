require('dotenv').config();
import { ChatGPTAPIBrowser } from 'chatgpt'
const express = require('express')
const app = express()
const port = 3000

// use puppeteer to bypass cloudflare (headful because of captchas)
const api = new ChatGPTAPIBrowser({
    email: process.env.OPENAI_EMAIL,
    password: process.env.OPENAI_PASSWORD,
    isGoogleLogin: true
})

var lastResult = null;
var inProgress = false;

app.get('/init', async (req, res) => {
  console.log("On Init");
  await api.initSession();
  res.send("Initalized");
})

app.get('/setup', async (req, res) => {
  let prompt = req.query.prompt + "Please keep the response to one sentence.";
  console.log("On Setup : " + prompt);
  try {
      lastResult = await api.sendMessage( prompt );
    } catch(error){
      console.log("Did not setup");
  }

  console.log("Setup finished");
  res.send("Setup started");
});

app.get('/prompt', async (req, res) => {
  if (inProgress) {
    console.log ("Ignoring prompt due to ongoing request : " + req.query.prompt )
    res.send(""); //because of rate limiting, we can only handle one process at a time
    return;
  }

  inProgress = true;

  let prompt = req.query.prompt + ". Please keep the response to one sentence.";
  console.log("User Prompt : " + prompt);
  var result = null;
  try {
    if (lastResult) {
      result = await api.sendMessage( prompt ,  {
        conversationId: lastResult.conversationId,
        parentMessageId: lastResult.messageId
      });
    } else {
        result = await api.sendMessage( prompt );
    }
  } catch (error) {
      console.log(error);
      return new Promise(resolve => setTimeout(resolve, 1000)); //api throttling
      res.send("Sorry, the API is rate limited. Please try again.");
      return;
  }


  lastResult = result;
  inProgress = false;
  console.log("ChatGPT Response : " + result.response);
  res.send(result.response);
})

app.get('/close', async (req, res) => {
  console.log("On Close");
  await api.closeSession();
  lastResult = null;
  res.send("Closed");
})


app.listen(port, async () => {
  await api.initSession();
  console.log(`Chat GPT listening on ${port}`)
})

