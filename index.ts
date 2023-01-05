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

app.get('/prompt', async (req, res) => {
  console.log("On Prompt : " + req.query.prompt);
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
  res.send(result.response)
})

app.get('/close', async (req, res) => {
    console.log("On Close");
  await api.closeSession();
  res.send("Closed");
})


app.listen(port, () => {
  console.log(`Chat GPT listening on ${port}`)
})

