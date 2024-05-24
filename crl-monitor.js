import util from 'util'
import axios from 'axios'
import { exec } from 'child_process'
import { parse, differenceInMinutes } from 'date-fns'
import { twilio } from './twilio.js'
import config from './config.js'

const pExec = util.promisify(exec)

const response = await axios.get(config.crlUrl, {
    responseType: 'text',
})

try {
    const { stdout, stderr } = await pExec(`echo '${response.data}' | ${config.opensslPath} crl -inform PEM -text -noout`)

    const reLastUpdated = /^\s+Last Update: (.*)$/m
    const reIssuer = /^\s+Issuer:.*CN=(.*)$/m

    const crlLastUpdated = stdout.match(reLastUpdated)[1]
    const crlIssuer = stdout.match(reIssuer)[1]

    const lastUpdatedTime = parse(`${crlLastUpdated}+0000`, "MMM d H:m:s y 'GMT'xx", new Date())

    const crlLifetimeMinutes = differenceInMinutes(new Date(), lastUpdatedTime)

    if (config.debug) console.log(`CRL for ${crlIssuer} was last generated ${crlLifetimeMinutes} minutes ago.`)

    if (crlLifetimeMinutes > config.crlAcceptableLifetimeMinutes) {
        const message = `CRL for ${crlIssuer} was last generated ${crlLifetimeMinutes} minutes ago. This exceeds the acceptable lifetime of ${config.crlAcceptableLifetimeMinutes}`
        if (config.debug) console.log(message)
        await twilio.send(message)    
    }
} catch(err) {
    console.error("Something went wrong while viewing the CRL and/or comparing the current time with the last updated time.")
    console.error(err)
}

