// https://github.com/sendgrid/sendgrid-nodejs/tree/master/packages/mail

const sendGrid = require('@sendgrid/mail')

const from = process.env.MESSAGE_FROM_ADDRESS
const support = process.env.MESSAGE_SUPPORT
const limit = process.env.MAX_ARRAY_LENGTH
sendGrid.setApiKey(process.env.SEND_GRID_API_KEY)


const userCreated = (email, user, id) => {

    const body = `<strong>Thank you for joining our Service!</strong><br>\
    To finish registration, we just need you to confirm that you indeed received this email.<br>\
    To confirm, please click the link below:<br><br>\
    <a href="http://localhost:3000/users/${id}/confirm"><strong>/Confirm</strong></a><br>
    `

    const subject = `Welcome User, ${user} Please confirm`

    var msg = {
        to: email,
        from,
        subject,
        html: body,  
    }
    // debugging
    console.log({date: new Date(Date.now()), sendGrid: msg.subject, action: 'confirm account'})
    // sendGrid.send(msg)
} 

const userJsonWebToken = (email, jwt, user) => {

    const body = `<strong>Good going!</strong><br>\
    A (JWT) has been allocated to your account.<br>\
    ${jwt}<br>\
    Important Note: we limit ${limit} per account of which every login will auto-generate a brand new token and possibly override existing.<br>\
    Any questions, contact ${support}.<br><br>\
    <a href="http://localhost:3000/users/login"><strong>/Login</strong></a><br>
    `

    const subject = `Account Token, ${user} Web Token Created`

    var msg = {
        to: email,
        from,
        subject,
        html: body,  
    }
    // debugging
    console.log({date: new Date(Date.now()), sendGrid: msg.subject, action: 'notification'})
    // sendGrid.send(msg)   
}

const userJWTExpiring = (email, user) => {

    const body = `<strong>Look out!</strong><br>\
    A (JWT) used by your account is about to expire.<br>\
    If you require a renewal, please click on the link below:<br><br>\
    <a href="http://localhost:3000/users/login"><strong>/Login</strong></a><br>
    `

    const subject = `Account Token, ${user} About to expire`

    var msg = {
        to: email,
        from,
        subject,
        html: body,  
    }
    // debugging
    console.log({date: new Date(Date.now()), sendGrid: msg.subject, action: 'notification'})
    // sendGrid.send(msg)   
}

const userReset = (email, user, id) => {

    const body = `<strong>We noticed you have failed to login!</strong><br>\
    A random password will be provided.<br>\
    To confirm, please click on the link below:<br><br>\
    <a href="http://localhost:3000/users/${id}/reset"><strong>/Reset</strong></a><br>
    `

    const subject = `Account Locked, ${user}`

    var msg = {
        to: email,
        from,
        subject,
        html: body,  
    }
    // debugging
    console.log({date: new Date(Date.now()), sendGrid: msg.subject, action: 'reset'})
    // sendGrid.send(msg)
}

const userModified = (email, user, id) => {

    const body = `<strong>We noticed your account was modified!</strong><br>\
    To confirm this was you, please click on the link below:<br><br>\
    <a href="http://localhost:3000/users/${id}/confirm?userModified=true"><strong>/Confirm</strong></a><br>
    `

    const subject = `Account Modified, ${user} Please confirm`

    var msg = {
        to: email,
        from,
        subject,
        html: body,  
    }
    // debugging
    console.log({date: new Date(Date.now()), sendGrid: msg.subject, action: 'confirm changes'})
    // sendGrid.send(msg)
}

const addressTrueCount = (email, address, userId, addressId, count) => {

    const body = `<strong>We noticed your IP Address is invisible!</strong><br>\
    If you wish to keep this allocated to your account and not released back into the wild, please click on the link below:<br><br>\
    <a href="http://localhost:3000/configs/ports/suggest?conf=${userId}\:${count}\:${addressId}&port=n"><strong>/Configure</strong></a><br>
    `

    const subject = `Information: This address is invisible, ${address}, Days inactive ${count}`

    var msg = {
        to: email,
        from,
        subject,
        html: body,  
    }
    // debugging
    console.log({date: new Date(Date.now()), sendGrid: msg.subject, action: 'config required'})
    // sendGrid.send(msg)
}

const addressTrueCountWarn = (email, owner, address, userId, addressId, count, fp) => {

    const body = `<strong>We noticed your IP Address is invisible!</strong><br>\
    If you wish to keep this allocated to your account and not released back into the wild, please click on the link or alternatively contact the network address administrator:<br><br>\
    <a href="http://localhost:3000/configs/ports/suggest?conf=${userId}\:${count}\:${addressId}&port=n"><strong>/Configure</strong></a><br>
    `
    const dDay = fp - count
    const subject = `Warning: This address is invisible, ${address}, Removal in ${dDay} days`
    
    if (email !== owner){
        var msg = {
            to: email,
            cc: owner,
            from,
            subject,
            html: body
        }
    }else {
        var msg = {
            to: email,
            from,
            subject,
            html: body
        }
    }

    // debugging
    console.log({date: new Date(Date.now()), sendGrid: msg.subject, action: 'config required'})
    // sendGrid.send(msg)
}

module.exports = {
    userCreated,
    userJsonWebToken,
    userJWTExpiring,
    userReset,
    userModified, 
    addressTrueCount,
    addressTrueCountWarn
}