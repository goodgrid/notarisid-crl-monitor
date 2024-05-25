import axios from "axios"
import config from './config.js'
import { truncateMessage, logger } from "./utils.js"

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
                if (config.debug) logger(`Sending message to ${recipientPhoneNumber}`)
                await twilioApi.post("Messages.json",new URLSearchParams({
                    To:  recipientPhoneNumber,
                    From: config.twilioPhoneNumber,
                    Body: truncateMessage(message)
                }))
                
            }
            
        } catch(error) {
            console.error(`ERROR while sending '${message}' message to ${config.recipientsPhoneNumbers}`)
            console.error(error.response ? error.response.data : (error.cause ? error.cause : error))
        }
    }
}