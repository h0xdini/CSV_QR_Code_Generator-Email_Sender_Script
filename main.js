const nodemailer = require('nodemailer')
const smtpTransport = require('nodemailer-smtp-transport')
let QRCode = require('qrcode')
const csvParser = require("csv-parser")
const fs = require('fs')

let acceptedEmails = []

const extractEmails = () => {
    const tmp = []

    fs.createReadStream('./appliants.csv')
        .pipe(csvParser())
        .on('data', (data) => tmp.push(data.email))
        .on('end', () => {
            acceptedEmails = tmp
            start()
        })
}

extractEmails()

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport(smtpTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
            user: 'email',
            pass: 'tmp_pwd'
        }
    }))

    const message = {
        from: `no-reply `,
        to: options.email,
        subject: "Email Subject!",
        html: `<h3 style="color: '#500050'">An email body</h3>`,
        attachments: [{
            filename: 'QR_code.png',
            path: options.url,
        }]
    }

    await transporter.sendMail(message)
}

const send = async(email, url) => {
    try {
        await sendEmail({
            email,
            url
        })

        fs.readFile('data.json', (err, data) => {
            if (err) {
                console.error(err)
                return
            }
        
            let jsonData = JSON.parse(data)

            const filteredItems = jsonData.map(item => item.email)

            if (!filteredItems.includes(email)) {
                jsonData.push({
                    email,
                    qrCode: url
                })
            }
        
            fs.writeFile('data.json', JSON.stringify(jsonData), (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
            })
        })

        console.log('Sent successfully!')
    } catch(error) {
        console.log(error)
    }
}

const generateQrCode = async() => {
    acceptedEmails.map(item => {
        QRCode.toDataURL(item, async function (err, url) {
            await send(item, url)
        })
    })
}

const start = async() => {
    await generateQrCode()
}