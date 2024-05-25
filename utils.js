

export const validEncodedCrl = (encodedCrl) => {

    /*
        Whe are expecting a base encoded string containing + / and = characters,
        upper and lower case alphanumeric characters and numbers between 0 and 9.
        Base64 ecoded string must be surrounded by BEGIN/END indications. X509 
        seems to contain a whiteline after the end indication. Since we're not
        sure, we're not adding beginning/ending of string expressions.
    */
    const re = /-----BEGIN X509 CRL-----[\n[A-z0-9\/+=]+-----END X509 CRL-----/g
    return (encodedCrl.match(re)) ? true : false
}

export const truncateMessage = (message) => {
    /*
        Based on Twilio documentation, we are truncating messages longer than 320 
        characters. Twilio would only return an error for messages longer than
        1600 characters, but we dont need to send javascript stack traces over SMS.
        
        If a message is truncated, the complete message is logged to stdout.
        
        https://help.twilio.com/articles/360033806753-Maximum-Message-Length-with-Twilio-Programmable-Messaging
    */
    const maxLength = 320
    const truncationIndication = " (..truncated..)"
    if (message.length > maxLength) {
        logger(`Notification message was truncated. Truncated message logged next.`)
        logger(message)
        return `${message.substring(0, maxLength - truncationIndication.length)}${truncationIndication}`
    }
   return message
}


export const isHeartbeatDue = (configuredRange) => {
    /*
        This function checks wether the current time is within the configured date range.
        It is doing it by concatenating hours and minutes into an integer and doing a 
        simple comparison. Any misconfigurations result in a caught exception. Caught
        exceptions result in the function to return true, causing the heartbeat to be sent,
        possibly repeatedly indicating a configuration problem.
    */
    try {
        const currentTime = new Date().toLocaleTimeString("nl-NL")
        const currentTimeAsInteger = Number(`${currentTime.split(":")[0]}${currentTime.split(":")[1]}`)
        const rangeStartAsInteger =  Number(`${configuredRange.split("-")[0].split(":")[0]}${configuredRange.split("-")[0].split(":")[1]}`)
        const rangeEndAsInteger =  Number(`${configuredRange.split("-")[1].split(":")[0]}${configuredRange.split("-")[1].split(":")[1]}`)
    
        if (isNaN(rangeStartAsInteger) || isNaN(rangeEndAsInteger)) {
            throw new Error("Error parsing heartbeat configured date range")
        }

        if (currentTimeAsInteger >= rangeStartAsInteger && currentTimeAsInteger < rangeEndAsInteger) {
            return true
        }
        return false

    } catch(error) {
        console.error(`An error occured while calculating with the configured heartbeat time range ${configuredRange}. No separeate message is sent about this fact, but instead the heartbeat is considered due. This means that the heartbeat will be repeatedly sent. The expected notation of the heartbeatTimeRange is 'HH:MM-HH-MM'`)
        return true
    }
}

export const logger = (message) => {
    console.log(`${new Date().toLocaleString("nl-NL")} - ${message}`)
}