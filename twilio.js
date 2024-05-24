import axios from "axios"
import config from './config.js'

const twilioApi = axios.create({
    baseURL: config.twilioUrl,
    headers: {
        Authorization: `Basic ${Buffer.from(`${config.twilioUsername}:${config.twilioPassword}`).toString("base64")}`
    }
})

export const twilio = {
    send: async (message) => {
        try {
            for (const recipientPhoneNumber of config.recipientsPhoneNumbers.split(",")) {
                if (config.debug) console.log(`Sending message to ${recipientPhoneNumber}`)
                const response = await twilioApi.post("Messages.json",new URLSearchParams({
                    To:  recipientPhoneNumber,
                    From: config.twilioPhoneNumber,
                    Body: message
                }))
                //TODO: Check for response and implement error handling
            }
            
        } catch(error) {
            return error
        }
    }
}