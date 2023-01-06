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

app.get('/init', async (req, res) => {
  console.log("On Init");
  await api.initSession();
  res.send("Initalized");
})

app.get('/setup', async (req, res) => {
  console.log("On Setup : " + req.query.prompt);
  api.sendMessage( req.query.prompt ).then( response => {
    lastResult = response;
  } );

  res.send("Setup started");
})

app.get('/prompt', async (req, res) => {
  console.log("User Prompt : " + req.query.prompt);
  var result = null;
  if (lastResult) {
      result = await api.sendMessage( req.query.prompt ,  {
        conversationId: lastResult.conversationId,
        parentMessageId: lastResult.messageId
    });
  } else {
      result = await api.sendMessage( req.query.prompt );
  }

  lastResult = result;
  console.log("ChatGPT Response : " + result.response);
  res.send(result.response)
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

