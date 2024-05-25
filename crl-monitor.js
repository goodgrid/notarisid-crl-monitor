import util from 'util'
import axios from 'axios'
import { exec } from 'child_process'
import { parse, differenceInMinutes } from 'date-fns'
import { twilio } from './twilio.js'
import { isHeartbeatDue, validEncodedCrl } from './utils.js'
import config from './config.js'

const pExec = util.promisify(exec)

/*
    To have assurance that monitoring is functional, a heartbeat is sent daily to the configured
    recipients. If the configured time range in which heartbeat is to be sent is invalid, it will
    be sent. This results in repeatedly received heartbeats indicating a configuration issue.
*/
if (isHeartbeatDue(config.heartbeatTimeRange)) {    
    twilio.send(`Good morning, a new day of monitoring! This heartbeat is meant to inform you that NotarisID CRL Monitor is functional. This heartbeat is sent every time the monitor runs between the daily time range of ${config.heartbeatTimeRange}.`)
}

/*
    This object is used throughout the routine to keep unexepected situations.
*/
const status = {
    ok: true,
    messages: []
}

try {
    /*
        Retrieving the CRL from the URL where it should be available, according to
        NotarisID CP/CPS. This URL is configured. If the HTTP request returns an
        HTTP error code or exception, this indicates a problem which is notified upon.
    */
    const response = await axios.get(config.crlUrl, {
        responseType: 'text',
    })

    /*
        We exepect a plain text string containing an X.509 CRL. We are checking if that is
        what we received. Not recieving such an encoded CRL indicates a problem which is
        notified upon.
    */
    if (!validEncodedCrl(response.data)) {
        throw new Error("Received response is not an encoded CRL")
    } 

    try {
        /*
            OpenSSL is called to decode the X509 CRL. Any exception while doing so indicates
            a problem which is notified upon.
        */
        const { stdout, stderr } = await pExec(`echo '${response.data}' | ${config.opensslPath} crl -inform PEM -text -noout`)
    
        /*
            OpenSSL response is parsed using regular expressions. If the regular expression does not
            match, that fact is considered a problem which is notified upon.

            The issuer is formatted as a distinguished name. We are filtering out the CN part, but 
            OpenSSL on development environments (Mac) formats the DN differently than on production
            (Alpine Linux), this difference is reflected in the regex allowing for either one or no 
            spaces in "CN = [Issuer]"
        */
        const reLastUpdated = /^\s+Last Update: (.*)$/m
        const reIssuer = /^\s+Issuer:.*CN\s?=\s?(.*)$/m
        const crlLastUpdatedMatch = stdout.match(reLastUpdated)
        const crlIssuerMatch = stdout.match(reIssuer)
    
        if (crlLastUpdatedMatch === null || crlIssuerMatch === null) {
            if (config.debug) console.log(stdout)
            throw new Error("Decoded CRL does not contain expected fields 'Last Update' and/or 'Issuer'")            
        }   

        const crlLastUpdated = crlLastUpdatedMatch[1]
        const crlIssuer = crlIssuerMatch[1]


        /*
            The Last Updated property of the CRL is returned by OpenSSL in a ctime notation. We 
            are transforming that to a valid javascript date. The difference between the Last Updated
            date and the current date is calculated and compared to the configured acceptable 
            difference. Exceeding the acceptable diffeference is a situation which is notified upon.

            The result of comparison between actual lifetime and acceptable lifetime is always logged 
            to enable us to check functioning via logging/stdout
        */
        const lastUpdatedTime = parse(`${crlLastUpdated}+0000`, "MMM d H:m:s y 'GMT'xx", new Date())
        const crlLifetimeMinutes = differenceInMinutes(new Date(), lastUpdatedTime)
    
        console.log(`CRL for ${crlIssuer} was last generated ${crlLifetimeMinutes} minutes ago.`)
    
        if (crlLifetimeMinutes > config.crlAcceptableLifetimeMinutes) {
            status.ok = false
            status.messages.push(`CRL for ${crlIssuer} was last generated ${crlLifetimeMinutes} minutes ago. This exceeds the acceptable lifetime of ${config.crlAcceptableLifetimeMinutes} minutes.`)
        }
    } catch(error) {
        /*
            Exception handling is used to have watertight notifications of any problem with 
            availability of the CRL at the exepected URL.
        */
        console.error(`Error parsing CRL or comparing dates`)
        if (config.debug) console.error(error)

        status.ok = false
        status.messages.push(`Unexpected error '${error}' while parsing CRL or comparing dates`)
    }
        
} catch(error) {
    /*
        Exception handling is used to have watertight notifications of any problem with 
        availability of the CRL at the exepected URL.
    */

    console.error(`Error retrieving CRL URL at ${config.crlUrl}`)
    if (config.debug) console.error(error)

    if (error.response) {
        status.ok = false
        status.messages.push(`Unexpected response status '${error.response.status}' was returned while retrieving the CRL URL.`)
    } else {
        status.ok = false
        status.messages.push(`Unexpected error '${error}' was returned while retrieving the CRL URL.`)
    }
    
}

/*
    Any unexpected situation in the CRL or in the routines to retrieve is was kept in the status
    object. When status is not OK, a notification is being sent.
*/
if (!status.ok) {
    twilio.send(status.messages.join(", "))
}
