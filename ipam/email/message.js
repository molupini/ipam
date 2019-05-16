// https://github.com/sendgrid/sendgrid-nodejs/tree/master/packages/mail

const sendgrid = require('@sendgrid/mail')

sendgrid.setApiKey(process.env.SEND_GRID_API_KEY)

const confirmUser = (email, id) => {

    const body = `<strong>Thank you for joining our Service!</strong><br><br>\
    To finish signing up, we just need to confirm that you got this email.<br><br>\
    To confirm, please click this link:<br><br>\
    <a href="http://localhost:3000/users/${id}/confirm"><strong>/Login</strong></a><br>
    `

    const subject = `Confirm User, our Service ${id}`

    var msg = {
        to: email,
        from: 'no-reply@myloft.co.za',
        subject,
        html: body,  
    }

    // sendgrid.send(msg)
} 

const accountRest = (email, user, id) => {

    const body = `<strong>We noticed you have failed to login!</strong><br><br>\
    A random password will be provided.<br><br>\
    To confirm, please click this link:<br><br>\
    <a href="http://localhost:3000/users/${id}/reset"><strong>/Reset</strong></a><br>
    `

    const subject = `Account Locked, ${user}`

    var msg = {
        to: email,
        from: 'no-reply@myloft.co.za',
        subject,
        html: body,  
    }

    // sendgrid.send(msg)
}

module.exports = {
    confirmUser,
    accountRest
}