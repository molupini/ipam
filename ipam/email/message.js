// https://github.com/sendgrid/sendgrid-nodejs/tree/master/packages/mail
const sendGrid = require('@sendgrid/mail')
const nodemailer = require('nodemailer')
const moment = require('moment')
const { logger } = require('../src/util/log')
const Messenger = require('../model/messenger')


var getConfig = async (provider) => {
    const conf = await Messenger.findOne({
        provider
    })
    if(conf.token !== null){
        await sendGrid.setApiKey(conf.token)
    }
    return conf 
}

var createUnSecureTransport = async (host = '', port = '587') => {
    let transport = await nodemailer.createTransport({
        host: host,
        port: parseInt(port),
        secure: false,
        requireTLS: true,
        tls: {
            rejectUnauthorized: false
        },
        port: port
        // ,
        // auth: {
        //   user: 'user@user.com',
        //   pass: 'password'
        // }
    })
    return transport
}

const userCreated = async (email, user, id) => {

    const config = await getConfig('email')
    if(config){
        fqdn = `${config.endpointProtocol}://${config.endpointFQDN}:${config.endpointPort}`
        from = config.emailFrom
        support = config.emailSupport
    }
    const body = `<strong>Thank you for joining our Service!</strong><br>
    To finish registration, we just need you to confirm that you indeed received this email.<br>
    To confirm, please click the link below.<br><br>
    <a href="${fqdn}/users/${id}/confirm"><strong>/Confirm</strong></a><br>
    `

    const subject = `Welcome user, ${user} please confirm`

    var msg = {
        to: email,
        from,
        subject,
        html: body,  
    }
    // debugging
    logger.log('info',`${moment()} ${msg.subject}`)
    if(config.isEnabled){
        if(config.provider === 'api'){
            await sendGrid.send(msg)
        }
        if(config.provider === 'email'){
            const transport = await createUnSecureTransport(config.relayHost, config.replayPort)
            const info = await transport.sendMail(msg)
            if(config.replayLogger){
                logger.log('info',`${moment()} message sendMail ${info.messageId}`)
            }
        }
    }
} 

const userJsonWebToken = async (email, jwt, user, limit) => {

    const config = await getConfig('email')
    if(config){
        fqdn = `${config.endpointProtocol}://${config.endpointFQDN}:${config.endpointPort}`
        from = config.emailFrom
        support = config.emailSupport
    }

    const body = `<strong>Good going!</strong><br>
    A (JWT) has been allocated to your account.<br>
    ${jwt}<br>\
    Important Note: we limit ${limit} per account of which every login will auto-generate a brand new token and possibly override existing.<br><br>
    <a href="${fqdn}/users/login"><strong>/Login</strong></a><br>
    `

    const subject = `Account token, ${user} web token created`

    var msg = {
        to: email,
        from,
        subject,
        html: body,  
    }
    // debugging
    logger.log('info',`${moment()} ${msg.subject}`)
    if(config.isEnabled){
        if(config.provider === 'api'){
            await sendGrid.send(msg)
        }
        if(config.provider === 'email'){
            const transport = await createUnSecureTransport(config.relayHost, config.replayPort)
            const info = await transport.sendMail(msg)
            if(config.replayLogger){
                logger.log('info',`${moment()} message sendMail ${info.messageId}`)
            }
        }
    }
}

const userJWTExpiring = async (email, user) => {

    const config = await getConfig('email')
    if(config){
        fqdn = `${config.endpointProtocol}://${config.endpointFQDN}:${config.endpointPort}`
        from = config.emailFrom
        support = config.emailSupport
    }
    
    const body = `<strong>Look out!</strong><br>
    A (JWT) used by your account is about to expire.<br>
    If you require a renewal, please click on the link below.<br><br>
    <a href="${fqdn}/users/login"><strong>/Login</strong></a><br>
    `

    const subject = `Account token, ${user} about to expire`

    var msg = {
        to: email,
        from,
        subject,
        html: body,  
    }
    // debugging
    logger.log('info',`${moment()} ${msg.subject}`)
    if(config.isEnabled){
        if(config.provider === 'api'){
            await sendGrid.send(msg)
        }
        if(config.provider === 'email'){
            const transport = await createUnSecureTransport(config.relayHost, config.replayPort)
            const info = await transport.sendMail(msg)
            if(config.replayLogger){
                logger.log('info',`${moment()} message sendMail ${info.messageId}`)
            }
        }
    }
}

const userReset = async (email, user, id) => {

    const config = await getConfig('email')
    if(config){
        fqdn = `${config.endpointProtocol}://${config.endpointFQDN}:${config.endpointPort}`
        from = config.emailFrom
        support = config.emailSupport
    }
    
    const body = `<strong>We noticed you have failed to login!</strong><br>
    A random password will be provided.<br>
    To confirm, please click on the link below.<br><br>
    <a href="${fqdn}/users/${id}/reset"><strong>/Reset</strong></a><br>
    `

    const subject = `Account locked, ${user}`

    var msg = {
        to: email,
        from,
        subject,
        html: body,  
    }
    // debugging
    logger.log('info',`${moment()} ${msg.subject}`)
    if(config.isEnabled){
        if(config.provider === 'api'){
            await sendGrid.send(msg)
        }
        if(config.provider === 'email'){
            const transport = await createUnSecureTransport(config.relayHost, config.replayPort)
            const info = await transport.sendMail(msg)
            if(config.replayLogger){
                logger.log('info',`${moment()} message sendMail ${info.messageId}`)
            }
        }
    }
}

