const nodeMailer = require('nodemailer');
const bodyParser = require('body-parser');
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const Joi = require('@hapi/joi');
var cors = require('cors');
var fetch = require('fetch').fetchUrl;
require('dotenv').config();
const port = process.env.PORT || 3000
const accountSsId = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const client = require('twilio')(accountSsId, authToken)

const app = express();

// View engine setup
app.engine('handlebars', exphbs({
    defaultLayout: '',
}));
app.set('view engine', 'handlebars');

// Static folder
app.use('/public', express.static(path.join(__dirname, 'public')));


//middle ware config
// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json())
const allowedOrigins = [
    'https://tchitosmailer.herokuapp.com'
    , 'http://localhost:' + port
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

app.listen(port, () => console.log('server running on ' + port))

const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL,
        pass: process.env.PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});


app.get('/', async (req, res) => {
    const { ip } = await getIp()
    res.render('contact', { ip });
});

app.post('/sendMail', async (req, res) => {
    const { error } = validateMailData(req.body)
    if (error) { return res.status(403).send(error.details[0].message) }

    const mailOutput = {
        from: process.env.MAIL,
        to: req.body.to,
        subject: req.body.subject ? req.body.subject : "Hello ✔",
        html: req.body.body
    }
    const response = await sendMail(mailOutput)
    res.end(JSON.stringify(response))
})

app.post('/sendText', async (req, res) => {

    //simple protection so that nobody uses the API
    // (it's a shortcut) still a token is the best way to go
    if (req.body.cipher !== process.env.TWILIO_CIPHER)
        return res.status(403).send('cipher error')

    const { error } = validateTextData(req.body)
    if (error) { return res.status(403).send(error.details[0].message) }

    const vText = {
        from: process.env.TWILIO_NUMBER,
        to: req.body.to, //process.env.TWILIO_TST_NUMBER (registred numbers only in trial)
        body: req.body.body
    }
    return client.messages.create(vText).then(response => {
        return res.render('sent', { msg: 'Text has been sent' });
    }).catch(err => {
        return res.end(err.message)
    });
})

app.post('/sendMailForm', jsonParser, (req, res) => {
    return res.end(JSON.stringify(req.body))

});

function sendMail(pMail) {
    return new Promise((resolve, reject) => {
        transporter.sendMail(pMail, (err, info) => {
            if (err) {
                resolve(err)
            } else {
                console.log('Message sent: %s', info.messageId);
                resolve("ok")
            }
        });
    });
}

function getIp() {
    return new Promise((resolve, reject) => {
        fetch('https://api.ipify.org/?format=json', (error, meta, body) => {
            resolve(JSON.parse(body.toString()))
        })
    });
}

function validateMailData(pData) {
    const schema = Joi.object({
        to: Joi.string().email().required(),
        subject: Joi.string().required(),
        body: Joi.string().required()
    })
    return schema.validate(pData)
}

function validateMailDataForm(pData) {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        message: Joi.string().required()
    })
    return schema.validate(pData)
}

function validateTextData(pData) {
    const schema = Joi.object({
        cipher: Joi.string(),
        to: Joi.string().regex(/^[+][1-9]{1,3}\d{9}$/).required(),
        body: Joi.string().required()
    })
    return schema.validate(pData)
}