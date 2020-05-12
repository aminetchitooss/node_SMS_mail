const nodeMailer = require('nodemailer');
const xoauth2 = require('xoauth2');
const bodyParser = require('body-parser');
const express = require('express');
const Joi = require('@hapi/joi');
var cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 3000
const app = express();

//middle ware config
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const allowedOrigins = ['http://localhost:3000'
    // ,'http://localhost:' + port
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

app.listen(port, () => console.log('server running on' + port))

const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL,
        pass: process.env.PASS,
        // xoauth2: xoauth2.createXOAuth2Generator({
        //     user: process.env.MAIL,
        //     clientId: process.env.CLIENT_ID,
        //     clientSecret: process.env.CLIENT_SECRET,
        //     refreshToken: process.env.REFRESH_TOKEN,
        //     // accessToken: process.env.ACCESS_TOKEN
        // })
    }
});


app.get('/', (req, res) => {
    res.end('hello')
})
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
app.post('/sendText', (req, res) => {

})

function sendMail(pMail) {
    return new Promise((resolve, reject) => {
        transporter.sendMail(pMail, (err, info) => {
            if (err) {
                resolve(err)
            } else {
                resolve(info.response)
            }
        });
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