const userModified = async (email, user, id) => {

    const config = await getConfig('email')
    if(config){
        fqdn = `${config.endpointProtocol}://${config.endpointFQDN}:${config.endpointPort}`
        from = config.emailFrom
        support = config.emailSupport
    }
    
    const body = `<strong>We noticed your account was modified!</strong><br>
    To confirm this was you, please click on the link below.<br><br>
    <a href="${fqdn}/users/${id}/confirm?userModified=true"><strong>/Confirm</strong></a><br>
    `

    const subject = `Account modified, ${user} please confirm`

    var msg = {
        to: email,
        from,
        subject,
        html: body,  
    }
    // debugging
    logger.log('info',`${moment()} ${msg.subject}`)
    if(config.isEnabled){
        if(config.provider === 'api'){
            await sendGrid.send(msg)
        }
        if(config.provider === 'email'){
            const transport = await createUnSecureTransport(config.relayHost, config.replayPort)
            const info = await transport.sendMail(msg)
            if(config.replayLogger){
                logger.log('info',`${moment()} message sendMail ${info.messageId}`)
            }
        }
    }
}

const addressTrueCount = async (email, address, userId, addressId, count) => {

    const config = await getConfig('email')
    if(config){
        fqdn = `${config.endpointProtocol}://${config.endpointFQDN}:${config.endpointPort}`
        from = config.emailFrom
        support = config.emailSupport
    }
    
    const body = `<strong>We noticed your IP Address is invisible!</strong><br>
    If you wish to keep this allocated to your account and not released back into the wild, please click on the link or alternatively contact the network address administrator:<br><br>
    <a href="${fqdn}/configs/ports/suggest?config.${userId}\:${count}\:${addressId}&port=n"><strong>/Configure</strong></a><br><br>
    Any questions, contact ${support}.<br>
    `

    const subject = `This address is invisible, ${address}, weeks inactive ${count}`

    var msg = {
        to: email,
        from,
        subject,
        html: body,  
    }
    // debugging
    logger.log('info',`${moment()} ${msg.subject}`)
    if(config.isEnabled){
        if(config.provider === 'api'){
            await sendGrid.send(msg)
        }
        if(config.provider === 'email'){
            const transport = await createUnSecureTransport(config.relayHost, config.replayPort)
            const info = await transport.sendMail(msg)
            if(config.replayLogger){
                logger.log('info',`${moment()} message sendMail ${info.messageId}`)
            }
        }
    }
}

const addressTrueCountWarn = async (email, owner, address, userId, addressId, count, fp) => {

    const config = await getConfig('email')
    if(config){
        fqdn = `${config.endpointProtocol}://${config.endpointFQDN}:${config.endpointPort}`
        from = config.emailFrom
        support = config.emailSupport
    }
    
    const body = `<strong>We noticed your IP Address is invisible!</strong><br>
    If you wish to keep this allocated to your account and not released back into the wild, please click on the link or alternatively contact the network address administrator:<br><br>
    <a href="${fqdn}/configs/ports/suggest?conf=${userId}\:${count}\:${addressId}&port=n"><strong>/Configure</strong></a><br><br>
    Any questions, contact ${support}.<br>
    `
    const dDay = fp - count
    const subject = `this address is invisible, ${address}, removal in ${dDay} weeks`
    
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
    logger.log('info',`${moment()} ${msg.subject}`)
    if(config.isEnabled){
        if(config.provider === 'api'){
            await sendGrid.send(msg)
        }
        if(config.provider === 'email'){
            const transport = await createUnSecureTransport(config.relayHost, config.replayPort)
            const info = await transport.sendMail(msg)
            if(config.replayLogger){
                logger.log('info',`${moment()} message sendMail ${info.messageId}`)
            }
        }
    }
}

const networkConfirm = async (email, id, network) => {

    const config = await getConfig('email')
    if(config){
        fqdn = `${config.endpointProtocol}://${config.endpointFQDN}:${config.endpointPort}`
        from = config.emailFrom
        support = config.emailSupport
    }
    
    const body = `<strong>Good going!</strong><br>
    This Network has been allocated to your account. You will need to confirm when ready before address allocation can occur.<br>
    ${id}
    Important Note: Please review before you proceed as specific properties, in particular the exclusion(s) will ensure certain addresses are kept out of the scope.<br><br>
    <a href="${fqdn}/users/my/networks"><strong>/Networks</strong></a><br><br>
    <a href="${fqdn}/networks/${id}"><strong>/Config</strong></a><br><br>
    <a href="${fqdn}/networks/${id}/confirm"><strong>/Confirm</strong></a><br><br>
    Any questions, contact ${support}.<br>
    `

    const subject = `Network, ${network} please confirm`

    var msg = {
        to: email,
        from,
        subject,
        html: body,  
    }
    // debugging
    logger.log('info',`${moment()} ${msg.subject}`)
    if(config.isEnabled){
        if(config.provider === 'api'){
            await sendGrid.send(msg)
        }
        if(config.provider === 'email'){
            const transport = await createUnSecureTransport(config.relayHost, config.replayPort)
            const info = await transport.sendMail(msg)
            if(config.replayLogger){
                logger.log('info',`${moment()} message sendMail ${info.messageId}`)
            }
        }
    }
}


module.exports = {
    userCreated,
    userJsonWebToken,
    userJWTExpiring,
    userReset,
    userModified, 
    addressTrueCount,
    addressTrueCountWarn,
    networkConfirm
}