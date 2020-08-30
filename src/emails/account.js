const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: "nandavikas858@gmail.com",
        subject: "Thanks for joining us!",
        text: `Welcome to the app, ${name}! Let me know how you get along with the app.`
    })
}

const sendRemovalEmail = (email, name) => {
    console.log('In removal ')
    sgMail.send({
        to: email,
        from: "nandavikas858@gmail.com",
        subject: "GoodBye",
        text: `Hey ${name}! We're feeling bad that you didn't like our service. While you leave us, please let us know what went wrong with our services and what all can be improved`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendRemovalEmail
}