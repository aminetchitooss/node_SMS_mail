const nodeMailer = require('nodemailer');
const xoauth2 = require('xoauth2');
const bodyParser = require('body-parser');
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const Joi = require('@hapi/joi');
var cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 3000
const app = express();


// View engine setup
app.engine('handlebars', exphbs({
    defaultLayout: '',
}));
app.set('view engine', 'handlebars');

// Static folder
app.use('/public', express.static(path.join(__dirname, 'public')));


//middle ware config
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

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
    },
    tls: {
        rejectUnauthorized: false
    }
});


app.get('/', (req, res) => {
    res.render('contact');
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
app.post('/sendText', (req, res) => {

})

app.post('/sendMailForm', async (req, res) => {
    const { error } = validateMailDataForm(req.body)
    if (error) {
        res.render('contact');
        res.end(JSON.stringify(error.details[0].message))
        // alert(error.details[0].message)
    }

    // setup email data with unicode symbols
    let mailOptions = {
        from: process.env.MAIL,
        to: req.body.email, // list of receivers
        subject: 'Node Contact Request', // Subject line
        text: 'Hello from Form', // plain text body
        html: req.body.message // html body
    };

    // send mail with defined transport object
    // transporter.sendMail(mailOptions, (error, info) => {
    //     if (error) {
    //         return console.log(error);
    //     }
    //     res.end('ok')
    //     res.render('sent', { msg: 'Email has been sent' });
    // });
    const response = await sendMail(mailOptions)
    //  res.end(JSON.stringify(response))
     return res.render('sent', { msg: 'Email has been sent' });
});

function sendMail(pMail, pForm) {
    return new Promise((resolve, reject) => {
        transporter.sendMail(pMail, (err, info) => {
            if (err) {
                resolve(err)
            } else {
                console.log('Message sent: %s', info.messageId);
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
function validateMailDataForm(pData) {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        message: Joi.string().required()
    })
    return schema.validate(pData)
}