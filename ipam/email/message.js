// https://github.com/sendgrid/sendgrid-nodejs/tree/master/packages/mail

const sendgrid = require('@sendgrid/mail')

sendgrid.setApiKey(process.env.SEND_GRID_API_KEY)

const userCreated = (email, id) => {

    const body = `<strong>Thank you for joining our Service!</strong><br><br>\
    To finish signing up, we just need to confirm that you got this email.<br><br>\
    To confirm, please click this link:<br><br>\
    <a href="http://localhost:3000/users/${id}/confirm"><strong>/Confirm</strong></a><br>
    `

    const subject = `Confirm User, our Service ${id}`

    var msg = {
        to: email,
        from: 'no-reply@myloft.co.za',
        subject,
        html: body,  
    }

    console.log({date: new Date(Date.now()), sendgrid: msg.subject, action: 'confirm account'})
    // sendgrid.send(msg)
} 

const userReset = (email, user, id) => {

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

    console.log({date: new Date(Date.now()), sendgrid: msg.subject, action: 'reset'})
    // sendgrid.send(msg)
}

const userModified = (email, user, id) => {

    const body = `<strong>We noticed your account was modified!</strong><br><br>\
    To confirm this was you, please click this link:<br><br>\
    <a href="http://localhost:3000/users/${id}/confirm?userModified=true"><strong>/Confirm</strong></a><br>
    `

    const subject = `Account Modified, ${user}`

    var msg = {
        to: email,
        from: 'no-reply@myloft.co.za',
        subject,
        html: body,  
    }

    console.log({date: new Date(Date.now()), sendgrid: msg.subject, action: 'confirm changes'})
    // sendgrid.send(msg)
}

const addressTrueCount = (email, address, id, count) => {

    const body = `<strong>We noticed your IP Address is invisible!</strong><br><br>\
    If you wish to keep this allocated to your account and not released back into the wild, please click on the link:<br><br>\
    <a href="http://localhost:3000/globals/ports/${id}/?number=n"><strong>/Configure</strong></a><br>
    `

    const subject = `Your Address is invisible, ${address}, Days inactive ${count}`

    var msg = {
        to: email,
        from: 'no-reply@myloft.co.za',
        subject,
        html: body,  
    }

    console.log({date: new Date(Date.now()), sendgrid: msg.subject, action: 'configure required'})
    // sendgrid.send(msg)
}


module.exports = {
    userCreated,
    userReset,
    userModified, 
    addressTrueCount
}